"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorBoundary({ error, reset }: Props) {
  return (
    <ErrorView
      title="An Error Occurred"
      message="Something went wrong on the application side. You can try again."
      error={error}
      reset={reset}
      homeHref="/home"
    />
  );
}
