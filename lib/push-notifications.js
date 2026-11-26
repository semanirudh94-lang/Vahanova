import { FB_CONFIG, FCM_VAPID_KEY, firebaseOn, firestore, signedInUser } from "@/lib/firebase";

async function messagingForMechanic({ requestPermission = false } = {}) {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("This browser does not support push notifications. Open VAHANOVA in Chrome on Android.");
  }
  if (!window.isSecureContext) {
    throw new Error("Push notifications require the secure VAHANOVA website.");
  }
  if (!firebaseOn) {
    throw new Error("Firebase is not configured for this deployment.");
  }
  if (!FB_CONFIG.messagingSenderId) {
    throw new Error("Firebase Messaging Sender ID is missing from this deployment.");
  }
  if (!FCM_VAPID_KEY) {
    throw new Error("Push notifications need the Firebase Web Push VAPID public key in Vercel.");
  }

  let permission = Notification.permission;
  if (permission !== "granted" && requestPermission) {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    throw new Error(permission === "denied"
      ? "Notifications are blocked for this site. Allow them in your browser's site settings."
      : "Allow notifications to receive new service requests.");
  }

  const user = await signedInUser();
  if (!user) throw new Error("Please sign in again to enable request alerts.");
  const db = await firestore();
  if (!db) throw new Error("Firebase could not connect. Please try again.");
  const [{ doc, getDoc, setDoc, arrayUnion, serverTimestamp }, { getApp }, { getMessaging, getToken, isSupported }] =
    await Promise.all([
      import("firebase/firestore"),
      import("firebase/app"),
      import("firebase/messaging"),
    ]);

  const userSnap = await getDoc(doc(db, "users", user.uid));
  if (!userSnap.exists() || userSnap.data().role !== "mechanic") {
    throw new Error("Only approved service-provider accounts can enable mechanic request alerts.");
  }
  if (!(await isSupported())) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  const registration = await navigator.serviceWorker.ready;
  const messaging = getMessaging(getApp());
  const token = await getToken(messaging, {
    vapidKey: FCM_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("Firebase did not create a device notification token.");

  await setDoc(doc(db, "mechanicDevices", user.uid), {
    tokens: arrayUnion(token),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return { messaging, onMessage: (await import("firebase/messaging")).onMessage };
}

export async function enableMechanicPush() {
  await messagingForMechanic({ requestPermission: true });
  return true;
}

export async function syncMechanicPushIfAllowed() {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }
  await messagingForMechanic({ requestPermission: false });
  return true;
}

export async function listenForMechanicPush(callback) {
  const result = await messagingForMechanic({ requestPermission: false });
  return result.onMessage(result.messaging, (payload) => callback(payload.data || {}));
}
