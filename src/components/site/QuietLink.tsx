import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * A link that waits for the click. Next.js prefetches every visible link, and
 * each route costs about four edge requests, so a page with thirty links made
 * dozens of requests per visit for pages most visitors never open. Only the
 * header navigation prefetches, with next/link directly.
 */
export function QuietLink(props: ComponentProps<typeof Link>) {
  return <Link prefetch={false} {...props} />;
}
