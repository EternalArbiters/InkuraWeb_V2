import SignInClient from "./signin-client";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SignInPage({
  searchParams,
}: {
  // Next.js 15 passes searchParams as a Promise.
  searchParams?: Promise<SearchParams>;
}) {
  const sp = await (searchParams ?? Promise.resolve({}));
  const raw = sp.callbackUrl;
  const callbackUrl = (Array.isArray(raw) ? raw[0] : raw) || "/home";

  return <SignInClient callbackUrl={callbackUrl} />;
}
