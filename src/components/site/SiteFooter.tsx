import Link from "next/link";
import { LabLink } from "@/components/experience/LabLink";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p className="site-footer__title">Milanković Cycles</p>
        <p className="site-footer__copy">
          Explore how Earth&apos;s orbit and tilt change summer sunlight.
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/learn">Learn the cycles</Link>
        <LabLink>Open the lab</LabLink>
        <Link href="/sources">Sources and method</Link>
        <Link href="/about">About the project</Link>
        <Link href="/educators">For educators</Link>
        <Link href="/faq">FAQ</Link>
      </nav>
      <p className="site-footer__meta">
        By Filip van Harreveld · Great-grandson of Milutin Milanković
      </p>
    </footer>
  );
}
