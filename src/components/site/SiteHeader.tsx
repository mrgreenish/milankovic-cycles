import Link from "next/link";

const links = [
  { href: "/", label: "Tour" },
  { href: "/learn", label: "Learn" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
  { href: "/educators", label: "Educators" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to Content
      </a>
      <div className="site-header__inner">
        <Link className="site-brand" href="/" translate="no">
          <span className="site-brand__mark" aria-hidden="true" />
          <span>Milanković</span>
        </Link>

        <nav className="site-nav site-nav--desktop" aria-label="Primary navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <details className="site-menu">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
