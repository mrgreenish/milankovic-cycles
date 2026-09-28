"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useOptionalExperience } from "@/components/experience/ExperienceProvider";
import { labPath } from "@/lib/orbital/query";

const links = [
  { href: "/", label: "Tour" },
  { href: "/learn", label: "Learn" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
  { href: "/educators", label: "Educators" },
];
export function SiteHeader() {
  const pathname = usePathname();
  const experience = useOptionalExperience();
  const destination = (href: string) =>
    href === "/lab" && experience
      ? labPath(experience.parameters, experience.scale)
      : href;
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
        Skip to content
      </a>
      <div className="site-header__inner">
        <Link className="site-brand" href="/" translate="no">
          <span className="site-brand__mark" aria-hidden="true" />
          <span>Milanković</span>
        </Link>
        <nav
          className="site-nav site-nav--desktop"
          aria-label="Primary navigation"
        >
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
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
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
    </header>
  );
}
