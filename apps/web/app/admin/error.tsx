"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: Props) {
  return (
    <ErrorView
      title="Admin page error"
      message="An error occurred while loading the Admin page. Try again or return to the admin dashboard."
      error={error}
      reset={reset}
      homeHref="/admin"
      backHref="/admin"
    />
  );
}
