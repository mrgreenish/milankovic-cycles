import type { Locale } from "../config";
import { en, type Ui } from "./en";
import { nl } from "./nl";
import { sr } from "./sr";

export type { Ui };
export { en };

const UI: Record<Locale, Ui> = { en, nl, sr };

export function getUi(locale: Locale): Ui {
  return UI[locale];
}
