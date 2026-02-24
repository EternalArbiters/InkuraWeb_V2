import PageScaffold from "@/app/components/PageScaffold";

export const dynamic = "force-dynamic";

export default function DonatePage() {
  return (
    <PageScaffold
      title="Donate For Inkura"
      description="Terima kasih sudah membantu pengembangan Inkura. Scan QR code di bawah untuk donasi."
      crumbs={[{ label: "Home", href: "/home" }]}
    >
      <div className="max-w-md">
        <div className="border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/donate-qr.jng"
            alt="Donate QR"
            className="w-full h-auto"
          />
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
            Kalau QR belum diganti, cukup replace file <b>public/images/donate-qr.png</b> dengan QR asli.
          </div>
        </div>
      </div>
    </PageScaffold>
  );
}
