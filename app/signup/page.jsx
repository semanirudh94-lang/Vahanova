"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLive, login } from "@/lib/db";
import { signUpEmailPassword, friendlyAuthError } from "@/lib/auth";
import { useGoogleAuth } from "@/lib/useGoogleAuth";
import AuthShell, { authInput } from "@/components/AuthShell";

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export default function Signup() {
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { router, busy, setBusy, error, setError, startGoogle } = useGoogleAuth(role);

  // /signup?role=mechanic preselects the tab for provider links. Read off the URL
  // after mount rather than useSearchParams, which would block static generation.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("role") === "mechanic") setRole("mechanic");
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!isEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Please choose a password of at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match. Please type them again.");
      return;
    }
    const details = { email: email.trim().toLowerCase(), role };
    setBusy(true);
    setError("");
    try {
      if (isLive) await signUpEmailPassword(details.email, password);
      const u = await login(details);
      router.push(u?.name ? (role === "mechanic" ? "/mechanic" : "/dashboard") : "/profile");
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle={
        isLive
          ? "Pick your email and a password. Your name and mobile number are collected on the next screen."
          : "Pick an email to create your account. Passwords turn on automatically once Firebase is connected."
      }
      role={role}
      onRole={setRole}
      google={{ onClick: startGoogle, disabled: busy, label: "Sign up with Google" }}
      footer={
        <p className="mt-4 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-blue underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm text-gray-300">Email</label>
          <input className={authInput} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" />
          <p className="mt-2 text-[11px] text-gray-500">
            {role === "mechanic"
              ? "This email becomes your sign-in for the jobs desk, so use one you check daily."
              : "We only use this to let you sign back in and to send booking updates."}
          </p>
        </div>
        {isLive && (
          <>
            <div>
              <label className="mb-2 block text-sm text-gray-300">Password</label>
              <input
                className={authInput}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                type="password"
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-gray-300">Confirm password</label>
              <input
                className={authInput}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Type the same password again"
                type="password"
                autoComplete="new-password"
                minLength={6}
              />
            </div>
          </>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-brand-amber py-3 font-semibold text-navy transition hover:brightness-110 disabled:opacity-60"
        >
          {role === "mechanic" ? "Create provider account" : "Create customer account"}
        </button>
      </form>
    </AuthShell>
  );
}
