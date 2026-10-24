import { firebaseOn } from "./firebase";

let verifier = null;

export function otpReady() {
  return firebaseOn;
}

const FRIENDLY = {
  "auth/operation-not-allowed":
    "SMS verification for India is not enabled on this Firebase project yet. Add this number as a Firebase test number, or upgrade the project to the Blaze plan.",
  "auth/api-key-not-valid": "Firebase key is not valid. Check .env.local.",
  "auth/quota-exceeded": "Too many attempts. Please try again after some time.",
  "auth/invalid-phone-number": "Please enter a valid 10-digit mobile number.",
  "auth/too-many-requests": "Too many attempts from this device. Please try again in a few minutes.",
  "auth/network-request-failed": "Network problem. Check your internet connection and try again.",
  "auth/invalid-otp": "That code is incorrect. Please re-check the 6-digit code.",
  "auth/invalid-code": "That code is incorrect or has expired. Please request a new one.",
  "auth/session-expired": "That code has expired. Please request a new one.",
  "auth/popup-closed-by-user": "Google sign-in was closed before it finished. Please try again.",
  "auth/cancelled-popup-request": "Another sign-in window is already open. Close it and try again.",
};

const GOOGLE_ERRORS = {
  "auth/operation-not-allowed": "Google sign-in is not enabled on this Firebase project yet. Enable it under Authentication → Sign-in method.",
  "auth/unauthorized-domain": "This web address is not allowed to sign in yet. Add it under Authentication → Settings → Authorized domains.",
};

export function friendlyOtpError(err) {
  const code = err?.code || "";
  if (FRIENDLY[code]) return FRIENDLY[code];
  if (code) return "We couldn't complete phone verification right now. Please try again or contact support on WhatsApp.";
  return err?.message || "We couldn't verify that code. Please try again.";
}

export function friendlyGoogleError(err) {
  const code = err?.code || "";
  if (GOOGLE_ERRORS[code]) return GOOGLE_ERRORS[code];
  if (FRIENDLY[code]) return FRIENDLY[code];
  return err?.message || "Google sign-in didn't complete. Please try again.";
}

export async function signInWithGoogle() {
  if (!firebaseOn) throw new Error("Firebase is not connected yet.");
  const [{ GoogleAuthProvider, signInWithPopup }, { auth }] = await Promise.all([
    import("firebase/auth"),
    import("./firebase"),
  ]);
  const a = await auth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(a, provider);
}

// anchorId = the div rendered on the login page; invisible reCAPTCHA attaches to it
export async function sendOtp(phoneE164, anchorId) {
  if (!firebaseOn) throw new Error("Firebase is not connected yet. Add your keys to .env.local.");
  const [{ RecaptchaVerifier, signInWithPhoneNumber }, { auth }] = await Promise.all([
    import("firebase/auth"),
    import("./firebase"),
  ]);
  const a = await auth();
  if (!verifier) verifier = new RecaptchaVerifier(a, anchorId, { size: "invisible" });
  return signInWithPhoneNumber(a, phoneE164, verifier);
}
