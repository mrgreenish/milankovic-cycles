"use client";

import { QuietLink } from "@/components/site/QuietLink";
import { useLocalePath, useUi } from "@/i18n/LocaleProvider";

export default function NotFound() {
  const ui = useUi();
  const path = useLocalePath();
  return (
    <main className="error-page">
      <p className="eyebrow">404</p>
      <h1>{ui.errors.notFoundTitle}</h1>
      <p>{ui.errors.notFoundText}</p>
      <QuietLink className="button button--primary" href={path("/")}>
        {ui.errors.notFoundBack}
      </QuietLink>
    </main>
  );
}
