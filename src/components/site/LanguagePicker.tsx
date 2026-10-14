"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";
import {
  HTML_LANG,
  LOCALES,
  LOCALE_NAMES,
  localePath,
  stripLocale,
  type Locale,
} from "@/i18n/config";
import { useLocale, useUi } from "@/i18n/LocaleProvider";
import { isPlainLinkClick } from "@/lib/navigation";

/**
 * Plain links to the same page in each language. A full page load is what a
 * language switch should be, and it keeps the lab's settings: the query and
 * hash are read from the address bar at click time, because the lab rewrites
 * them without telling the router.
 */
function useSwitchTarget() {
  const pathname = usePathname();
  const site = stripLocale(pathname);
  const target = (locale: Locale) => localePath(locale, site);
  const go = (event: MouseEvent<HTMLAnchorElement>, locale: Locale) => {
    if (!isPlainLinkClick(event)) return;
    event.preventDefault();
    const { search, hash } = window.location;
    window.location.assign(`${target(locale)}${search}${hash}`);
  };
  return { target, go };
}

/** A quiet code in the header ("EN") that opens a short list. */
export function LanguageMenu() {
  const locale = useLocale();
  const ui = useUi();
  const { target, go } = useSwitchTarget();
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: Event) => {
      if (
        menu.current?.open &&
        !(event.target instanceof Node && menu.current.contains(event.target))
      )
        menu.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <details
      className="lang-menu"
      ref={menu}
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          event.currentTarget.open = false;
      }}
    >
      <summary aria-label={`${ui.language.change}: ${LOCALE_NAMES[locale].name}`}>
        <span aria-hidden="true">{LOCALE_NAMES[locale].short}</span>
      </summary>
      <div className="lang-menu__list" role="group" aria-label={ui.language.label}>
        {LOCALES.map((code) => (
          <a
            key={code}
            href={target(code)}
            lang={HTML_LANG[code]}
            hrefLang={HTML_LANG[code]}
            aria-current={code === locale ? "true" : undefined}
            onClick={(event) => go(event, code)}
          >
            {LOCALE_NAMES[code].name}
            <span aria-hidden="true">{LOCALE_NAMES[code].short}</span>
          </a>
        ))}
      </div>
    </details>
  );
}

/** The same choice as a row of links, for the foot of the page. */
export function LanguageLinks() {
  const locale = useLocale();
  const ui = useUi();
  const { target, go } = useSwitchTarget();
  return (
    <div className="language-links" role="group" aria-label={ui.language.label}>
      {LOCALES.map((code) => (
        <a
          key={code}
          href={target(code)}
          lang={HTML_LANG[code]}
          hrefLang={HTML_LANG[code]}
          aria-current={code === locale ? "true" : undefined}
          onClick={(event) => go(event, code)}
        >
          {LOCALE_NAMES[code].name}
        </a>
      ))}
    </div>
  );
}
