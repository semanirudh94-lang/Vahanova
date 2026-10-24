"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck, Wrench, User } from "lucide-react";
import { login, seedDemoAccount, isLive } from "@/lib/db";
import { sendOtp, friendlyOtpError, signInWithGoogle, friendlyGoogleError } from "@/lib/otp";

const inputCls =
  "w-full rounded-lg border border-navy-border bg-navy px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-blue";

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.09-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.32-6.32C39.02 4.24 33.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

function e164Display(phone) {
  const d = phone.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : `+91 ${d}`;
}

export default function Login() {
  const router = useRouter();
  const [role, setRole] = useState("customer");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [conf, setConf] = useState(null);
  const [otp, setOtp] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Please enter your full name and a 10-digit mobile number.");
      return;
    }
    const e164 = `+91${phone.replace(/\D/g, "").slice(-10)}`;
    setBusy(true);
    setError("");
    try {
      if (isLive && !conf) {
        setPhase("sending");
        setConf(await sendOtp(e164, "vp-recaptcha"));
      } else if (isLive && conf) {
        if (otp.replace(/\D/g, "").length !== 6) throw new Error("Please enter the 6-digit code received on your mobile.");
        setPhase("verifying");
        await conf.confirm(otp.replace(/\D/g, ""));
      }
      await login({ name: name.trim(), phone: e164, role });
      router.push(role === "mechanic" ? "/mechanic" : "/dashboard");
    } catch (err) {
      setError(friendlyOtpError(err) || "We couldn't verify that code. Please try again.");
      setBusy(false);
    } finally {
      setPhase("idle");
    }
  }

  async function google() {
    if (!name.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("Please enter your full name and a 10-digit mobile number.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signInWithGoogle();
      await login({ name: name.trim(), phone: `+91${phone.replace(/\D/g, "").slice(-10)}`, role });
      router.push(role === "mechanic" ? "/mechanic" : "/dashboard");
    } catch (err) {
      setError(friendlyGoogleError(err));
      setBusy(false);
    }
  }

  async function demo() {
    setBusy(true);
    await seedDemoAccount();
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-amber text-navy">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <span className="text-2xl font-bold">VahanProof</span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-navy-border bg-navy-light p-7">
        <h1 className="text-xl font-bold">Welcome</h1>
        <p className="mt-1 text-sm text-gray-400">
          {isLive
            ? "Sign in with your mobile number. One number, one account."
            : "Enter your name and mobile number to continue. OTP verification turns on automatically once Firebase is connected."}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-navy p-1">
          <button
            onClick={() => setRole("customer")}
            className={`flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition ${
              role === "customer" ? "bg-brand-blue text-white" : "text-gray-400"
            }`}
          >
            <User className="h-4 w-4" /> Customer
          </button>
          <button
            onClick={() => setRole("mechanic")}
            className={`flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition ${
              role === "mechanic" ? "bg-brand-blue text-white" : "text-gray-400"
            }`}
          >
            <Wrench className="h-4 w-4" /> Service Provider
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-300">Full name</label>
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Piyush Semalti" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-gray-300">Phone number</label>
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" inputMode="tel" />
          </div>
          {isLive && conf && (
            <div>
              <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400">
                Verification code sent to {e164Display(phone)}.
              </p>
              <label className="mb-2 mt-3 block text-sm text-gray-300">Enter the 6-digit code</label>
              <input className={inputCls} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" inputMode="numeric" maxLength={6} />
            </div>
          )}
          <div id="vp-recaptcha" />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-brand-amber py-3 font-semibold text-navy transition hover:brightness-110 disabled:opacity-60"
          >
            {phase === "sending"
              ? "Sending code…"
              : phase === "verifying"
                ? "Verifying…"
                : isLive && !conf
                  ? "Send verification code"
                  : isLive && conf
                    ? "Verify and continue"
                    : role === "mechanic"
                      ? "Continue as Service Provider"
                      : "Continue as Customer"}
          </button>
        </form>

        {isLive && (
          <>
            <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-gray-500">
              <span className="h-px flex-1 bg-navy-border" />
              or
              <span className="h-px flex-1 bg-navy-border" />
            </div>
            <button
              type="button"
              onClick={google}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-navy-border py-3 text-sm font-medium text-gray-200 transition hover:border-white/30 disabled:opacity-60"
            >
              <GoogleG /> Continue with Google
            </button>
            <p className="mt-3 text-center text-[11px] text-gray-500">
              Instant sign-in, no SMS code required. Your mobile number above is what we use to reach you.
            </p>
          </>
        )}

        {!isLive && (
          <button
            onClick={demo}
            disabled={busy}
            className="mt-4 w-full rounded-lg border border-navy-border py-3 text-sm font-medium text-gray-300 transition hover:border-white/30 disabled:opacity-60"
          >
            Try with demo data (sample vehicle + service history)
          </button>
        )}

        <p className="mt-5 rounded-lg bg-brand-amber/10 px-3 py-2 text-center text-xs text-brand-amber">
          {isLive
            ? "Live mode — all bookings and service records are stored in your Firebase database."
            : "Demo mode — data is saved in this browser only."}
        </p>
      </div>
    </div>
  );
}
