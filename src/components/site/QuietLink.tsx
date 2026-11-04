import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * Fetch the destination only when the visitor follows the link. Lab links
 * change with every tour slider or playback update, so prefetching them
 * would send a request for each new set of orbital parameters.
 */
export function QuietLink(props: ComponentProps<typeof Link>) {
  return <Link prefetch={false} {...props} />;
}
