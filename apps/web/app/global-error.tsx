"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <ErrorView
          title="An Error Occurred"
          message="A fatal application error occurred. You can try again."
          error={error}
          reset={reset}
          homeHref="/home"
        />
      </body>
    </html>
  );
}
