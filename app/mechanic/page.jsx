"use client";


import Link from "next/link";
import ScreenWait from "@/components/ScreenWait";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Wrench,
  History,
  User,
  CheckCircle2,
  Plus,
  Trash2,
  ReceiptText,
  Crosshair,
  Loader2,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import Stars from "@/components/Stars";
import { currentUser, openRequestsForMechanic, subscribeOpenRequestsForMechanic, acceptBooking, updateBooking, completeBooking, providerProfile, saveProviderProfile, ratingsForProvider, syncProviderContactsForMechanic } from "@/lib/db";
import { STATUS_LABEL, STATUS_TINT, SERVICES, SERVICE_BY_KEY, VEHICLE_TYPES, SERVICE_MODES } from "@/data/services";
import { DEHRADUN_AREAS, areaCoord } from "@/lib/geo";
import useLocation from "@/lib/useLocation";

const PinPicker = dynamic(() => import("@/components/TrackMap").then((m) => m.PinPicker), { ssr: false });

const PAYMENTS = [
  { key: "cash", label: "Cash collected" },
  { key: "upi", label: "Paid to my UPI" },
  { key: "unpaid", label: "Not collected yet" },
];

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "#dashboard" },
  { icon: Inbox, label: "Requests", href: "#requests" },
  { icon: Wrench, label: "My Jobs", href: "#jobs" },
  { icon: History, label: "Completed", href: "#completed" },
  { icon: User, label: "Profile", href: "#profile" },
];

const inputCls =
  "w-full rounded-lg border border-navy-border bg-navy px-3 py-2 text-sm text-white outline-none placeholder:text-gray-600 focus:border-brand-blue";

const emptyRate = () => ({ price: "", mode: SERVICE_MODES[0] });

function toDraft(profile, user) {
  const byKey = Object.fromEntries((profile?.services || []).map((s) => [s.key, { price: s.price, mode: s.mode }]));
  return {
    name: profile?.name || user?.name || "",
    phone: profile?.phone || user?.phone || "",
    area: profile?.area || user?.area || "",
    coord: profile?.coord || null,
    upi: profile?.upi || "",
    vehicleTypes: profile?.vehicleTypes || [],
    rates: Object.fromEntries(SERVICES.map((s) => [s.key, byKey[s.key] || emptyRate()])),
    active: profile ? profile.active !== false : true,
  };
}

export default function Mechanic() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [list, setList] = useState([]);
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [cardOpen, setCardOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);
  const [billing, setBilling] = useState(null);
  const [bill, setBill] = useState({ parts: [{ name: "", qty: 1, price: 0 }], labour: "", warrantyDays: "", note: "", paymentMode: "" });
  const gps = useLocation();

  async function refresh() {
    const u = await currentUser();
    setUser(u);
    if (!u || u.role !== "mechanic") {
      setList([]);
      setProfile(null);
      return;
    }
    setProfile(await providerProfile(u.id));
    await syncProviderContactsForMechanic(u.id);
    setRatings(await ratingsForProvider(u.id));
    setList(await openRequestsForMechanic(u.id));
  }

  useEffect(() => {
    let alive = true;
    let stop = null;
    async function boot() {
      try {
        const u = await currentUser();
        if (!alive) return;
        setUser(u);
        if (!u || u.role !== "mechanic") {
          setList([]);
          setProfile(null);
          setReady(true);
          return;
        }
        const [p, r] = await Promise.all([
          providerProfile(u.id),
          ratingsForProvider(u.id),
        ]);
        await syncProviderContactsForMechanic(u.id);
        const initial = await openRequestsForMechanic(u.id);
        if (!alive) return;
        setProfile(p);
        setRatings(r);
        setList(initial);
        stop = await subscribeOpenRequestsForMechanic(
          u.id,
          (next) => { if (alive) setList(next); },
          (error) => console.error("Mechanic request listener failed:", error)
        );
      } catch (error) {
        console.error("Could not load mechanic dashboard:", error);
      } finally {
        if (alive) setReady(true);
      }
    }
    boot();
    return () => {
      alive = false;
      if (stop) stop();
    };
  }, []);

  if (!ready) return <ScreenWait />;

  if (user?.role !== "mechanic") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">This is the service provider dashboard</h1>
        <p className="max-w-md text-sm text-gray-400">
          {user?.email
            ? `${user.email} is a customer account, so it cannot open the jobs desk. Provider access is chosen when an account is created.`
            : "Provider access is chosen when an account is created."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup?role=mechanic" className="rounded-lg bg-brand-amber px-6 py-3 font-semibold text-navy">
            Create a provider account
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-navy-border px-6 py-3 text-sm font-medium text-gray-200 hover:border-white/30"
          >
            Open my customer dashboard
          </Link>
        </div>
      </div>
    );
  }

  const mine = list.filter((b) => b.mechanicId === user.id);
  const openPool = list.filter((b) => !b.mechanicId);
  const completed = mine.filter((b) => b.status === "completed");
  const today = mine.filter((b) => !["completed", "cancelled"].includes(b.status));
  const publishedCount = profile?.services?.length || 0;
  const ratingAvg = ratings.length
    ? Math.round((ratings.reduce((s, r) => s + (Number(r.stars) || 0), 0) / ratings.length) * 10) / 10
    : 0;

  async function start(b) {
    await updateBooking(b.id, { status: "in_progress" }, "in_progress");
    refresh();
  }

  async function onWay(b) {
    await updateBooking(b.id, { status: "on_way" }, "on_way");
    refresh();
  }

  async function saveBill() {
    if (!bill.paymentMode) return;
    await completeBooking(billing.id, bill);
    setBilling(null);
    setBill({ parts: [{ name: "", qty: 1, price: 0 }], labour: "", warrantyDays: "", note: "", paymentMode: "" });
    refresh();
  }

  function openCard() {
    setDraft(toDraft(profile, user));
    setSaved(false);
    setCardOpen(true);
  }

  async function saveCard() {
    const savedProfile = await saveProviderProfile({
      name: draft.name,
      phone: draft.phone,
      area: draft.area,
      coord: draft.coord,
      upi: draft.upi,
      vehicleTypes: draft.vehicleTypes,
      active: draft.active,
      services: SERVICES.map((s) => ({ key: s.key, price: Number(draft.rates[s.key].price) || 0, mode: draft.rates[s.key].mode })).filter(
        (s) => s.price > 0
      ),
    });
    setProfile(savedProfile);
    setSaved(true);
    refresh();
  }

  const partsTotal = bill.parts.reduce((s, p) => s + (Number(p.qty) || 0) * (Number(p.price) || 0), 0);

  return (
    <AppShell items={NAV} active="Dashboard">
      <div id="dashboard" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Wrench} label="Active jobs" value={today.length} />
        <Stat icon={CheckCircle2} label="Completed" value={completed.length} tint="text-green-400 bg-green-500/10" />
        <Stat icon={ReceiptText} label="Rates published" value={publishedCount} tint="text-brand-amber bg-brand-amber/10" />
        <Stat icon={User} label="Working area" value={profile?.area || "Not set"} small />
      </div>

      <div id="profile" className="rounded-xl border border-navy-border bg-navy-light p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">My rate card</p>
            <p className="mt-1 text-sm text-gray-400">
              {publishedCount
                ? `${publishedCount} service${publishedCount > 1 ? "s" : ""} listed. Customers see these prices and pick you.`
                : "Add your prices so customers can find and choose you."}
            </p>
          </div>
          <button onClick={openCard} className="rounded-lg bg-brand-amber px-5 py-2.5 text-sm font-bold text-navy">
            {publishedCount ? "Edit rate card" : "Create rate card"}
          </button>
        </div>
        {publishedCount > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {profile.services.map((s) => (
              <div key={s.key} className="flex items-center justify-between rounded-lg bg-navy px-4 py-3 text-sm">
                <span>{SERVICE_BY_KEY[s.key]?.name || s.key}</span>
                <span className="text-brand-amber">
                  ₹{s.price} · {s.mode}
                </span>
              </div>
            ))}
            {!profile.active && <p className="text-sm text-brand-amber">Rate card is hidden — customers cannot see it right now.</p>}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-navy px-4 py-3">
          <Stars value={ratingAvg} count={ratings.length} />
          <span className="text-xs text-gray-500">from completed jobs on VAHANOVA</span>
          <span className="ml-auto text-xs text-gray-500">
            {profile?.coord ? "Base pin set" : "No base pin"} · {profile?.upi ? "UPI id on your bills" : "No UPI id yet"}
          </span>
        </div>
      </div>

      <div id="requests" className="rounded-xl border border-brand-amber/40 bg-brand-amber/5 p-6">
        <p className="font-semibold text-brand-amber">Open requests (any provider can accept)</p>
        <div className="mt-4 space-y-3">
          {openPool.length === 0 && <p className="text-sm text-gray-400">No open requests right now. New requests will appear here automatically.</p>}
          {openPool.map((b) => (
            <JobRow key={b.id} b={b} isOpenRequest>
              <button
                onClick={async () => {
                  const accepted = await acceptBooking(b.id, user.id);
                  if (accepted) refresh();
                }}
                className="rounded-lg bg-brand-amber px-4 py-2 text-xs font-bold text-navy"
              >
                Accept
              </button>
            </JobRow>
          ))}
        </div>
      </div>

      <div id="jobs" className="rounded-xl border border-navy-border bg-navy-light p-6">
        <p className="font-semibold">My Jobs</p>
        <div className="mt-4 space-y-3">
          {mine.filter((b) => b.status !== "completed").length === 0 && (
            <p className="text-sm text-gray-500">No jobs assigned yet. New bookings from your rate card will appear here.</p>
          )}
          {mine.filter((b) => b.status !== "completed").map((b) => (
            <JobRow key={b.id} b={b}>
              {b.status === "assigned" && (
                <button onClick={() => onWay(b)} className="rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold text-white">
                  Started / On the way
                </button>
              )}
              {b.status === "on_way" && (
                <button onClick={() => start(b)} className="rounded-lg bg-brand-blue px-4 py-2 text-xs font-semibold text-white">
                  Start service
                </button>
              )}
              {b.status === "in_progress" && (
                <button onClick={() => setBilling(b)} className="rounded-lg bg-brand-amber px-4 py-2 text-xs font-bold text-navy">
                  Complete &amp; bill
                </button>
              )}
              {b.status === "completed" && <span className="text-xs text-green-400">₹{b.amount} billed</span>}
            </JobRow>
          ))}
        </div>
      </div>

      <div id="completed" className="rounded-xl border border-navy-border bg-navy-light p-6">
        <p className="font-semibold">Completed jobs</p>
        <div className="mt-4 space-y-3">
          {completed.length === 0 && <p className="text-sm text-gray-500">No completed jobs yet.</p>}
          {completed.map((b) => <JobRow key={b.id} b={b}><span className="text-xs text-green-400">₹{b.amount} billed</span></JobRow>)}
        </div>
      </div>

      {billing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-navy-border bg-navy-light p-6 sm:rounded-2xl">
            <p className="text-lg font-bold">Service Bill — #{billing.code}</p>
            <p className="mt-1 text-sm text-gray-400">
              {billing.service || billing.problem} · {billing.vehicleNumber}
            </p>

            <div className="mt-5 space-y-2">
              <p className="text-sm font-medium text-gray-300">Parts used</p>
              {bill.parts.map((p, i) => (
                <div key={i} className="rounded-lg border border-navy-border bg-navy p-2">
                  <input
                    className={inputCls}
                    placeholder="Part name"
                    value={p.name}
                    onChange={(e) => setBill({ ...bill, parts: bill.parts.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      className={`${inputCls} w-20`}
                      type="number"
                      min="0"
                      placeholder="Qty"
                      value={p.qty}
                      onChange={(e) => setBill({ ...bill, parts: bill.parts.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)) })}
                    />
                    <input
                      className={`${inputCls} w-28`}
                      type="number"
                      min="0"
                      placeholder="Price each"
                      value={p.price}
                      onChange={(e) => setBill({ ...bill, parts: bill.parts.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)) })}
                    />
                    <span className="ml-auto text-xs text-gray-400">
                      ₹{(Number(p.qty) || 0) * (Number(p.price) || 0)}
                    </span>
                    <button
                      onClick={() => setBill({ ...bill, parts: bill.parts.filter((_, j) => j !== i) })}
                      className="rounded-lg border border-navy-border px-2 py-2 text-gray-400"
                      aria-label="Remove part"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setBill({ ...bill, parts: [...bill.parts, { name: "", qty: 1, price: 0 }] })}
                className="inline-flex items-center gap-1 text-xs text-brand-blue"
              >
                <Plus className="h-3.5 w-3.5" /> Add part
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Labour charge (₹)</label>
                <input className={inputCls} type="number" value={bill.labour} onChange={(e) => setBill({ ...bill, labour: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Warranty you offer (days)</label>
                <input className={inputCls} type="number" value={bill.warrantyDays} onChange={(e) => setBill({ ...bill, warrantyDays: e.target.value })} />
              </div>
            </div>

            <input
              className={`${inputCls} mt-3`}
              placeholder="What you checked and what you recommend"
              value={bill.note}
              onChange={(e) => setBill({ ...bill, note: e.target.value })}
            />

            <div className="mt-5">
              <p className="text-sm font-medium text-gray-300">Payment on this job</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {PAYMENTS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setBill({ ...bill, paymentMode: p.key })}
                    className={`rounded-lg border px-3 py-2.5 text-sm transition ${
                      bill.paymentMode === p.key
                        ? "border-brand-amber bg-brand-amber/10 font-semibold text-brand-amber"
                        : "border-navy-border bg-navy text-gray-300 hover:border-white/30"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Say what actually happened. The customer&rsquo;s bill shows this line, and VAHANOVA never takes payment
                for you.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-lg bg-navy p-4 text-sm">
              <span className="text-gray-400">Total for this job (parts + labour)</span>
              <span className="text-xl font-extrabold text-brand-amber">₹{partsTotal + (Number(bill.labour) || 0)}</span>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={saveBill}
                disabled={!bill.paymentMode}
                className="flex-1 rounded-lg bg-brand-amber py-3 font-bold text-navy disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save &amp; complete
              </button>
              <button onClick={() => setBilling(null)} className="rounded-lg border border-navy-border px-5 py-3 text-sm text-gray-300">
                Cancel
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              This bill is added to the customer&rsquo;s Digital Vehicle Passport. Payment is settled between you and the
              customer — VAHANOVA does not collect it.
            </p>
          </div>
        </div>
      )}

      {cardOpen && draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-navy-border bg-navy-light p-6 sm:rounded-2xl">
            <p className="text-lg font-bold">My rate card</p>
            <p className="mt-1 text-sm text-gray-400">
              You set your own prices. VAHANOVA does not fix, suggest or take a share of them.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Shop / name shown to customers</label>
                <input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Contact number</label>
                <input className={inputCls} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Working area</label>
                <select className={inputCls} value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })}>
                  <option value="">Select area</option>
                  {DEHRADUN_AREAS.map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Vehicle types you service</label>
                <div className="flex gap-2">
                  {VEHICLE_TYPES.map((t) => {
                    const on = draft.vehicleTypes.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() =>
                          setDraft({ ...draft, vehicleTypes: on ? draft.vehicleTypes.filter((x) => x !== t) : [...draft.vehicleTypes, t] })
                        }
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                          on ? "border-brand-amber bg-brand-amber/10 font-semibold text-brand-amber" : "border-navy-border bg-navy text-gray-300"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-1 block text-xs text-gray-400">Your UPI id (for payment, optional)</label>
              <input
                className={inputCls}
                value={draft.upi}
                onChange={(e) => setDraft({ ...draft, upi: e.target.value })}
                placeholder="shopname@bank"
              />
              <p className="mt-1 text-xs text-gray-500">
                Customers pay you this id directly from the bill. VAHANOVA never holds the money and adds no fee.
              </p>
            </div>

            <div className="mt-5 rounded-lg border border-navy-border bg-navy p-4">
              <p className="text-sm font-medium text-gray-300">Base pin</p>
              <p className="mt-1 text-xs text-gray-500">
                Where you start from. Customers see this pin and the arrival time is measured from it.
              </p>
              <button
                type="button"
                onClick={() => gps.locate((p) => setDraft({ ...draft, coord: p }))}
                disabled={gps.status === "locating"}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-navy-border bg-navy-lighter px-4 py-2.5 text-sm text-gray-200 hover:border-brand-blue disabled:opacity-60"
              >
                {gps.status === "locating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                Drop pin at my current location
              </button>
              {gps.message && <p className="mt-2 text-xs text-brand-amber">{gps.message}</p>}
              <div className="mt-4">
                <PinPicker point={draft.coord} center={areaCoord(draft.area)} onChange={(p) => setDraft({ ...draft, coord: p })} />
              </div>
              {draft.coord && (
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, coord: null })}
                  className="mt-2 text-xs text-gray-400 hover:text-white"
                >
                  Remove pin (the area you picked is used instead)
                </button>
              )}
            </div>

            <p className="mt-6 text-sm font-medium text-gray-300">Services and your prices</p>
            <div className="mt-3 space-y-2">
              {SERVICES.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-sm">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                  </div>
                  <input
                    className={`${inputCls} w-24`}
                    type="number"
                    placeholder="₹"
                    value={draft.rates[s.key].price}
                    onChange={(e) => setDraft({ ...draft, rates: { ...draft.rates, [s.key]: { ...draft.rates[s.key], price: e.target.value } } })}
                  />
                  <select
                    className={`${inputCls} w-36`}
                    value={draft.rates[s.key].mode}
                    onChange={(e) => setDraft({ ...draft, rates: { ...draft.rates, [s.key]: { ...draft.rates[s.key], mode: e.target.value } } })}
                  >
                    {SERVICE_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">Leave a price empty to hide that service from customers.</p>

            <label className="mt-5 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
              Show my rate card to customers
            </label>

            <div className="mt-5 flex gap-3">
              <button onClick={saveCard} className="flex-1 rounded-lg bg-brand-amber py-3 font-bold text-navy">
                Publish rate card
              </button>
              <button onClick={() => setCardOpen(false)} className="rounded-lg border border-navy-border px-5 py-3 text-sm text-gray-300">
                Close
              </button>
            </div>
            {saved && <p className="mt-3 text-sm text-green-400">Rate card saved. Customers can see it now.</p>}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function JobRow({ b, children, isOpenRequest = false }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-navy p-4">
      <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_TINT[b.status]}`}>{STATUS_LABEL[b.status]}</span>
      <div>
        <p className="text-sm font-medium">
          {b.service || b.problem} · {b.vehicleNumber || b.kind}
        </p>
        <p className="text-xs text-gray-500">
          #{b.code} · {isOpenRequest ? "Customer details shared after acceptance" : `${b.customerName} · ${b.address || "no address"}`} · {b.date}
          {b.slot && ` ${b.slot}`}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {!isOpenRequest && b.customerPhone && (
          <a href={`tel:${b.customerPhone}`} className="rounded-lg border border-navy-border px-3 py-2 text-xs text-gray-300">
            Call customer
          </a>
        )}
        {children}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, small, tint = "text-brand-blue bg-brand-blue/10" }) {
  return (
    <div className="rounded-xl border border-navy-border bg-navy-light p-5">
      <span className={`inline-flex rounded-lg p-2 ${tint}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className={`mt-3 font-extrabold ${small ? "truncate text-lg" : "text-2xl"}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
