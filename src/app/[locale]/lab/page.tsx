import type { Metadata } from "next";
import { LabPage } from "@/components/lab/LabPage";
import { getContent } from "@/i18n/content";
import { pageMetadata, resolveLocale, type LocaleParams } from "@/i18n/page";

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props);
  const { meta } = getContent(locale).lab;
  return pageMetadata({ locale, path: "/lab", ...meta });
}

export default async function Page(props: LocaleParams) {
  return <LabPage locale={await resolveLocale(props)} />;
}
