import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LabExperience } from "@/components/lab/LabExperience";
import { getContent } from "@/i18n/content";
import {
  pageMetadata,
  resolveLocale,
  type LocaleParams,
} from "@/i18n/page";
import { getUi } from "@/i18n/ui";

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props);
  const { meta } = getContent(locale).lab;
  return pageMetadata({ locale, path: "/lab", ...meta });
}

export default async function LabPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const ui = getUi(locale);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="lab-page">
        <Suspense
          fallback={
            <div className="lab-loading" role="status">
              {ui.lab.loading}
            </div>
          }
        >
          <LabExperience />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
