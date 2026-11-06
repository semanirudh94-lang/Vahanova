import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentUser, isLive, login } from "@/lib/db";
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
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLive) return;
    completeGoogleRedirect()
      .then(async (result) => {
        const pendingRole = sessionStorage.getItem(PENDING_ROLE) || "customer";
        if (result?.user) {
          sessionStorage.removeItem(PENDING_ROLE);
          const u = await login({ name: result.user.displayName || "", email: result.user.email, role: pendingRole });
          router.replace(landingFor(u, pendingRole));
          return;
        }
        // Already signed in from an earlier visit — don't show the form again.
        const u = await currentUser();
        if (u) router.replace(landingFor(u, u.role));
        else setBusy(false);
      })
      .catch((err) => {
        setError(friendlyGoogleError(err));
        setBusy(false);
      });
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

  return { router, busy, setBusy, error, setError, startGoogle };
}
