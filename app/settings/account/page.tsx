"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AccountSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [adult, setAdult] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAdult(Boolean((session as any)?.user?.adultConfirmed));
  }, [session]);

  const onToggleAdult = () => {
    // Kalau mau nyalain: tampilkan konfirmasi
    if (!adult) {
      setConfirmOpen(true);
      return;
    }

    // default: boleh matiin tanpa drama
    setAdult(false);
    setSaving(true);
    fetch("/api/user/adult", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adultConfirmed: false }),
    })
      .finally(() => {
        setSaving(false);
        router.refresh();
      });
  };

  const confirmYes = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/adult", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adultConfirmed: true }),
      });
      if (res.ok) {
        setAdult(true);
        setConfirmOpen(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen pt-28 px-4 md:px-6 max-w-3xl mx-auto">
        <div className="text-sm text-gray-600 dark:text-gray-300">Loading...</div>
      </main>
    );
  }

  const email = session?.user?.email || "";
  const role = String((session as any)?.user?.role || "USER");

  return (
    <main className="min-h-screen pt-28 px-4 md:px-6 max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 mb-6">
        Email: <span className="font-semibold">{email}</span> • Role: <span className="font-semibold">{role}</span>
      </p>

      <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">Tampilkan konten 18+</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Kalau belum dicentang, karya NSFW/18+ tidak akan muncul di halaman list.
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleAdult}
            disabled={saving}
            className={`w-16 h-9 rounded-full flex items-center px-1 shadow-inner transition disabled:opacity-60 ${
              adult ? "bg-gradient-to-r from-red-600 to-pink-600 justify-end" : "bg-gray-300 dark:bg-gray-700 justify-start"
            }`}
            aria-label="Toggle 18+"
          >
            <span className="w-7 h-7 rounded-full bg-white shadow" />
          </button>
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Peringatan 18+</DialogTitle>
            </DialogHeader>

            <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
              Dengan mencentang kotak ini. Anda sudah setuju bahwa dosa anda ditanggung sendiri. Developer tidak
              bertanggung jawab ataupun berbagi dosa dengan apapun yang anda baca. Ini adalah peringatan terakhir.
              Bacaan anda selanjutnya penuh dosa~ kami tidak akan ikut bertanggung jawab.
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
              >
                Tidak, saya tidak mau.
              </button>
              <button
                type="button"
                onClick={confirmYes}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold disabled:opacity-60"
              >
                Ya, saya tau itu.
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
