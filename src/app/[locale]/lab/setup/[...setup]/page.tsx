import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LabPage } from "@/components/lab/LabPage";
import { getContent } from "@/i18n/content";
import { pageMetadata, resolveLocale } from "@/i18n/page";
import { getUi } from "@/i18n/ui";
import { parseLabQuery } from "@/lib/orbital/query";
import { labShare } from "@/lib/social/labShare";

/**
 * The lab, as served for a shared link such as `/lab?t=-21` or
 * `/lab?e=0.05&o=24.5&p=270`.
 *
 * `/lab` is built once and cannot see the query, so its link preview is the
 * same for every setup. A rewrite in next.config.ts sends a full page load of
 * a shared link here instead, with the setup in the path (`setup/t/-21`,
 * `setup/o/0.05/24.5/270`). The page is the same lab; what differs is the
 * preview, which names the date or orbit and shows its sunlight. Each setup
 * is rendered the first time it is asked for and then kept, like the pages
 * built ahead of time. Visitors never see this address: the browser keeps the
 * one that was shared, and the lab reads the setup from there as it always has.
 */
type SetupProps = { params: Promise<{ locale: string; setup: string[] }> };

// No setup is built ahead of time; each is built on its first visit.
export function generateStaticParams() {
  return [];
}

/** The query a shared link carried, or null when the address is not one the rewrite makes. */
function sharedQuery([kind, ...values]: string[]) {
  if (kind === "t" && values.length === 1)
    return new URLSearchParams({ t: values[0] });
  if (kind === "o" && values.length === 3) {
    const [e, o, p] = values;
    return new URLSearchParams({ e, o, p });
  }
  return null;
}

export async function generateMetadata(props: SetupProps): Promise<Metadata> {
  const locale = await resolveLocale(props);
  const query = sharedQuery((await props.params).setup);
  if (!query) notFound();
  const { meta } = getContent(locale).lab;
  // Today's orbit and links with values out of range keep the plain lab preview.
  const share = labShare(parseLabQuery(query), getUi(locale));
  return pageMetadata({
    locale,
    path: "/lab",
    ...meta,
    share: share
      ? {
          path: `/lab?${query}`,
          title: `${meta.title}: ${share.heading}`,
          description: share.description,
          card: share.card,
          alt: share.alt,
        }
      : undefined,
  });
}

export default async function Page(props: SetupProps) {
  const locale = await resolveLocale(props);
  if (!sharedQuery((await props.params).setup)) notFound();
  return <LabPage locale={locale} />;
}
