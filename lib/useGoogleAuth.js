import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentUser, isLive, login } from "@/lib/db";
import { awaitSignedInUser } from "@/lib/firebase";
import { completeGoogleRedirect, friendlyGoogleError, signInWithGoogle, takeRedirectAttempt } from "@/lib/auth";

function landingFor(user, role) {
  if (!user?.name) return "/profile";
  return role === "mechanic" ? "/mechanic" : "/dashboard";
}

// Google and email sign-in both live here so /login and /signup finish a
// redirected Google attempt with identical rules.
export function useGoogleAuth(role) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLive) return;
    // Firebase opens the Google pop-up as its own window, and it loads this page too.
    // Running the completion logic there starts a second sign-in and leaves an
    // abandoned Google page on screen — that window only hands the credential back.
    if (window.opener) return;

    const pendingRole = takeRedirectAttempt();

    // No redirect in flight: the form shows straight away, and anyone holding an
    // earlier session is quietly landed instead of being asked again.
    if (!pendingRole) {
      currentUser().then((u) => u && router.replace(landingFor(u, u.role)));
      return;
    }

    setWaiting(true);
    (async () => {
      try {
        const result = await completeGoogleRedirect();
        const fu = result?.user || (await awaitSignedInUser());
        if (!fu) {
          setWaiting(false);
          setError("Google didn't finish sending your sign-in back to this page. Tap Continue with Google to try again.");
          return;
        }
        const u = await login({ name: fu.displayName || "", email: fu.email, role: pendingRole });
        router.replace(landingFor(u, u.role || pendingRole));
      } catch (err) {
        setWaiting(false);
        setError(friendlyGoogleError(err));
      }
    })();
  }, [router]);

  async function startGoogle() {
    setBusy(true);
    setError("");
    try {
      const result = await signInWithGoogle(role);
      // null means this window is on its way to Google and back.
      if (!result) {
        setWaiting(true);
        return;
      }
      const u = await login({ name: result.user?.displayName || "", email: result.user?.email || "", role });
      router.replace(landingFor(u, u.role || role));
    } catch (err) {
      setError(friendlyGoogleError(err));
    } finally {
      setBusy(false);
    }
  }

  return { router, busy, setBusy, waiting, error, setError, startGoogle };
}
