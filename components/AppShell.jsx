"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { currentUser, logout } from "@/lib/db";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Brand from "@/components/Brand";

export default function AppShell({ items, active, children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    currentUser().then((u) => {
      setUser(u);
      setLoaded(true);
      if (u && !u.name) router.replace("/profile");
    });
  }, [router]);

  if (!loaded) return null;

  // A brand-new account has no name yet — the profile window collects it.
  if (user && !user.name) return null;

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <img src="/brand/logo.png" alt="VAHANOVA — Every journey, taken care of." width={986} height={545} className="h-20 w-auto" />
        <h1 className="text-2xl font-bold">Please sign in</h1>
        <p className="text-sm text-gray-400">This page shows the details of your account.</p>
        <Link
          href="/login"
          className="rounded-lg bg-brand-amber px-6 py-3 font-semibold text-navy transition hover:brightness-110"
        >
          Login / Sign Up
        </Link>
      </div>
    );
  }

  async function signOut() {
    await logout();
    router.push("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/5 bg-navy-light md:flex">
        <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
          <Brand />
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {items.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                n.label === active
                  ? "border-l-2 border-brand-amber bg-brand-blue/10 font-medium text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/5 p-3">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64">
        <div className="flex items-center gap-2 border-b border-white/5 bg-navy-light px-4 py-3 md:hidden">
          <Brand markClass="h-6 w-auto" textClass="text-base" />
          <button onClick={signOut} className="ml-auto text-gray-400" aria-label="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-navy/85 px-4 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-lg font-bold">
              Hello, {user.name}
              {user.role === "mechanic" ? " · Service provider" : ""}
            </p>
            <p className="text-xs text-gray-500">{active}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue text-sm font-bold">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="space-y-6 p-4 sm:p-6">{children}</main>
      </div>

      <WhatsAppFloat />
    </div>
  );
}
