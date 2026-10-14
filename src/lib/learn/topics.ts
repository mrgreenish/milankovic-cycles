export type TopicSection = {
  heading: string;
  paragraphs: string[];
};

export type LearnTopic = {
  slug: string;
  shortTitle: string;
  eyebrow: string;
  title: string;
  description: string;
  answer: string;
  period: string;
  facts: Array<{ label: string; title: string; copy: string }>;
  sections: TopicSection[];
  questions: Array<{ question: string; answer: string }>;
};

/** Guide addresses are the same in every language; only the text is translated. */
export const TOPIC_SLUGS = [
  "eccentricity",
  "obliquity",
  "precession",
  "65-north-insolation",
  "modern-climate-change",
] as const;
