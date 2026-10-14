"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useOptionalExperience } from "@/components/experience/ExperienceProvider";
import { stripLocale } from "@/i18n/config";
import { useLocalePath, useUi } from "@/i18n/LocaleProvider";
import { labPath } from "@/lib/orbital/query";
import { LanguageMenu } from "./LanguagePicker";

export function SiteHeader() {
  const ui = useUi();
  const path = useLocalePath();
  const pathname = stripLocale(usePathname());
  const links = [
    { href: "/", label: ui.nav.tour },
    { href: "/learn", label: ui.nav.learn },
    { href: "/lab", label: ui.nav.lab },
    { href: "/about", label: ui.nav.about },
    { href: "/educators", label: ui.nav.educators },
  ];
  const experience = useOptionalExperience();
  const destination = (href: string) =>
    path(
      href === "/lab" && experience
        ? labPath(experience.parameters, experience.scale, experience.timeKyr)
        : href,
    );
  const menu = useRef<HTMLDetailsElement>(null);
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menu.current?.contains(event.target) &&
        menu.current
      )
        menu.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    };
    const close = () => {
      if (menu.current) menu.current.open = false;
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", escape);
    window.addEventListener("popstate", close);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("popstate", close);
    };
  }, []);
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        {ui.nav.skip}
      </a>
      <div className="site-header__inner">
        <Link className="site-brand" href={path("/")} translate="no">
          <span className="site-brand__mark" aria-hidden="true" />
          <span>Milanković</span>
        </Link>
        <nav className="site-nav site-nav--desktop" aria-label={ui.nav.primary}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={destination(link.href)}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__tools">
          <LanguageMenu />
          <details
            className="site-menu"
            ref={menu}
            onBlur={(event) => {
              if (
                event.relatedTarget instanceof Node &&
                !event.currentTarget.contains(event.relatedTarget)
              )
                event.currentTarget.open = false;
            }}
          >
            <summary>{ui.nav.menu}</summary>
            <nav aria-label={ui.nav.mobile}>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={destination(link.href)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  onClick={() => {
                    if (menu.current) menu.current.open = false;
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
