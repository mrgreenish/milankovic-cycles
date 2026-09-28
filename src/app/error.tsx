"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="error-page">
      <p className="eyebrow">Loading error</p>
      <h1>This page couldn’t load</h1>
      <p>
        Try loading the page again. If the problem continues, refresh your
        browser.
      </p>
      <button className="button button--primary" type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
