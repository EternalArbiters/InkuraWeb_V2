"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SearchError({ error, reset }: Props) {
  return (
    <ErrorView
      title="Search error"
      message="An error occurred while loading the search results. Please try again."
      error={error}
      reset={reset}
      homeHref="/search"
      backHref="/search"
    />
  );
}
