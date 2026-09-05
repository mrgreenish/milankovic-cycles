// Reproducible offline asset build. See public/textures/space/README.md for sources.
// Run: npm run textures:build -- /path/to/downloaded/sources
import sharp from "sharp";
import { mkdir, copyFile, stat, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp } from "node:fs/promises";

const source = process.argv[2];
if (!source)
  throw new Error(
    "Supply a directory containing day.jpg, night.jpg, height.jpg and clouds.jpg.",
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

const manifest = [];
async function encode(name, data, width, linear = true, normal = false) {
  const height = width / 2;
  const input = join(work, `${name}.png`);
  // Flip at build time: KTX2 and fallback images both use flipY=false at runtime.
  const image = sharp(data, { raw: { width, height, channels: 3 } }).flip();
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
  const detail = Buffer.alloc(((width * width) / 2) * 3);
  const lights = Buffer.alloc(detail.length);
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
      detail[i] = Math.round(((dx / length) * (1 - ocean) * 0.5 + 0.5) * 255);
      detail[i + 1] = Math.round(
        ((dy / length) * (1 - ocean) * 0.5 + 0.5) * 255,
      );
      detail[i + 2] = Math.round(ocean * 255);
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
