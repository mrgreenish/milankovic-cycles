"use client";

import { QuietLink } from "@/components/site/QuietLink";
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
        <QuietLink href={path("/learn")}>{ui.footer.guides}</QuietLink>
        <LabLink>{ui.footer.openLab}</LabLink>
        <QuietLink href={path("/sources")}>{ui.footer.sources}</QuietLink>
        <QuietLink href={path("/about")}>{ui.footer.about}</QuietLink>
        <QuietLink href={path("/educators")}>{ui.footer.educators}</QuietLink>
        <QuietLink href={path("/faq")}>{ui.footer.faq}</QuietLink>
      </nav>
      <div className="site-footer__base">
        <p className="site-footer__meta">{ui.footer.meta}</p>
        <LanguageLinks />
      </div>
    </footer>
  );
}
