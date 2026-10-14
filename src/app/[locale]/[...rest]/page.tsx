import { notFound } from "next/navigation";

// Rendered on request: there is no finite list of addresses that are not pages.
export const dynamic = "force-dynamic";

/** Any address that is not a page renders the localized 404. */
export default function UnknownPage() {
  notFound();
}
