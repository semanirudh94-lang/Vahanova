const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

initializeApp();

const db = getFirestore();
const messaging = getMessaging();

function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

exports.notifyMechanicsOfNewRequest = onDocumentCreated(
  "openRequests/{requestId}",
  async (event) => {
    const request = event.data?.data();
    const requestId = event.params.requestId;
    if (!request || request.status !== "pending") return;

    // A short lease prevents concurrent/retried trigger deliveries from
    // notifying the same devices twice. Failed sends can be retried.
    const dispatchRef = db.doc(`notificationDispatches/${requestId}`);
    const claimed = await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(dispatchRef);
      const data = existing.data() || {};
      if (data.status === "sent") return false;
      const leaseAt = data.updatedAt?.toMillis?.() || 0;
      if (data.status === "sending" && Date.now() - leaseAt < 120000) return false;
      transaction.set(dispatchRef, {
        status: "sending",
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return true;
    });
    if (!claimed) return;

    try {
      const deviceSnapshot = await db.collection("mechanicDevices").get();
      const eligibleDevices = await Promise.all(deviceSnapshot.docs.map(async (deviceDoc) => {
        const mechanicId = deviceDoc.id;
        const [userSnap, providerSnap] = await Promise.all([
          db.doc(`users/${mechanicId}`).get(),
          db.doc(`publicProviders/${mechanicId}`).get(),
        ]);
        if (!userSnap.exists || userSnap.data().role !== "mechanic") return null;
        if (!providerSnap.exists || providerSnap.data().active === false) return null;
        const tokens = Array.isArray(deviceDoc.data().tokens) ? deviceDoc.data().tokens : [];
        return { mechanicId, tokens: [...new Set(tokens.filter((token) => typeof token === "string" && token.length > 0))] };
      }));

      const tokenOwners = new Map();
      for (const device of eligibleDevices.filter(Boolean)) {
        for (const token of device.tokens) tokenOwners.set(token, device.mechanicId);
      }
      const tokens = [...tokenOwners.keys()];
      const service = String(request.service || "Vehicle service").slice(0, 100);
      const isEmergency = String(request.kind || "").toLowerCase().includes("emergency");
      const title = isEmergency ? "Emergency service request" : "New service request";
      const body = `${service}${request.code ? ` · #${String(request.code).slice(0, 20)}` : ""} — open VAHANOVA to respond.`;
      let sentCount = 0;
      const invalidTokens = [];

      for (const tokenBatch of chunks(tokens, 500)) {
        const response = await messaging.sendEachForMulticast({
          tokens: tokenBatch,
          data: {
            title,
            body,
            requestId: String(requestId),
            tag: `vahanova-request-${requestId}`,
            url: "/mechanic#requests",
          },
          webpush: {
            headers: { Urgency: "high", TTL: "300" },
          },
        });
        sentCount += response.successCount;
        response.responses.forEach((result, index) => {
          if (!result.success && [
            "messaging/registration-token-not-registered",
            "messaging/invalid-registration-token",
          ].includes(result.error?.code)) {
            invalidTokens.push(tokenBatch[index]);
          }
        });
      }

      await Promise.all(invalidTokens.map((token) => {
        const ownerId = tokenOwners.get(token);
        return ownerId
          ? db.doc(`mechanicDevices/${ownerId}`).update({ tokens: FieldValue.arrayRemove(token) })
          : Promise.resolve();
      }));

      await dispatchRef.set({
        status: "sent",
        sentCount,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      await dispatchRef.set({
        status: "failed",
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      throw error;
    }
  }
);
