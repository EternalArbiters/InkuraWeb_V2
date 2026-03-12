import BackButton from "@/app/components/BackButton";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : {};
  const raw = sp.error;
  const error = Array.isArray(raw) ? raw[0] : raw;

  let message = "An unknown error occurred.";

  switch (error) {
    case "CredentialsSignin":
      message = "Incorrect email or password. Please try again.";
      break;
    case "AccessDenied":
      message = "Access denied. You do not have permission.";
      break;
    case "Configuration":
      message = "Authentication configuration is invalid.";
      break;
    case "Verification":
      message = "Verification failed or the link has expired.";
      break;
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="bg-gray-800 p-6 rounded-2xl shadow-xl text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4">Sign-in Failed</h1>
        <p className="text-white/80">{message}</p>
        <BackButton href="/auth/signin" className="mt-6" />
      </div>
    </main>
  );
}
