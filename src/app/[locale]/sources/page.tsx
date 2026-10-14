import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SourceTable } from "@/components/site/SourceTable";
import { localePath } from "@/i18n/config";
import { getContent } from "@/i18n/content";
import { num } from "@/i18n/format";
import {
  pageMetadata,
  resolveLocale,
  type LocaleParams,
} from "@/i18n/page";
import { getUi } from "@/i18n/ui";
import { ORBITAL_MILESTONES } from "@/lib/orbital/milestones";

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props);
  const { meta } = getContent(locale).sources;
  return pageMetadata({ locale, path: "/sources", ...meta });
}

const references = [
  {
    href: "https://doi.org/10.1051/0004-6361:20041335",
    label:
      "Laskar et al. (2004), A long-term numerical solution for Earth's insolation quantities",
  },
  {
    href: "https://doi.org/10.1029/2004PA001071",
    label:
      "Lisiecki and Raymo (2005), A Pliocene-Pleistocene stack of 57 globally distributed benthic δ18O records",
  },
  {
    href: "https://doi.org/10.1038/s41586-020-2617-x",
    label: "Tierney et al. (2020), Glacial cooling and climate sensitivity revisited",
  },
  {
    href: "https://doi.org/10.1126/science.194.4270.1121",
    label:
      "Hays, Imbrie and Shackleton (1976), Variations in the Earth’s orbit: pacemaker of the ice ages",
  },
  {
    href: "https://ssp.imcce.fr/insola/earth/online/earth/La2004/README.TXT",
    label: "IMCCE La2004 data format and provenance",
  },
  {
    href: "https://science.nasa.gov/earth/earth-observatory/milutin-milankovitch/",
    label: "NASA Earth Observatory: Milutin Milankovitch",
  },
  {
    href: "https://science.nasa.gov/science-research/earth-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/",
    label: "NASA: Orbital cycles and Earth's climate",
  },
  {
    href: "https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science",
    label: "NASA Solar Irradiance Science",
  },
];

export default async function SourcesPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const { sources: text } = getContent(locale);
  const ui = getUi(locale);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page sources-page">
        <header className="page-hero">
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className="page-lede">{text.lede}</p>
        </header>

        <section className="editorial-section editorial-grid">
          <div>
            <p className="eyebrow">{text.calcEyebrow}</p>
            <h2>{text.calcTitle}</h2>
          </div>
          <div>
            {text.calcParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="method-card">
          <p className="eyebrow">{text.equationsEyebrow}</p>
          <h2>{text.equationsTitle}</h2>
          <div className="equation-list">
            <code>ρ = (1 − e²) / (1 + e cos(λ − λₚ))</code>
            <code>δ = asin(sin ε · sin λ)</code>
            <code>Q = S₀ / (πρ²) · [H₀ sin φ sin δ + cos φ cos δ sin H₀]</code>
          </div>
          <p>{text.equationsNote}</p>
        </section>

        <section className="editorial-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">{text.momentsEyebrow}</p>
              <h2>{text.momentsTitle}</h2>
            </div>
            <p>{text.momentsNote}</p>
          </div>
          <SourceTable label={text.tableLabel}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{text.columns.preset}</th>
                  <th scope="col">{text.columns.time}</th>
                  <th scope="col">{text.columns.eccentricity}</th>
                  <th scope="col">{text.columns.obliquity}</th>
                  <th scope="col">{text.columns.perihelion}</th>
                  <th scope="col">{text.columns.sunlight}</th>
                </tr>
              </thead>
              <tbody>
                {ORBITAL_MILESTONES.map((milestone) => (
                  <tr key={milestone.id}>
                    <th scope="row">{ui.milestones[milestone.id].label}</th>
                    <td>
                      {milestone.kyrFromJ2000 > 0 ? "+" : ""}
                      {milestone.kyrFromJ2000} {text.kyr}
                    </td>
                    <td>{num(ui, milestone.parameters.eccentricity, 9)}</td>
                    <td>{num(ui, milestone.parameters.obliquityDeg, 6)}°</td>
                    <td>
                      {num(
                        ui,
                        milestone.parameters.earthPerihelionLongitudeDeg,
                        6,
                      )}
                      °
                    </td>
                    <td>
                      {num(
                        ui,
                        milestone.expectedReading.dailyMeanTopOfAtmosphereWm2,
                        2,
                      )}{" "}
                      W/m²
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SourceTable>
        </section>

        <section className="editorial-section editorial-grid">
          <div>
            <p className="eyebrow">{text.clockEyebrow}</p>
            <h2>{text.clockTitle}</h2>
          </div>
          <div>
            {text.clockParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="editorial-section editorial-grid">
          <div>
            <p className="eyebrow">{text.tempEyebrow}</p>
            <h2>{text.tempTitle}</h2>
          </div>
          <div>
            {text.tempParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="editorial-section editorial-grid">
          <div>
            <p className="eyebrow">{text.limitsEyebrow}</p>
            <h2>{text.limitsTitle}</h2>
          </div>
          <div>
            {text.limitsParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="references">
          <p className="eyebrow">{text.referencesEyebrow}</p>
          <h2>{text.referencesTitle}</h2>
          <ul>
            {references.map((reference) => (
              <li key={reference.href}>
                <a href={reference.href}>{reference.label}</a>
              </li>
            ))}
          </ul>
        </section>

        <div className="page-end-cta">
          <p>{text.endText}</p>
          <Link className="button button--primary" href={localePath(locale, "/lab")}>
            {text.endButton}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
