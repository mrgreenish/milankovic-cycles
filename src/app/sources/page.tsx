import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SourceTable } from "@/components/site/SourceTable";
import { ORBITAL_MILESTONES } from "@/lib/orbital/milestones";

export const metadata: Metadata = {
  title: "Sources and method",
  description:
    "Where the orbit and ice data come from, the equations behind the sunlight number, and what the lab cannot tell you.",
  alternates: { canonical: "/sources" },
  openGraph: {
    title: "Sources and method · Milanković Cycles",
    description:
      "Where the orbit and ice data come from, the equations behind the sunlight number, and what the lab cannot tell you.",
    url: "/sources",
  },
};

export default function SourcesPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page sources-page">
        <header className="page-hero">
          <p className="eyebrow">Data and calculations</p>
          <h1>Sources and method</h1>
          <p className="page-lede">
            The tour and the lab calculate sunlight at 65°N on the summer
            solstice. This page lists the equations, the data and the limits
            behind that number.
          </p>
        </header>

        <section className="editorial-section editorial-grid">
          <div>
            <p className="eyebrow">What is calculated</p>
            <h2>Midsummer sunlight at 65°N</h2>
          </div>
          <div>
            <p>
              The number is the daily mean of incoming solar radiation at 65°N
              on the northern summer solstice, at the top of the atmosphere.
              It is not sunlight at the ground, a temperature, or an ice-sheet
              size. The lab’s temperature and ice estimates are a separate,
              rougher step, described below.
            </p>
            <p>
              The calculation uses a total solar irradiance of 1361 W/m² and the
              standard daily insolation geometry from Berger&apos;s
              astronomical formulation.
            </p>
          </div>
        </section>

        <section className="method-card">
          <p className="eyebrow">Calculation</p>
          <h2>From orbit to daily insolation</h2>
          <div className="equation-list">
            <code>ρ = (1 − e²) / (1 + e cos(λ − λₚ))</code>
            <code>δ = asin(sin ε · sin λ)</code>
            <code>Q = S₀ / (πρ²) · [H₀ sin φ sin δ + cos φ cos δ sin H₀]</code>
          </div>
          <p>
            φ is latitude, ε is obliquity, λ is solar longitude, ρ is the
            Earth–Sun distance in astronomical units, and H₀ is the half day
            length, which also covers polar day and night. λₚ is the Sun’s
            longitude at perihelion, 180° from the perihelion longitude the
            sliders show.
          </p>
        </section>

        <section className="editorial-section">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Four moments</p>
              <h2>Orbital values from La2004</h2>
            </div>
            <p>Epochs are relative to J2000.</p>
          </div>
          <SourceTable>
            <table>
              <thead>
                <tr>
                  <th scope="col">Preset</th>
                  <th scope="col">Time</th>
                  <th scope="col">Eccentricity</th>
                  <th scope="col">Obliquity</th>
                  <th scope="col">Perihelion</th>
                  <th scope="col">65°N Q</th>
                </tr>
              </thead>
              <tbody>
                {ORBITAL_MILESTONES.map((milestone) => (
                  <tr key={milestone.id}>
                    <th scope="row">{milestone.label}</th>
                    <td>
                      {milestone.kyrFromJ2000 > 0 ? "+" : ""}
                      {milestone.kyrFromJ2000} kyr
                    </td>
                    <td>{milestone.parameters.eccentricity.toFixed(9)}</td>
                    <td>{milestone.parameters.obliquityDeg.toFixed(6)}°</td>
                    <td>
                      {milestone.parameters.earthPerihelionLongitudeDeg.toFixed(
                        6,
                      )}
                      °
                    </td>
                    <td>
                      {milestone.expectedReading.dailyMeanTopOfAtmosphereWm2.toFixed(
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
            <p className="eyebrow">The clock</p>
            <h2>800,000 years of orbit and ice</h2>
          </div>
          <div>
            <p>
              The orbit on the clock is the nominal La2004 solution of Laskar
              and colleagues, read at every 1,000 years from 800,000 years ago
              to 100,000 years ahead, with linear steps in between. The
              four moments above are exact nodes of the same data.
            </p>
            <p>
              The ice line is the LR04 stack of 57 benthic oxygen-isotope
              records (Lisiecki and Raymo, 2005), which follows global ice
              volume. The scale runs from 0% at today’s value to 100% at its
              highest point in the last 30,000 years. Beyond 600,000 years the
              stack is sampled every 2,000 years and the gaps are filled in
              linearly. The line stops at today because nothing here predicts
              future ice.
            </p>
            <p>
              The ice drawn on the globe is an illustration. Its size follows
              the ice line, and its outline is drawn by hand after the last
              glacial maximum. Earth’s surface comes from NASA Earth Observatory imagery: Blue Marble, Black Marble and GEBCO terrain.
            </p>
          </div>
        </section>

        <section className="editorial-section editorial-grid">
          <div>
            <p className="eyebrow">Temperature and ice</p>
            <h2>A rough estimate, in two parts</h2>
          </div>
          <div>
            <p>
              At a date on the clock, ice is the measured LR04 value. Ice and
              global temperature move together, and the last glacial maximum
              was about 6.1 °C colder than before industry (Tierney et al.,
              2020), so temperature is minus 6.1 °C times the ice share. A
              figure near 14 °C is used for the average temperature before
              industry.
            </p>
            <p>
              For an orbit set by hand, the lab asks what would settle if it
              lasted. Fitted to the last 800,000 years, ice follows 65°N summer
              sunlight smoothed over about 15,000 years, at 0.018 of the
              ice-age peak for every W/m² of sunlight lost (correlation about
              −0.46). On the warm side the response flattens, because there is
              little ice left to melt. The fit is checked against the data in
              the project’s tests.
            </p>
            <p>
              Carbon dioxide, oceans and the ice already in place are left out,
              so the estimate can differ a lot from a real date: with a
              hand-set orbit, 21,000 years ago shows far less ice than the
              record, because the record built up over many earlier summers.
              Today’s real temperature is about 1.2 °C above the baseline
              because of greenhouse gases.
            </p>
          </div>
        </section>

        <section className="editorial-section editorial-grid">
          <div>
            <p className="eyebrow">Limits</p>
            <h2>Sunlight alone does not predict climate</h2>
          </div>
          <div>
            <p>
              The lab calls sunlight within ±5 W/m² of the J2000 reference
              “close to today’s level”. That range is a wording choice, not a
              physical threshold.
            </p>
            <p>
              Existing ice, snowfall, oceans, greenhouse gases, vegetation,
              dust, geography and long response times decide what the climate
              does. The +50,000-year moment is orbital geometry, not a climate
              forecast.
            </p>
          </div>
        </section>

        <section className="references">
          <p className="eyebrow">Primary references</p>
          <h2>Read the sources</h2>
          <ul>
            <li>
              <a href="https://doi.org/10.1051/0004-6361:20041335">
                Laskar et al. (2004), A long-term numerical solution for
                Earth&apos;s insolation quantities
              </a>
            </li>
            <li>
              <a href="https://doi.org/10.1029/2004PA001071">
                Lisiecki and Raymo (2005), A Pliocene-Pleistocene stack of 57
                globally distributed benthic δ18O records
              </a>
            </li>
            <li>
              <a href="https://doi.org/10.1038/s41586-020-2617-x">
                Tierney et al. (2020), Glacial cooling and climate sensitivity
                revisited
              </a>
            </li>
            <li>
              <a href="https://doi.org/10.1126/science.194.4270.1121">
                Hays, Imbrie and Shackleton (1976), Variations in the Earth’s
                orbit: pacemaker of the ice ages
              </a>
            </li>
            <li>
              <a href="https://ssp.imcce.fr/insola/earth/online/earth/La2004/README.TXT">
                IMCCE La2004 data format and provenance
              </a>
            </li>
            <li>
              <a href="https://science.nasa.gov/earth/earth-observatory/milutin-milankovitch/">
                NASA Earth Observatory: Milutin Milankovitch
              </a>
            </li>
            <li>
              <a href="https://science.nasa.gov/science-research/earth-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/">
                NASA: Orbital cycles and Earth&apos;s climate
              </a>
            </li>
            <li>
              <a href="https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science">
                NASA Solar Irradiance Science
              </a>
            </li>
          </ul>
        </section>

        <div className="page-end-cta">
          <p>Try the calculation with your own settings.</p>
          <Link className="button button--primary" href="/lab">
            Open the lab
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
