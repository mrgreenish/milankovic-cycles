import Link from "next/link";

export default function NotFound() {
  return (
    <main className="error-page">
      <p className="eyebrow">404 · Off Orbit</p>
      <h1>This page drifted out of view.</h1>
      <Link className="button button--primary" href="/">Return to the Tour</Link>
    </main>
  );
}

