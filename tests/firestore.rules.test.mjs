import { after, before, test } from "node:test";
import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  where,
} from "firebase/firestore";

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-vahanova-rules",
    firestore: { rules: await readFile("firestore.rules", "utf8") },
  });
});

after(async () => {
  await env?.cleanup();
});

async function seed() {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", "provider-1"), { role: "mechanic", email: "provider@example.com" });
    await setDoc(doc(db, "users", "provider-2"), { role: "mechanic", email: "provider2@example.com" });
    await setDoc(doc(db, "users", "customer-1"), { role: "customer", email: "customer@example.com" });
    await setDoc(doc(db, "publicProviders", "provider-1"), {
      name: "Test Provider", area: "Central", active: true, vehicleTypes: [], services: [],
    });
    await setDoc(doc(db, "publicProviders", "provider-2"), {
      name: "Second Provider", area: "Central", active: true, vehicleTypes: [], services: [],
    });
    await setDoc(doc(db, "providerPrivate", "provider-1"), {
      phone: "9999999999", coord: [30.3, 78.0], upi: "provider@upi",
    });
    await setDoc(doc(db, "bookings", "completed-1"), {
      customerId: "customer-1", mechanicId: "provider-1", status: "completed",
      mechanicName: "Test Provider", code: "VP1001",
    });
    await setDoc(doc(db, "bookings", "completed-2"), {
      customerId: "customer-1", mechanicId: "provider-1", status: "completed",
      mechanicName: "Test Provider", code: "VP1003",
    });
    await setDoc(doc(db, "bookings", "pending-1"), {
      customerId: "customer-1", mechanicId: null, status: "pending", code: "VP1002",
    });
    await setDoc(doc(db, "ratings", "private-rating-1"), {
      bookingId: "completed-1", customerId: "customer-1", providerId: "provider-1",
      vehicleNumber: "UK00AB1234", stars: 5, comment: "Private review",
    });
    await setDoc(doc(db, "openRequests", "pending-1"), {
      bookingId: "pending-1", code: "VP1002", service: "Puncture",
      kind: "bike", date: "2026-11-07", createdAt: "2026-11-07T00:00:00.000Z",
      status: "pending",
    });
  });
}

test("provider can read their own private details", async () => {
  await seed();
  const providerDb = env.authenticatedContext("provider-1", { email: "provider@example.com" }).firestore();
  await assertSucceeds(getDoc(doc(providerDb, "providerPrivate", "provider-1")));
});

test("operator can read provider private details", async () => {
  await seed();
  const operatorDb = env.authenticatedContext("operator-1", { email: "semanirudh94@gmail.com" }).firestore();
  await assertSucceeds(getDoc(doc(operatorDb, "providerPrivate", "provider-1")));
});

test("customer cannot read provider private details", async () => {
  await seed();
  const customerDb = env.authenticatedContext("customer-1", { email: "customer@example.com" }).firestore();
  await assertFails(getDoc(doc(customerDb, "providerPrivate", "provider-1")));
});

test("provider cannot read private customer rating details", async () => {
  await seed();
  const providerDb = env.authenticatedContext("provider-1", { email: "provider@example.com" }).firestore();
  const customerDb = env.authenticatedContext("customer-1", { email: "customer@example.com" }).firestore();
  await assertFails(getDoc(doc(providerDb, "ratings", "private-rating-1")));
  await assertSucceeds(getDoc(doc(customerDb, "ratings", "private-rating-1")));
});

test("provider cannot list private details for all providers", async () => {
  await seed();
  const providerDb = env.authenticatedContext("provider-1", { email: "provider@example.com" }).firestore();
  await assertFails(getDocs(collection(providerDb, "providerPrivate")));
});

test("providers see sanitized open requests but cannot read pending booking details", async () => {
  await seed();
  const providerDb = env.authenticatedContext("provider-1", { email: "provider@example.com" }).firestore();

  await assertSucceeds(getDocs(query(collection(providerDb, "openRequests"), where("status", "==", "pending"))));
  await assertFails(getDoc(doc(providerDb, "bookings", "pending-1")));
});


test("only one provider can atomically accept an open request", async () => {
  await seed();
  const provider1Db = env.authenticatedContext("provider-1", { email: "provider@example.com" }).firestore();
  const provider2Db = env.authenticatedContext("provider-2", { email: "provider2@example.com" }).firestore();

  async function accept(db, providerId, providerName) {
    return runTransaction(db, async (tx) => {
      const requestRef = doc(db, "openRequests", "pending-1");
      const request = await tx.get(requestRef);
      if (!request.exists() || request.data().status !== "pending") return false;

      tx.update(doc(db, "bookings", "pending-1"), {
        status: "assigned",
        mechanicId: providerId,
        mechanicName: providerName,
        mechanicPhone: "",
        mechanicArea: "Central",
        mechanicJobs: 0,
        mechanicUpi: "",
        mechanicCoord: null,
        etaMin: null,
        history: [{ s: "assigned", t: "2026-11-26T00:00:00.000Z" }],
      });
      tx.delete(requestRef);
      return true;
    });
  }

  assert.equal(await accept(provider1Db, "provider-1", "Test Provider"), true);
  assert.equal(await accept(provider2Db, "provider-2", "Second Provider"), false);

  const finalBooking = await getDoc(doc(provider1Db, "bookings", "pending-1"));
  assert.equal(finalBooking.data().mechanicId, "provider-1");
  await assertFails(getDoc(doc(provider1Db, "openRequests", "pending-1")).then((snap) => {
    if (snap.exists()) throw new Error("Consumed request should not exist");
  }));
});

test("customers can read only their own booking", async () => {
  await seed();
  const ownerDb = env.authenticatedContext("customer-1").firestore();
  const otherDb = env.authenticatedContext("customer-2").firestore();

  await assertSucceeds(getDoc(doc(ownerDb, "bookings", "completed-1")));
  await assertFails(getDoc(doc(otherDb, "bookings", "completed-1")));
});

test("only the customer on a completed booking can publish its sanitized review", async () => {
  await seed();
  const ownerDb = env.authenticatedContext("customer-1").firestore();
  const otherDb = env.authenticatedContext("customer-2").firestore();
  const review = {
    bookingId: "completed-1",
    providerId: "provider-1",
    providerName: "Test Provider",
    service: "Puncture",
    stars: 5,
    comment: "Good service",
    createdAt: "2026-11-07T00:00:00.000Z",
  };

  await assertSucceeds(setDoc(doc(ownerDb, "publicRatings", "completed-1"), review));
  await assertFails(setDoc(doc(otherDb, "publicRatings", "completed-2"), { ...review, bookingId: "completed-2" }));
});

test("new users cannot grant themselves provider role", async () => {
  await seed();
  const customerDb = env.authenticatedContext("new-user").firestore();
  const selfPromotedDb = env.authenticatedContext("self-promoted").firestore();

  await assertSucceeds(setDoc(doc(customerDb, "users", "new-user"), { role: "customer" }));
  await assertFails(setDoc(doc(selfPromotedDb, "users", "self-promoted"), { role: "mechanic" }));
});
