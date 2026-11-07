import { firebaseOn, auth } from "./firebase";

const AUTH_ERRORS = {
  "auth/invalid-email": "That email address doesn't look right. Please check it and try again.",
  "auth/missing-password": "Please enter your password.",
  "auth/weak-password": "Passwords need at least 6 characters.",
  "auth/email-already-in-use": "An account already exists for this email. Please sign in instead.",
  "auth/invalid-credential": "We couldn't find an account with that email and password. Try again, or use Continue with Google.",
  "auth/user-not-found": "We couldn't find an account with that email. Create one first.",
  "auth/wrong-password": "That password is incorrect. Please try again.",
  "auth/account-exists-with-different-credential":
    "This email is registered with Google. Use the Continue with Google button below.",
  "auth/too-many-requests": "Too many attempts from this device. Please try again in a few minutes.",
  "auth/network-request-failed": "Network problem. Check your internet connection and try again.",
  "auth/operation-not-allowed":
    "Email and password sign-in is not enabled on this Firebase project yet. Enable it under Authentication → Sign-in method.",
  "auth/api-key-not-valid": "Firebase key is not valid. Check .env.local.",
  "auth/user-disabled": "This account has been switched off. Contact support on WhatsApp.",
  "auth/invalid-continue-uri": "This web address isn't allowed to finish a password reset. Add it under Authentication → Settings → Authorized domains.",
  "auth/unauthorized-continue-url": "This web address isn't allowed to finish a password reset. Add it under Authentication → Settings → Authorized domains.",
  "auth/missing-continue-uri": "This web address isn't allowed to finish a password reset. Add it under Authentication → Settings → Authorized domains.",
};

const GOOGLE_ERRORS = {
  "auth/operation-not-allowed": "Google sign-in is not enabled on this Firebase project yet. Enable it under Authentication → Sign-in method.",
  "auth/unauthorized-domain": "This web address is not allowed to sign in yet. Add it under Authentication → Settings → Authorized domains.",
  "auth/popup-blocked": "Your browser blocked the Google sign-in window, so we are opening it as a full page instead.",
  "auth/operation-not-supported-in-this-environment": "This browser doesn't allow the Google pop-up window. Please allow pop-ups for this site, or use Chrome.",
  "auth/popup-closed-by-user": "Google sign-in was closed before it finished. Please try again.",
  "auth/cancelled-popup-request": "Another sign-in window is already open. Close it and try again.",
};

function codeOf(err) {
  return err?.code || "";
}

export function friendlyAuthError(err) {
  const code = codeOf(err);
  if (AUTH_ERRORS[code]) return AUTH_ERRORS[code];
  if (code) return "We couldn't sign you in right now. Please try again or contact support on WhatsApp.";
  return err?.message || "We couldn't sign you in. Please try again.";
}

export function friendlyGoogleError(err) {
  const code = codeOf(err);
  if (GOOGLE_ERRORS[code]) return GOOGLE_ERRORS[code];
  if (AUTH_ERRORS[code]) return AUTH_ERRORS[code];
  return err?.message || "Google sign-in didn't complete. Please try again.";
}

export function authReady() {
  return firebaseOn;
}

const REDIRECT_KEY = "vahanova_google_redirect";

// Only the full-page redirect needs a return-leg handler, and only for as long as a
// round trip to Google is still plausible. The pop-up resolves inside this window,
// so it must never leave a marker behind — otherwise the next /login visit waits on
// a sign-in that already finished.
export function markRedirectAttempt(role) {
  try {
    sessionStorage.setItem(REDIRECT_KEY, JSON.stringify({ role, at: Date.now() }));
  } catch {}
}

export function takeRedirectAttempt(maxAgeMs = 120000) {
  let raw = null;
  try {
    raw = sessionStorage.getItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_KEY);
  } catch {}
  if (!raw) return null;
  try {
    const { role, at } = JSON.parse(raw);
    return Date.now() - Number(at) <= maxAgeMs ? role : null;
  } catch {
    return null;
  }
}

// /signup: only ever creates. A taken email must send the person to /login, not
// silently log them into the account they already have.
export async function signUpEmailPassword(email, password) {
  if (!firebaseOn) throw new Error("Firebase is not connected yet.");
  const { createUserWithEmailAndPassword } = await import("firebase/auth");
  return createUserWithEmailAndPassword(await auth(), email, password);
}

// /login: only ever signs in.
export async function signInEmailPassword(email, password) {
  if (!firebaseOn) throw new Error("Firebase is not connected yet.");
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  return signInWithEmailAndPassword(await auth(), email, password);
}

// Installed PWA windows and hardened browsers drop the Google pop-up's session,
// so a full-page redirect is the only flow that reliably keeps the sign-in.
function isStandaloneWindow() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export async function signInWithGoogle(role) {
  if (!firebaseOn) throw new Error("Firebase is not connected yet.");
  const [
    { GoogleAuthProvider, signInWithPopup, signInWithRedirect, browserLocalPersistence, setPersistence },
    { auth: getAuthInstance },
  ] = await Promise.all([import("firebase/auth"), import("./firebase")]);
  const a = await getAuthInstance();
  // Without this the SDK can fall back to in-memory persistence, which loses the
  // session the moment the pop-up closes.
  await setPersistence(a, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  if (isStandaloneWindow()) {
    markRedirectAttempt(role);
    await signInWithRedirect(a, provider);
    return null;
  }
  try {
    return await signInWithPopup(a, provider);
  } catch (err) {
    const blocked = codeOf(err) === "auth/popup-blocked" || codeOf(err) === "auth/operation-not-supported-in-this-environment";
    if (!blocked) throw err;
    markRedirectAttempt(role);
    await signInWithRedirect(a, provider);
    return null;
  }
}

// getRedirectResult can hang for a long time when another tab already holds the
// auth storage lock, so the caller never waits on it indefinitely.
export async function completeGoogleRedirect() {
  if (!firebaseOn) return null;
  const [{ getRedirectResult }, { auth: getAuthInstance }] = await Promise.all([
    import("firebase/auth"),
    import("./firebase"),
  ]);
  const result = getRedirectResult(await getAuthInstance());
  return Promise.race([result, new Promise((resolve) => setTimeout(() => resolve(null), 4000))]);
}

export async function sendResetLink(email) {
  if (!firebaseOn) throw new Error("Firebase is not connected yet.");
  const [{ sendPasswordResetEmail }, { auth: getAuthInstance }] = await Promise.all([
    import("firebase/auth"),
    import("./firebase"),
  ]);
  // Without a return URL the reset lands on Firebase's own page, which has no way
  // back into VAHANOVA, so the person is stranded after changing their password.
  return sendPasswordResetEmail(await getAuthInstance(), email, {
    url: `${window.location.origin}/login`,
    handleCodeInApp: false,
  });
}

export async function signOutAuth() {
  if (!firebaseOn) return;
  const [{ signOut }, { auth: getAuthInstance }] = await Promise.all([
    import("firebase/auth"),
    import("./firebase"),
  ]);
  await signOut(await getAuthInstance());
}
