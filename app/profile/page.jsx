"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { currentUser, updateProfile } from "@/lib/db";
import Brand from "@/components/Brand";

const inputCls =
  "w-full rounded-lg border border-navy-border bg-navy px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-blue";

export default function Profile() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await currentUser();
      setUser(u);
      if (u) {
        setName(u.name || "");
        setPhone(u.phone || "");
      }
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <Brand markClass="h-10 w-auto" textClass="text-2xl" />
        <h1 className="text-xl font-bold">Sign in first</h1>
        <p className="text-sm text-gray-400">Your name and number are part of your account.</p>
        <Link
          href="/login"
          className="rounded-lg bg-brand-amber px-6 py-3 font-semibold text-navy transition hover:brightness-110"
        >
          Go to login
        </Link>
      </div>
    );
  }

  async function save(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter the name providers and customers should call you by.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits && digits.length !== 10) {
      setError("Please enter a complete 10-digit mobile number, or leave it empty.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await updateProfile({ name: name.trim(), phone: digits ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : "" });
      router.push(user.role === "mechanic" ? "/mechanic" : "/dashboard");
    } catch (err) {
      setError(err?.message || "We couldn't save these details. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <Brand markClass="h-10 w-auto" textClass="text-2xl" />
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-navy-border bg-navy-light p-7">
        <h1 className="text-xl font-bold">Set up your profile</h1>
        <p className="mt-1 text-sm text-gray-400">
          Signed in as {user.email || "this account"}. Providers and customers see this name on your jobs.
        </p>

        <form onSubmit={save} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-300">Username / full name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Piyush Semalti" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Mobile number <span className="text-gray-500">(optional)</span>
            </label>
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" inputMode="tel" />
            <p className="mt-2 text-[11px] text-gray-500">
              Used to call you about a job. You can add or change it any time.
            </p>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand-amber py-3 font-semibold text-navy transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save and continue"}
          </button>
        </form>

        <Link href="/" className="mt-4 block text-center text-xs text-gray-500 hover:text-gray-300">
          Skip for now
        </Link>
      </div>
    </div>
  );
}
