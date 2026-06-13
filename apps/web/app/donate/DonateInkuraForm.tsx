"use client";

import * as React from "react";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatRupiah(raw: string): string {
  const num = raw.replace(/\D/g, "");
  return num ? Number(num).toLocaleString("id-ID") : "";
}

function parseRupiah(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, "") || "0", 10);
}

export default function DonateInkuraForm() {
  const [step, setStep] = React.useState<"form" | "success">("form");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [donorName, setDonorName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [proofFile, setProofFile] = React.useState<File | null>(null);
  const [proofPreview, setProofPreview] = React.useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  function removeProof() {
    setProofFile(null);
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nameVal = donorName.trim();
    const amountNum = parseRupiah(amount);

    if (!nameVal) { setError("Sender name is required."); return; }
    if (amountNum < 1000) { setError("Amount must be at least Rp 1,000."); return; }

    setPending(true);
    try {
      let proofImageBase64: string | null = null;
      let proofImageMimeType: string | null = null;

      if (proofFile) {
        proofImageBase64 = await fileToBase64(proofFile);
        proofImageMimeType = proofFile.type;
      }

      const res = await fetch("/api/donate/inkura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: nameVal,
          amount: amountNum,
          currency: "IDR",
          message: message.trim() || null,
          proofImageBase64,
          proofImageMimeType,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.error || "An error occurred. Please try again.");
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white";

  if (step === "success") {
    return (
      <div className="mt-8 max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-bold">Thank you!</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Your donation to Inkura has been received. We appreciate your support!
        </p>
        <button
          type="button"
          onClick={() => { setStep("form"); setDonorName(""); setAmount(""); setMessage(""); setProofFile(null); setProofPreview(null); }}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Already transferred? Let us know!</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Scan the QR above to pay, then fill in this form so we get notified.
      </p>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
          Your name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          maxLength={100}
          placeholder="Your fans..."
          disabled={pending}
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
          Transfer amount (IDR) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-500 dark:text-gray-400">Rp</span>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(formatRupiah(e.target.value))}
            placeholder="10.000"
            disabled={pending}
            className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">Minimum Rp 1,000</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
          Message <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Write your message here..."
          disabled={pending}
          className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
          Transfer proof <span className="font-normal text-gray-400">(optional but recommended)</span>
        </label>
        {proofPreview ? (
          <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <img src={proofPreview} alt="Transfer proof" className="max-h-48 w-full object-contain bg-gray-50 dark:bg-gray-800" />
            <button
              type="button"
              onClick={removeProof}
              disabled={pending}
              className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white hover:bg-black/80 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 py-6 text-xs text-gray-500 transition-colors hover:border-violet-400 hover:text-violet-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-violet-500">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span>Click to upload transfer proof photo</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={pending} onChange={handleFileChange} />
          </label>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Sending..." : "Confirm Donation"}
      </button>
    </form>
  );
}
