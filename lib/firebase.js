export const FB_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Jab tak tu .env.local me apni project ki values na daale, app browser-local demo pe chalta rahega.
export const firebaseOn = Boolean(
  FB_CONFIG.apiKey && FB_CONFIG.projectId && FB_CONFIG.appId
);

let _app = null;
let _db = null;
let _auth = null;

// SDK ko sirf tab bundle karo jab keys bhari hui ho — warna har page pe ~180 kB extra load hota.
async function boot() {
  if (!firebaseOn || typeof window === "undefined") return null;
  if (_app) return _app;
  const [{ initializeApp, getApps, getApp }, { getFirestore }, { getAuth }] = await Promise.all([
    import("firebase/app"),
    import("firebase/firestore"),
    import("firebase/auth"),
  ]);
  _app = getApps().length ? getApp() : initializeApp(FB_CONFIG);
  _db = getFirestore(_app);
  _auth = getAuth(_app);
  return _app;
}

export async function firestore() {
  await boot();
  return _db;
}

export async function auth() {
  await boot();
  return _auth;
}

// Firebase restores a persisted session asynchronously after a page load, so the
// first read can be null even when the customer is actually signed in.
export async function signedInUser() {
  const a = await auth();
  if (!a) return null;
  if (a.currentUser) return a.currentUser;
  const { onAuthStateChanged } = await import("firebase/auth");
  return new Promise((resolve) => {
    const off = onAuthStateChanged(
      a,
      (u) => {
        off();
        resolve(u);
      },
      () => {
        off();
        resolve(null);
      }
    );
  });
}
