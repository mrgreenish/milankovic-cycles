import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ORBITAL_MILESTONES } from "@/lib/orbital/milestones";

export const metadata: Metadata = {
  title: "Evidence & Sources",
  description: "Data provenance, equations, reference values, and limitations for the orbital lab.",
  alternates: { canonical: "/sources" },
  openGraph: {
    title: "Evidence & Sources · Milanković Cycles",
    description: "Data provenance, equations, reference values, and limitations for the orbital lab.",
    url: "/sources",
  },
};

export default function SourcesPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page sources-page">
        <header className="page-hero">
          <p className="eyebrow">Transparent by Design</p>
          <h1>Evidence, Method &amp; Limits</h1>
          <p className="page-lede">
            This experience calculates one defensible astronomical quantity and says clearly what
            it cannot predict.
          </p>
        </header>

        <section className="editorial-section editorial-grid">
          <div><p className="eyebrow">Primary Output</p><h2>Northern summer sunlight</h2></div>
          <div>
            <p>
              The Lab shows daily-mean incoming solar radiation at 65°N on the northern summer
              solstice, at the top of the atmosphere. It is not surface sunlight, local
              temperature, global temperature, or ice-sheet size.
            </p>
            <p>
              The calculation uses a total solar irradiance of 1361 W/m² and the standard daily
              insolation geometry associated with Berger&apos;s astronomical formulation.
            </p>
          </div>
        </section>

        <section className="method-card">
          <p className="eyebrow">Calculation</p>
          <h2>From orbit to daily-mean insolation</h2>
          <div className="equation-list">
            <code>ρ = (1 − e²) / (1 + e cos(λ − λₚ))</code>
            <code>δ = asin(sin ε · sin λ)</code>
            <code>Q = S₀ / (πρ²) · [H₀ sin φ sin δ + cos φ cos δ sin H₀]</code>
          </div>
          <p>
            Here, φ is latitude, ε is obliquity, λ is solar longitude, ρ is Earth–Sun distance in
            astronomical units, and H₀ handles day length including polar day and night.
          </p>
        </section>

        <section className="editorial-section">
          <div className="section-title-row"><div><p className="eyebrow">Validated Presets</p><h2>Exact La2004 nodes</h2></div><p>Epochs are relative to J2000.</p></div>
          <div className="source-table-wrap">
            <table>
              <thead><tr><th>Preset</th><th>Time</th><th>Eccentricity</th><th>Obliquity</th><th>Perihelion</th><th>65°N Q</th></tr></thead>
              <tbody>
                {ORBITAL_MILESTONES.map((milestone) => (
                  <tr key={milestone.id}>
                    <th>{milestone.label}</th>
                    <td>{milestone.kyrFromJ2000 > 0 ? "+" : ""}{milestone.kyrFromJ2000} kyr</td>
                    <td>{milestone.parameters.eccentricity.toFixed(9)}</td>
                    <td>{milestone.parameters.obliquityDeg.toFixed(6)}°</td>
                    <td>{milestone.parameters.earthPerihelionLongitudeDeg.toFixed(6)}°</td>
                    <td>{milestone.expectedReading.dailyMeanTopOfAtmosphereWm2.toFixed(2)} W/m²</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="editorial-section editorial-grid">
          <div><p className="eyebrow">What the Model Does Not Do</p><h2>Orbital tendency is not climate destiny</h2></div>
          <div>
            <p>
              The ±5 W/m² wording in the Lab is a display deadband, not a physical tipping point.
              It only summarizes whether orbital summer-melt pressure is lower, similar, or higher
              than the present reference.
            </p>
            <p>
              Existing ice, snowfall, oceans, greenhouse gases, vegetation, dust, geography, and
              long response times determine the actual climate response. The +50 kyr preset is
              orbital geometry—not a climate forecast.
            </p>
          </div>
        </section>

        <section className="references">
          <p className="eyebrow">Primary References</p>
          <h2>Read the source material</h2>
          <ul>
            <li><a href="https://doi.org/10.1051/0004-6361:20041335">Laskar et al. (2004), A long-term numerical solution for Earth&apos;s insolation quantities</a></li>
            <li><a href="https://ssp.imcce.fr/insola/earth/online/earth/La2004/README.TXT">IMCCE La2004 data format and provenance</a></li>
            <li><a href="https://science.nasa.gov/earth/earth-observatory/milutin-milankovitch/">NASA Earth Observatory: Milutin Milankovitch</a></li>
            <li><a href="https://science.nasa.gov/science-research/earth-science/milankovitch-orbital-cycles-and-their-role-in-earths-climate/">NASA: Orbital cycles and Earth&apos;s climate</a></li>
            <li><a href="https://earth.gsfc.nasa.gov/climate/projects/solar-irradiance/science">NASA Solar Irradiance Science</a></li>
          </ul>
        </section>

        <div className="page-end-cta"><p>Ready to test the geometry?</p><Link className="button button--primary" href="/lab">Open the Lab</Link></div>
      </main>
      <SiteFooter />
    </>
  );
}
