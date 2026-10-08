import Link from "next/link";
import { LabLink } from "@/components/experience/LabLink";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p className="site-footer__title">Milanković Cycles</p>
        <p className="site-footer__copy">
          A 3D tour of the orbital cycles behind the ice ages.
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/learn">Guides</Link>
        <LabLink>Open the lab</LabLink>
        <Link href="/sources">Sources and method</Link>
        <Link href="/about">About</Link>
        <Link href="/educators">For educators</Link>
        <Link href="/faq">FAQ</Link>
      </nav>
      <p className="site-footer__meta">
        By Filip van Harreveld · Great-grandson of Milutin Milanković
      </p>
    </footer>
  );
}
