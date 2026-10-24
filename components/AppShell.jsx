"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, Bell, LogOut } from "lucide-react";
import { currentUser, logout } from "@/lib/db";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export default function AppShell({ items, active, children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    currentUser().then((u) => {
      setUser(u);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldCheck className="h-10 w-10 text-brand-amber" />
        <h1 className="text-2xl font-bold">Pehle login karo</h1>
        <p className="text-sm text-gray-400">Ye page tere account ka data dikhata hai.</p>
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
        <Link href="/" className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-amber text-navy">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold">VahanProof</span>
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
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-amber text-navy">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="font-bold">VahanProof</span>
          <button onClick={signOut} className="ml-auto text-gray-400" aria-label="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-navy/85 px-4 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-lg font-bold">
              Hello, {user.name}
              {user.role === "mechanic" ? " (Mechanic)" : ""}
            </p>
            <p className="text-xs text-gray-500">{active}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-lg border border-navy-border p-2 text-gray-300" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-amber text-[10px] font-bold text-navy">
                2
              </span>
            </button>
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
