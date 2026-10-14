"use client";

import { useUi } from "@/i18n/LocaleProvider";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const ui = useUi();
  return (
    <main className="error-page">
      <p className="eyebrow">{ui.errors.errorEyebrow}</p>
      <h1>{ui.errors.errorTitle}</h1>
      <p>{ui.errors.errorText}</p>
      <button className="button button--primary" type="button" onClick={reset}>
        {ui.errors.retry}
      </button>
    </main>
  );
}
