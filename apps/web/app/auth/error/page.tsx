import BackButton from "@/app/components/BackButton";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : {};
  const raw = sp.error;
  const error = Array.isArray(raw) ? raw[0] : raw;

  const [title, unknownMessage, credentialsMessage, accessDeniedMessage, configurationMessage, verificationMessage] =
    await Promise.all([
      getActiveUILanguageText("Sign-in failed", { section: "Option A Misc Pages & Placeholders" }),
      getActiveUILanguageText("An unknown error occurred.", { section: "Option A Admin & Reporting" }),
      getActiveUILanguageText("Incorrect email or password. Please try again.", { section: "Option A Admin & Reporting" }),
      getActiveUILanguageText("Access denied. You do not have permission.", { section: "Option A Admin & Reporting" }),
      getActiveUILanguageText("Authentication configuration is invalid.", { section: "Option A Admin & Reporting" }),
      getActiveUILanguageText("Verification failed or the link has expired.", { section: "Option A Admin & Reporting" }),
    ]);

  let message = unknownMessage;

  switch (error) {
    case "CredentialsSignin":
      message = credentialsMessage;
      break;
    case "AccessDenied":
      message = accessDeniedMessage;
      break;
    case "Configuration":
      message = configurationMessage;
      break;
    case "Verification":
      message = verificationMessage;
      break;
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="bg-gray-800 p-6 rounded-2xl shadow-xl text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        <p className="text-white/80">{message}</p>
        <BackButton href="/auth/signin" className="mt-6" />
      </div>
    </main>
  );
}
