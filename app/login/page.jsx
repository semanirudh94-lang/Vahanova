"use client";

import Link from "next/link";
import { useState } from "react";
import { isLive, login } from "@/lib/db";
import { signInEmailPassword, sendResetLink, friendlyAuthError } from "@/lib/auth";
import { useGoogleAuth } from "@/lib/useGoogleAuth";
import AuthShell, { authInput } from "@/components/AuthShell";

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export default function Login() {
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const { router, busy, setBusy, waiting, error, setError, startGoogle } = useGoogleAuth(role);

  async function submit(e) {
    e.preventDefault();
    if (!isEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (isLive && !password) {
      setError("Please enter your password.");
      return;
    }
    const details = { email: email.trim().toLowerCase(), role };
    setBusy(true);
    setError("");
    try {
      if (isLive) await signInEmailPassword(details.email, password);
      const u = await login(details);
      // Land them where their account actually lives, not where the tab guessed.
      router.push(u?.name ? (u.role === "mechanic" ? "/mechanic" : "/dashboard") : "/profile");
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  async function reset() {
    if (!isEmail(email)) {
      setError("Enter your email above first, then tap Send reset link.");
      return;
    }
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await sendResetLink(email.trim().toLowerCase());
      setNotice("If an account exists for this email, a reset link is on its way. Check your inbox and spam folder. If you signed up with Google, use Continue with Google instead.");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        isLive
          ? "Sign in with your email and password, or with your Google account. We ask for your name and number after you sign in."
          : "Enter your email to continue. Password sign-in turns on automatically once Firebase is connected."
      }
      role={role}
      onRole={setRole}
      waiting={waiting}
      google={{ onClick: startGoogle, disabled: busy, label: "Continue with Google" }}
      footer={
        <p className="mt-4 text-center text-sm text-gray-400">
          First time here?{" "}
          <Link
            href={role === "mechanic" ? "/signup?role=mechanic" : "/signup"}
            className="font-medium text-brand-blue underline"
          >
            {role === "mechanic" ? "Create a provider account" : "Create an account"}
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm text-gray-300">Email</label>
          <input className={authInput} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" />
        </div>
        {isLive && (
          <div>
            <label className="mb-2 block text-sm text-gray-300">Password</label>
            <input
              className={authInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              type="password"
              autoComplete="current-password"
              minLength={6}
            />
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="mt-2 text-xs text-brand-blue underline disabled:opacity-60"
            >
              {busy ? "Sending reset link…" : "Forgot password? Send a reset link"}
            </button>
          </div>
        )}
        {notice && <p className="rounded-lg bg-green-500/10 px-3 py-2 text-xs text-green-400">{notice}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand-amber py-3 font-semibold text-navy transition hover:brightness-110 disabled:opacity-60"
        >
          {busy ? "Signing in…" : role === "mechanic" ? "Sign in as Service Provider" : "Sign in as Customer"}
        </button>
      </form>
    </AuthShell>
  );
}
