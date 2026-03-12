"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WorkSlugError({ error, reset }: Props) {
  return (
    <ErrorView
      title="Failed to load work"
      message="An error occurred while loading the work page. Please try again."
      error={error}
      reset={reset}
      homeHref="/browse"
      backHref="/browse"
    />
  );
}
