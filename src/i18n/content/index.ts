import type { Locale } from "../config";
import type { LearnTopic } from "@/lib/learn/topics";
import { en, type Content } from "./en";
import { nl } from "./nl";
import { sr } from "./sr";
import { topicsEn } from "./topics-en";
import { topicsNl } from "./topics-nl";
import { topicsSr } from "./topics-sr";

export type { Content };

const CONTENT: Record<Locale, Content> = { en, nl, sr };
const TOPICS: Record<Locale, LearnTopic[]> = {
  en: topicsEn,
  nl: topicsNl,
  sr: topicsSr,
};

export function getContent(locale: Locale): Content {
  return CONTENT[locale];
}

export function getTopics(locale: Locale): LearnTopic[] {
  return TOPICS[locale];
}

export function getTopic(locale: Locale, slug: string) {
  return TOPICS[locale].find((topic) => topic.slug === slug);
}
