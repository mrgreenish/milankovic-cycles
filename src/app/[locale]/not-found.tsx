"use client";

import Link from "next/link";
import { useLocalePath, useUi } from "@/i18n/LocaleProvider";

export default function NotFound() {
  const ui = useUi();
  const path = useLocalePath();
  return (
    <main className="error-page">
      <p className="eyebrow">404</p>
      <h1>{ui.errors.notFoundTitle}</h1>
      <p>{ui.errors.notFoundText}</p>
      <Link className="button button--primary" href={path("/")}>
        {ui.errors.notFoundBack}
      </Link>
    </main>
  );
}
