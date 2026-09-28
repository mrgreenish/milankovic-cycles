import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LabExperience } from "@/components/lab/LabExperience";

export const metadata: Metadata = {
  title: "Orbital lab",
  description:
    "Change Earth’s orbit and tilt, then compare summer sunlight at 65°N.",
  alternates: { canonical: "/lab" },
  openGraph: {
    title: "Orbital lab · Milanković Cycles",
    description:
      "Change Earth’s orbit and tilt, then compare summer sunlight at 65°N.",
    url: "/lab",
  },
};

export default function LabPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="lab-page">
        <Suspense
          fallback={
            <div className="lab-loading" role="status">
              Loading the lab…
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
