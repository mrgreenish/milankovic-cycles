import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <p className="site-footer__title">Milanković Cycles</p>
        <p className="site-footer__copy">
          A visual guide to the slow orbital motions that pace Earth&apos;s ice-age rhythm.
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/learn">Learn the Cycles</Link>
        <Link href="/lab">Open the Lab</Link>
        <Link href="/sources">Evidence &amp; Sources</Link>
        <Link href="/about">About the Project</Link>
        <Link href="/educators">For Educators</Link>
        <Link href="/faq">FAQ</Link>
      </nav>
      <p className="site-footer__meta">
        Created by Filip van Harreveld · Great-grandson of Milutin Milanković
      </p>
    </footer>
  );
}
