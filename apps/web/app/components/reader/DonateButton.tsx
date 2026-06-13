"use client";

import * as React from "react";
import Link from "next/link";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const QRIS_IMAGE_URL = "/images/donate-qr.jpeg";
const OWNER_USERNAME = "noelephgoddess";

type Step = "form" | "success";
type DonateRole = "author" | "translator" | "reuploader" | "profile";

function formatRupiah(raw: string): string {
  const num = raw.replace(/\D/g, "");
  return num ? Number(num).toLocaleString("id-ID") : "";
}

function parseRupiah(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, "") || "0", 10);
}

export default function DonateButton({
  recipientUserId,
  recipientName,
  recipientUsername,
  role = "profile",
}: {
  recipientUserId: string;
  recipientName: string;
  recipientUsername?: string | null;
  role?: DonateRole;
}) {
  const t = useUILanguageText();

  const isOwner = recipientUsername === OWNER_USERNAME;
  const buttonLabel = isOwner
    ? t("Donate to Ownah")
    : role === "author" ? t("Donate to Author")
    : role === "translator" ? t("Donate to Translator")
    : role === "reuploader" ? t("Donate to Re-Uploader")
    : t("Donate");

  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("form");
  const [pending, setPending] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [donorName, setDonorName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [proofFile, setProofFile] = React.useState<File | null>(null);
  const [proofPreview, setProofPreview] = React.useState<string | null>(null);

  function resetForm() {
    setStep("form");
    setSubmitError(null);
    setPending(false);
    setDonorName("");
    setAmount("");
    setMessage("");
    setProofFile(null);
    setProofPreview(null);
  }

  function handleClose() {
    setOpen(false);
    setTimeout(resetForm, 300);
  }

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
    setSubmitError(null);

    const nameVal = donorName.trim();
    const amountNum = parseRupiah(amount);

    if (!nameVal) { setSubmitError(t("Sender name is required.")); return; }
    if (amountNum < 1000) { setSubmitError(t("Amount must be at least Rp 1,000.")); return; }

    setPending(true);
    try {
      let proofImageBase64: string | null = null;
      let proofImageMimeType: string | null = null;

      if (proofFile) {
        proofImageBase64 = await fileToBase64(proofFile);
        proofImageMimeType = proofFile.type;
      }

      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientUserId,
          donorName: nameVal,
          amount: amountNum,
          currency: "IDR",
          message: message.trim() || null,
          proofImageBase64,
          proofImageMimeType,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((payload as any)?.error || t("An error occurred. Please try again."));
      setStep("success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("An error occurred. Please try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 active:bg-red-800"
      >
        {buttonLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-4 sm:items-center sm:pb-0"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {step === "success" ? (
              <div className="py-2 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("Thank you!")}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {t("Your donation to")} <span className="font-semibold">{recipientName}</span>{" "}
                  {t("is being processed. Admin will verify and forward the funds to the creator.")}
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  {t("Close")}
                </button>
                <Link
                  href="/donations"
                  className="mt-2 block text-center text-xs text-violet-600 hover:underline dark:text-purple-400"
                >
                  {t("Check donation status")} →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {t("Donate to")} {recipientName}
                  </h3>
                </div>

                {/* QRIS */}
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                  <p className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {t("Scan to pay via QRIS")}
                  </p>
                  <img
                    src={QRIS_IMAGE_URL}
                    alt="QRIS"
                    className="mx-auto h-52 w-52 object-contain"
                  />
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    {t("After paying, fill in the amount and upload proof below.")}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("Sender name")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    maxLength={100}
                    placeholder={t("Your fans...")}
                    disabled={pending}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("Transfer amount (IDR)")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) => setAmount(formatRupiah(e.target.value))}
                      placeholder="10.000"
                      disabled={pending}
                      className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{t("Minimum Rp 1,000")}</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("Message for creator")}{" "}
                    <span className="font-normal text-gray-400">({t("optional")})</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder={t("Write your message here...")}
                    disabled={pending}
                    className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t("Transfer proof")}{" "}
                    <span className="font-normal text-gray-400">({t("optional but recommended")})</span>
                  </label>

                  {proofPreview ? (
                    <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                      <img
                        src={proofPreview}
                        alt={t("Transfer proof")}
                        className="max-h-48 w-full object-contain bg-gray-50 dark:bg-gray-800"
                      />
                      <button
                        type="button"
                        onClick={removeProof}
                        disabled={pending}
                        className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white hover:bg-black/80 disabled:opacity-50"
                      >
                        {t("Remove proof")}
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 py-6 text-xs text-gray-500 transition-colors hover:border-red-400 hover:text-red-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-500 dark:hover:text-red-400">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span>{t("Click to upload transfer proof photo")}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={pending}
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>

                {submitError && (
                  <p className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {submitError}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={pending}
                    className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pending ? t("Sending...") : t("Send Donation")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
