import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentUser, isLive, login } from "@/lib/db";
import { awaitSignedInUser } from "@/lib/firebase";
import { completeGoogleRedirect, friendlyGoogleError, signInWithGoogle } from "@/lib/auth";

const PENDING_ROLE = "vahanova_pending_role";

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
    const pendingRole = sessionStorage.getItem(PENDING_ROLE);

    // A plain visit, not a return from Google: land anyone already signed in.
    if (!pendingRole) {
      currentUser().then((u) => u && router.replace(landingFor(u, u.role)));
      return;
    }

    // Returning from Google's page. The account can still be in flight when this
    // effect runs, so the form is replaced by a waiting state until it lands.
    setWaiting(true);
    (async () => {
      try {
        const result = await completeGoogleRedirect();
        const fu = result?.user || (await awaitSignedInUser());
        sessionStorage.removeItem(PENDING_ROLE);
        if (!fu) {
          setError("Google didn't finish sending your sign-in back to this page. Tap Continue with Google to try again.");
          return;
        }
        const u = await login({ name: fu.displayName || "", email: fu.email, role: pendingRole });
        router.replace(landingFor(u, pendingRole));
      } catch (err) {
        setError(friendlyGoogleError(err));
      } finally {
        setWaiting(false);
      }
    })();
  }, [router]);

  async function startGoogle() {
    setBusy(true);
    setError("");
    try {
      sessionStorage.setItem(PENDING_ROLE, role);
      const result = await signInWithGoogle();
      if (!result) return;
      const u = await login({ name: result.user?.displayName || "", email: result.user?.email || "", role });
      router.replace(landingFor(u, role));
    } catch (err) {
      sessionStorage.removeItem(PENDING_ROLE);
      setError(friendlyGoogleError(err));
      setBusy(false);
    }
  }

  return { router, busy, setBusy, waiting, error, setError, startGoogle };
}
