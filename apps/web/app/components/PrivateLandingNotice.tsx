import PrivateLoginForm from './PrivateLoginForm';

const MESSAGE =
  'Ngapain klean kesini, mau lihat my koleksi gweh? Hoo tidak semudah itu ferguso. Ini my mine gwej doang.';

// v30: shown instead of the normal landing page when PRIVATE_MODE=true. Deliberately
// self-contained (no imports from LandingPage.tsx / AuthModal) so it can never surface
// a "sign up" affordance — the credentials form is embedded directly here, not a link
// out to the shared /auth/signin page.
export default function PrivateLandingNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center dark:bg-black">
      <div className="max-w-md space-y-6">
        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{MESSAGE}</p>
        <PrivateLoginForm />
      </div>
    </main>
  );
}
