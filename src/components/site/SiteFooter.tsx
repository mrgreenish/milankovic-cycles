"use client";

import Link from "next/link";
import { LabLink } from "@/components/experience/LabLink";
import { useLocalePath, useUi } from "@/i18n/LocaleProvider";
import { LanguageLinks } from "./LanguagePicker";

export function SiteFooter() {
  const ui = useUi();
  const path = useLocalePath();
  return (
    <footer className="site-footer">
      <div>
        <p className="site-footer__title">{ui.footer.title}</p>
        <p className="site-footer__copy">{ui.footer.copy}</p>
      </div>
      <nav aria-label={ui.footer.nav}>
        <Link href={path("/learn")}>{ui.footer.guides}</Link>
        <LabLink>{ui.footer.openLab}</LabLink>
        <Link href={path("/sources")}>{ui.footer.sources}</Link>
        <Link href={path("/about")}>{ui.footer.about}</Link>
        <Link href={path("/educators")}>{ui.footer.educators}</Link>
        <Link href={path("/faq")}>{ui.footer.faq}</Link>
      </nav>
      <div className="site-footer__base">
        <p className="site-footer__meta">{ui.footer.meta}</p>
        <LanguageLinks />
      </div>
    </footer>
  );
}
