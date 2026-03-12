"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ReaderError({ error, reset }: Props) {
  return (
    <ErrorView
      title="Reader mengalami kendala"
      message="An error occurred while loading the chapter. Try again or return to the work page."
      error={error}
      reset={reset}
      homeHref="/browse"
      backHref="/browse"
    />
  );
}
