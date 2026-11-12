// Reproducible offline asset build. See public/textures/space/README.md for sources.
// Run: npm run textures:build -- /path/to/downloaded/sources
import sharp from "sharp";
import { mkdir, copyFile, readFile, stat, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";
// A TypeScript file with nothing to erase but types; Node reads it directly.
import { alphaFromPacked, packWater } from "../src/lib/orbital/seaLevel.ts";

const source = process.argv[2];
if (!source)
  throw new Error(
    "Supply a directory containing day.jpg, night.jpg, height.jpg, clouds.jpg and depth.nc.",
  );
const out = resolve("public/textures/space");
const work = await mkdtemp(join(tmpdir(), "space-texture-build-"));
await mkdir(out, { recursive: true });
const platform = process.platform === "win32" ? "win" : process.platform;
const binary =
  process.env.SPACE_BASISU ??
  resolve(
    `node_modules/basisu/bin/${platform}/${process.arch}/basisu${platform === "win" ? ".exe" : ""}`,
  );
const clamp = (n) => Math.max(0, Math.min(1, n));
const smooth = (n) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};

async function rgb(name, width) {
  return sharp(join(source, name))
    .resize(width, width / 2, { fit: "fill" })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer();
}

// Repeatable, periodic value noise: no seam at either edge of the texture.
function noise(x, y, cells, seed) {
  const hash = (a, b) => {
    const n =
      Math.sin(
        (((a % cells) + cells) % cells) * 127.1 +
          (((b % cells) + cells) % cells) * 311.7 +
          seed * 73.3,
      ) * 43758.5453;
    return n - Math.floor(n);
  };
  const ix = Math.floor(x),
    iy = Math.floor(y),
    fx = smooth(x - ix),
    fy = smooth(y - iy);
  return (
    (hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx) * (1 - fy) +
    (hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx) * fy
  );
}

// The depth grid is a classic NetCDF file with one `altitude` variable in
// metres on a regular latitude and longitude grid (NOAA ETOPO1 through ERDDAP).
// Only that layout is read: 16-bit values, south to north, west to east.
async function depthGrid(name) {
  const file = await readFile(join(source, name));
  if (file.toString("latin1", 0, 3) !== "CDF" || file[3] !== 1)
    throw new Error(`${name} is not a classic NetCDF file.`);
  let at = 8;
  const int = () => {
    at += 4;
    return file.readUInt32BE(at - 4);
  };
  const text = () => {
    const length = int();
    const value = file.toString("utf8", at, at + length);
    at += Math.ceil(length / 4) * 4;
    return value;
  };
  const bytes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 4, 6: 8 };
  const attributes = () => {
    int();
    for (let left = int(); left > 0; left--) {
      text();
      const type = int();
      const count = int();
      at += Math.ceil((count * bytes[type]) / 4) * 4;
    }
  };
  int();
  const dims = Array.from({ length: int() }, () => ({
    name: text(),
    length: int(),
  }));
  attributes();
  int();
  for (let left = int(); left > 0; left--) {
    const variable = text();
    const shape = Array.from({ length: int() }, () => dims[int()]);
    attributes();
    const type = int();
    int();
    const begin = int();
    if (variable !== "altitude") continue;
    if (type !== 3 || shape.map((dim) => dim.name).join() !== "latitude,longitude")
      throw new Error(`${name}: altitude must be 16-bit on latitude × longitude.`);
    const [rows, columns] = shape.map((dim) => dim.length);
    return {
      rows,
      columns,
      // Row 0 is the south pole, column 0 is 180°W; both ends are included.
      at: (row, column) =>
        file.readInt16BE(begin + (row * columns + column) * 2),
    };
  }
  throw new Error(`${name} has no altitude variable.`);
}
const depths = await depthGrid("depth.nc");

/**
 * Which grid points are sea. Starting in the open Pacific, spread through
 * every neighbouring point below sea level. What is never reached keeps its
 * water when the sea falls: the Caspian, and land that lies below sea level.
 */
function connectedSea() {
  const { rows, columns } = depths;
  const sea = new Uint8Array(rows * columns);
  const queue = new Int32Array(rows * columns);
  let head = 0;
  let tail = 0;
  const visit = (row, column) => {
    if (row < 0 || row >= rows) return;
    // The first and last columns are the same meridian.
    const wrapped = (column + columns - 1) % (columns - 1);
    const index = row * columns + wrapped;
    if (sea[index] || depths.at(row, wrapped) >= 0) return;
    sea[index] = 1;
    queue[tail++] = index;
  };
  // 0°N 160°W: mid-Pacific.
  visit((rows - 1) / 2, Math.round(((columns - 1) * 20) / 360));
  if (!tail) throw new Error("The flood fill's starting point is not water.");
  while (head < tail) {
    const index = queue[head++];
    const column = index % columns;
    const row = (index - column) / columns;
    visit(row, column - 1);
    visit(row, column + 1);
    visit(row - 1, column);
    visit(row + 1, column);
  }
  for (let row = 0; row < rows; row++)
    sea[row * columns + columns - 1] = sea[row * columns];
  return sea;
}
const sea = connectedSea();

/** Share of a texel that is sea and the mean depth of that part, in metres; row 0 of the texture is north. */
function seaAt(x, y, width) {
  const height = width / 2;
  const row0 = (1 - (y + 1) / height) * (depths.rows - 1);
  const row1 = (1 - y / height) * (depths.rows - 1);
  const column0 = (x / width) * (depths.columns - 1);
  const column1 = ((x + 1) / width) * (depths.columns - 1);
  let wet = 0;
  let depth = 0;
  let count = 0;
  const add = (row, column) => {
    count++;
    if (!sea[row * depths.columns + column]) return;
    wet++;
    depth -= depths.at(row, column);
  };
  for (let row = Math.ceil(row0); row <= Math.floor(row1); row++)
    for (let column = Math.ceil(column0); column <= Math.floor(column1); column++)
      add(row, column);
  if (!count)
    add(Math.round((row0 + row1) / 2), Math.round((column0 + column1) / 2));
  return { coverage: wet / count, depth: wet ? depth / wet : 0 };
}

const manifest = [];
async function encode(name, data, width, linear = true, normal = false) {
  const height = width / 2;
  const input = join(work, `${name}.png`);
  // Flip at build time: KTX2 and fallback images both use flipY=false at runtime.
  const image = sharp(data, {
    raw: { width, height, channels: data.length / (width * height) },
  }).flip();
  await image.clone().png().toFile(input);
  await image
    .clone()
    .webp({ quality: normal ? 100 : 88, lossless: normal, effort: 6 })
    .toFile(join(out, `${name}.webp`));
  const target = join(out, `${name}.ktx2`);
  const args = [
    "-ktx2",
    "-file",
    input,
    "-output_file",
    target,
    "-mipmap",
    "-max_threads",
    "4",
  ];
  if (linear) args.push("-linear");
  if (normal) args.push("-uastc", "-uastc_level", "2", "-uastc_rdo_l", "2");
  else args.push("-q", "180", "-comp_level", "1");
  execFileSync(binary, args, { stdio: "pipe" });
  for (const extension of ["ktx2", "webp"]) {
    const file = `${name}.${extension}`;
    manifest.push({
      file,
      width,
      height,
      bytes: (await stat(join(out, file))).size,
    });
  }
  console.log(`Built ${name}`);
}

for (const width of [1024, 2048]) {
  const [day, height, night, cloud] = await Promise.all([
    rgb("day.jpg", width),
    rgb("height.jpg", width),
    rgb("night.jpg", width),
    rgb("clouds.jpg", width),
  ]);
  const detail = Buffer.alloc(((width * width) / 2) * 4);
  const lights = Buffer.alloc(((width * width) / 2) * 3);
  const heightAt = (x, y) =>
    height[
      (Math.max(0, Math.min(width / 2 - 1, y)) * width +
        ((x + width) % width)) *
        3
    ] / 255;
  for (let y = 0; y < width / 2; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      // NASA base map's blue water is an aligned, anti-aliased ocean mask.
      const ocean = smooth(
        (day[i + 2] - Math.max(day[i], day[i + 1]) * 1.12 - 3) / 16,
      );
      const dx = (heightAt(x - 1, y) - heightAt(x + 1, y)) * 3 * (width / 2048);
      const dy = (heightAt(x, y + 1) - heightAt(x, y - 1)) * 3 * (width / 2048);
      const length = Math.hypot(dx, dy, 1);
      const d = (y * width + x) * 4;
      detail[d] = Math.round(((dx / length) * (1 - ocean) * 0.5 + 0.5) * 255);
      detail[d + 1] = Math.round(
        ((dy / length) * (1 - ocean) * 0.5 + 0.5) * 255,
      );
      detail[d + 2] = Math.round(ocean * 255);
      // Alpha: where the sea is and how deep, from the depth grid, so the
      // shader can move the shoreline as the sea level falls.
      const { coverage, depth } = seaAt(x, y, width);
      detail[d + 3] = Math.round(
        alphaFromPacked(packWater(coverage, depth)) * 255,
      );
      const light = Math.round(
        Math.pow(clamp((night[i] / 255 - 0.035) / 0.965), 1.25) *
          (1 - ocean) *
          255,
      );
      lights[i] = lights[i + 1] = lights[i + 2] = light;
    }
  }
  await encode(`day-${width}`, day, width, false);
  await encode(`detail-${width}`, detail, width, true, true);
  await encode(`night-${width}`, lights, width);
  await encode(`clouds-${width}`, cloud, width);
}
await encode("day-4096", await rgb("day.jpg", 4096), 4096, false);

// Packed independent seamless noise fields, shared by clouds and solar shaders.
const noiseWidth = 256;
const noiseMap = Buffer.alloc(((noiseWidth * noiseWidth) / 2) * 3);
for (let y = 0; y < noiseWidth / 2; y++) {
  for (let x = 0; x < noiseWidth; x++) {
    for (let c = 0; c < 3; c++) {
      let value = 0,
        amplitude = 0.5;
      for (let octave = 0; octave < 5; octave++) {
        const cells = 8 * 2 ** octave;
        value +=
          noise(
            (x / noiseWidth) * cells,
            (y / (noiseWidth / 2)) * cells,
            cells,
            19 + c * 37,
          ) * amplitude;
        amplitude *= 0.5;
      }
      noiseMap[(y * noiseWidth + x) * 3 + c] = Math.round(value * 255);
    }
  }
}
await sharp(noiseMap, {
  raw: { width: noiseWidth, height: noiseWidth / 2, channels: 3 },
})
  .png()
  .toFile(join(out, "flow-noise.png"));
await mkdir("public/decoders/basis", { recursive: true });
for (const file of ["basis_transcoder.js", "basis_transcoder.wasm"]) {
  await copyFile(
    `node_modules/three/examples/jsm/libs/basis/${file}`,
    `public/decoders/basis/${file}`,
  );
}
await writeFile(
  join(out, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `Texture variants: ${(manifest.reduce((sum, file) => sum + file.bytes, 0) / 1e6).toFixed(2)} MB. Scratch files: ${work}`,
);
