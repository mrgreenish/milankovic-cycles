import Link from "next/link";

export default function NotFound() {
  return (
    <main className="error-page">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>
        This address doesn’t match a page. You can start again from the tour.
      </p>
      <Link className="button button--primary" href="/">
        Return to the tour
      </Link>
    </main>
  );
}
