"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-subtle p-6 text-center">
        <h2 className="text-lg font-bold text-ink">Something went wrong</h2>
        <p className="max-w-sm text-sm text-muted">
          {error.message || "An unexpected error occurred."}
        </p>
        <button type="button" className="btn btn-gradient" onClick={() => reset()}>
          Try again
        </button>
      </body>
    </html>
  );
}
