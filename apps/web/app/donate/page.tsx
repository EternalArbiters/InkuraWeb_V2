import PageScaffold from "@/app/components/PageScaffold";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export const revalidate = 3600;

export default async function DonatePage() {
  const [title, description, donateQrLabel] = await Promise.all([
    getActiveUILanguageText("Donate For Inkura", { section: "Navigation" }),
    getActiveUILanguageText("Thank you for supporting Inkura's development. Scan the QR code below to donate.", { section: "Page Donate" }),
    getActiveUILanguageText("Donate QR", { section: "Page Donate" }),
  ]);

  return (
    <PageScaffold title={title} description={description}>
      <div className="max-w-md">
        <div className="border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
          <img src="/images/donate-qr.jpeg" alt={donateQrLabel} className="w-full h-auto" />
        </div>
      </div>
    </PageScaffold>
  );
}
