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
    await setDoc(doc(db, "users", "customer-1"), { role: "customer", email: "customer@example.com" });
    await setDoc(doc(db, "publicProviders", "provider-1"), {
      name: "Test Provider", area: "Central", active: true, vehicleTypes: [], services: [],
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
    await setDoc(doc(db, "openRequests", "pending-1"), {
      bookingId: "pending-1", code: "VP1002", service: "Puncture",
      kind: "bike", date: "2026-11-07", createdAt: "2026-11-07T00:00:00.000Z",
      status: "pending",
    });
  });
}

test("provider private details are visible only to the provider and operator", async () => {
  await seed();
  const providerDb = env.authenticatedContext("provider-1", { email: "provider@example.com" }).firestore();
  const customerDb = env.authenticatedContext("customer-1", { email: "customer@example.com" }).firestore();
  const operatorDb = env.authenticatedContext("operator-1", { email: "semanir@gmail.com" }).firestore();

  await assertSucceeds(getDoc(doc(providerDb, "providerPrivate", "provider-1")));
  await assertSucceeds(getDoc(doc(operatorDb, "providerPrivate", "provider-1")));
  await assertFails(getDoc(doc(customerDb, "providerPrivate", "provider-1")));
  await assertFails(getDocs(collection(providerDb, "providerPrivate")));
});

test("providers see sanitized open requests but cannot read pending booking details", async () => {
  await seed();
  const providerDb = env.authenticatedContext("provider-1", { email: "provider@example.com" }).firestore();

  await assertSucceeds(getDocs(query(collection(providerDb, "openRequests"), where("status", "==", "pending"))));
  await assertFails(getDoc(doc(providerDb, "bookings", "pending-1")));
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
