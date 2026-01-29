import SignInClient from "./signin-client";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});
  const raw = sp.callbackUrl;
  const callbackUrl = (Array.isArray(raw) ? raw[0] : raw) || "/home";

  return <SignInClient callbackUrl={callbackUrl} />;
}
