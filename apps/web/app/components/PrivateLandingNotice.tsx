import Link from "next/link";

const MESSAGE =
  "Mohon maaf, Inkura sedang tidak dapat beroprasi. Jika kamu adalah pengunjung, silahkan hubungi owner untuk informasi lebih lanjut terkait pemberhentian ini. Dan jika kamu adalah owner, silahkan buktikan dirimu memanglah ownernya. Karena Inkura saat ini tidak menerima pengunjung.";

// v30: shown instead of the normal landing page when PRIVATE_MODE=true. Deliberately
// self-contained (no imports from LandingPage.tsx / AuthModal) so it can never surface
// a "sign up" affordance — the only way forward is the sign-in page itself.
export default function PrivateLandingNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center dark:bg-black">
      <div className="max-w-md space-y-6">
        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{MESSAGE}</p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-6 py-2.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-900"
        >
          Login
        </Link>
      </div>
    </main>
  );
}
