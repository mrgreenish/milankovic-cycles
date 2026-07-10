import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LabExperience } from "@/components/lab/LabExperience";

export const metadata: Metadata = {
  title: "Orbital Lab",
  description: "Experiment with eccentricity, obliquity, and precession using validated orbital inputs.",
};

export default function LabPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="lab-page">
        <Suspense fallback={<div className="lab-loading">Preparing the orbital lab…</div>}>
          <LabExperience />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

