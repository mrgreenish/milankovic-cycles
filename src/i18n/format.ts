/** Fill `{name}` slots in a translated sentence. */
export function fill(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** A number with the language's decimal mark. */
export function num(ui: { decimal: string }, value: number, digits = 0) {
  const text = value.toFixed(digits);
  return ui.decimal === "." ? text : text.replace(".", ui.decimal);
}

/** Whole number with a thousands separator, e.g. 21000 -> "21.000". */
export function group(value: number, separator: string) {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}
