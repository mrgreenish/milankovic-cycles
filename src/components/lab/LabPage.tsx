import { Suspense } from "react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import type { Locale } from "@/i18n/config";
import { getUi } from "@/i18n/ui";
import { LabExperience } from "./LabExperience";

/**
 * The lab as a whole page. `/lab` renders it, and so does the copy of the
 * page that a shared setup is served from (`app/[locale]/lab/setup`); the two
 * differ only in their link preview.
 */
export function LabPage({ locale }: { locale: Locale }) {
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
