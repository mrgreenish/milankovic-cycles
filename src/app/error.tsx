"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="error-page">
      <p className="eyebrow">The Orbit Slipped</p>
      <h1>Something went wrong.</h1>
      <p>The written explanation is still safe. Try loading the interactive layer again.</p>
      <button className="button button--primary" type="button" onClick={reset}>Try Again</button>
    </main>
  );
}

