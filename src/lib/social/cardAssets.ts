import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

/**
 * Fonts and pictures for the preview cards, read once per server process.
 * The card renderer takes TTF, OTF or WOFF only, so the two families the site
 * loads through `next/font` come here as WOFF from their `@fontsource`
 * packages.
 *
 * Each file is named in full where it is read. The build follows those paths
 * to pack exactly these files with the card route; a path put together from
 * variables would make it pack the whole project instead.
 */
const fontsource = "node_modules/@fontsource";
const read = (path: string) => readFile(path);
const FONTS = [
  {
    name: "Fraunces",
    weight: 600,
    file: join(
      process.cwd(),
      fontsource,
      "fraunces/files/fraunces-latin-600-normal.woff",
    ),
  },
  {
    name: "Fraunces Ext",
    weight: 600,
    file: join(
      process.cwd(),
      fontsource,
      "fraunces/files/fraunces-latin-ext-600-normal.woff",
    ),
  },
  {
    name: "Mono",
    weight: 500,
    file: join(
      process.cwd(),
      fontsource,
      "jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff",
    ),
  },
  {
    name: "Mono Ext",
    weight: 500,
    file: join(
      process.cwd(),
      fontsource,
      "jetbrains-mono/files/jetbrains-mono-latin-ext-500-normal.woff",
    ),
  },
  {
    name: "Mono",
    weight: 700,
    file: join(
      process.cwd(),
      fontsource,
      "jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff",
    ),
  },
  {
    name: "Mono Ext",
    weight: 700,
    file: join(
      process.cwd(),
      fontsource,
      "jetbrains-mono/files/jetbrains-mono-latin-ext-700-normal.woff",
    ),
  },
] as const;
const GLOBE = join(process.cwd(), "public/images/globe-poster-1600.webp");
const PORTRAIT = join(process.cwd(), "public/miltin-milankovic.jpg");

/** Latin first, then the file with č, ć, đ, š and ž, which Serbian and “Milanković” need. */
export const SERIF = "Fraunces, Fraunces Ext";
export const MONO = "Mono, Mono Ext";

const dataUrl = (type: string, data: Buffer) =>
  `data:${type};base64,${data.toString("base64")}`;

async function loadFonts() {
  return Promise.all(
    FONTS.map(async ({ name, weight, file }) => ({
      name,
      weight,
      style: "normal" as const,
      data: await read(file),
    })),
  );
}

export const GLOBE_SIZE = 660;
export const PORTRAIT_SIZE = { width: 436, height: 630 } as const;

/** The title globe, the same frame the site shows while the 3D scene loads. */
async function loadGlobe() {
  const png = await sharp(await read(GLOBE))
    .resize(GLOBE_SIZE, GLOBE_SIZE)
    .png()
    .toBuffer();
  return dataUrl("image/png", png);
}

async function loadPortrait() {
  const jpeg = await sharp(await read(PORTRAIT))
    .resize(PORTRAIT_SIZE.width, PORTRAIT_SIZE.height, { position: "top" })
    .jpeg({ quality: 92 })
    .toBuffer();
  return dataUrl("image/jpeg", jpeg);
}

let fonts: ReturnType<typeof loadFonts> | undefined;
let globe: Promise<string> | undefined;
let portrait: Promise<string> | undefined;

export const cardFonts = () => (fonts ??= loadFonts());
export const globePicture = () => (globe ??= loadGlobe());
export const portraitPicture = () => (portrait ??= loadPortrait());

/** The drawn card as a JPEG: a quarter of the PNG's size with a photo on it. */
export async function toJpeg(png: ArrayBuffer) {
  return sharp(Buffer.from(png))
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toBuffer();
}
