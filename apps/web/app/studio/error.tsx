"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StudioError({ error, reset }: Props) {
  return (
    <ErrorView
      title="Studio mengalami kendala"
      message="An error occurred while loading Studio. Try again or return to the works list."
      error={error}
      reset={reset}
      homeHref="/studio"
      backHref="/studio"
    />
  );
}
