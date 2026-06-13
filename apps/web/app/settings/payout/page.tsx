"use client";

import * as React from "react";
import BackButton from "@/app/components/BackButton";

const PAYMENT_OPTIONS = [
  { value: "BCA", label: "BCA" },
  { value: "Mandiri", label: "Mandiri" },
  { value: "BRI", label: "BRI" },
  { value: "BNI", label: "BNI" },
  { value: "BSI", label: "BSI" },
  { value: "GoPay", label: "GoPay" },
  { value: "OVO", label: "OVO" },
  { value: "DANA", label: "DANA" },
  { value: "ShopeePay", label: "ShopeePay" },
  { value: "LinkAja", label: "LinkAja" },
  { value: "Other", label: "Other" },
];

export default function PayoutSettingsPage() {
  const [bankName, setBankName] = React.useState("");
  const [customBank, setCustomBank] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [holderName, setHolderName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/me/payout")
      .then((r) => r.json())
      .then((data) => {
        if (data?.payoutInfo) {
          const { bankName: bn, accountNumber: an, holderName: hn, notes: n } = data.payoutInfo;
          const isPreset = PAYMENT_OPTIONS.some((o) => o.value === bn && o.value !== "Other");
          setBankName(isPreset ? bn : bn ? "Other" : "");
          setCustomBank(isPreset ? "" : bn);
          setAccountNumber(an || "");
          setHolderName(hn || "");
          setNotes(n || "");
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const finalBank = bankName === "Other" ? customBank.trim() : bankName;
    if (!finalBank) { setError("Please select or enter a payment method."); return; }
    if (!accountNumber.trim()) { setError("Account number is required."); return; }
    if (!holderName.trim()) { setError("Account holder name is required."); return; }

    setPending(true);
    try {
      const res = await fetch("/api/me/payout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: finalBank,
          accountNumber: accountNumber.trim(),
          holderName: holderName.trim(),
          notes: notes.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save.");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setPending(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white";
  const labelCls = "mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300";

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Payout Settings</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Where should we send donation money? Admin uses this info to forward funds to you.
            </p>
          </div>
          <BackButton href="/studio" />
        </div>

        {!loaded ? (
          <div className="py-10 text-center text-sm text-gray-500">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 space-y-5">

              {/* Bank / E-wallet */}
              <div>
                <label className={labelCls}>Bank / E-wallet <span className="text-red-500">*</span></label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  disabled={pending}
                  className={inputCls}
                >
                  <option value="">-- Select --</option>
                  {PAYMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {bankName === "Other" && (
                <div>
                  <label className={labelCls}>Payment method name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    placeholder="e.g. Jenius, SeaBank"
                    maxLength={100}
                    disabled={pending}
                    className={inputCls}
                  />
                </div>
              )}

              {/* Account number */}
              <div>
                <label className={labelCls}>Account / Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 1234567890 or 08123456789"
                  maxLength={50}
                  disabled={pending}
                  className={inputCls}
                />
              </div>

              {/* Holder name */}
              <div>
                <label className={labelCls}>Account Holder Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="Full name as registered"
                  maxLength={100}
                  disabled={pending}
                  className={inputCls}
                />
              </div>

              {/* Notes */}
              <div>
                <label className={labelCls}>
                  Notes <span className="text-sm font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. BCA Syariah, or any extra info for admin"
                  maxLength={200}
                  disabled={pending}
                  className={inputCls}
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}

            {saved && (
              <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                Payout info saved successfully.
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save Payout Info"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
