import { Fragment, type ReactNode } from "react";

/** Render `*word*` as emphasis. */
export function Rich({ text }: { text: string }) {
  return text.split(/\*([^*]+)\*/).map((part, index) =>
    index % 2 === 1 ? <em key={index}>{part}</em> : <Fragment key={index}>{part}</Fragment>,
  );
}

/** Replace `{name}` markers in a sentence with elements, keeping the rest as text. */
export function Slots({
  text,
  slots,
}: {
  text: string;
  slots: Record<string, ReactNode>;
}) {
  return text.split(/(\{\w+\})/).map((part, index) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return name && name in slots ? (
      <Fragment key={index}>{slots[name]}</Fragment>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    );
  });
}
