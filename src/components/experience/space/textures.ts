"use client";

import { useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import {
  ClampToEdgeWrapping,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  type WebGLRenderer,
} from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { textureResolution, type GraphicsQuality } from "./quality";

const ROOT = "/textures/space/";
type TextureEntry = {
  promise: Promise<Texture>;
  refs: number;
  texture?: Texture;
};
export type SpaceTextures = {
  day: Texture;
  detail: Texture;
  night: Texture;
  clouds: Texture;
  noise: Texture;
};

function withDeadline(promise: Promise<Texture>) {
  return new Promise<Texture>((resolve, reject) => {
    let expired = false;
    const timer = setTimeout(() => {
      expired = true;
      reject(new Error("Texture load timed out"));
    }, 12000);
    promise.then(
      (texture) => {
        clearTimeout(timer);
        if (expired) texture.dispose();
        else resolve(texture);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// Per-renderer cache: the surface and cloud shell share maps; route transitions
// and StrictMode never retain orphan GPU resources or duplicate in-flight work.
class TextureStore {
  entries = new Map<string, TextureEntry>();
  decoder?: KTX2Loader;
  image = new TextureLoader();
  constructor(readonly gl: WebGLRenderer) {}

  acquire(name: string) {
    let entry = this.entries.get(name);
    if (!entry) {
      entry = { refs: 0, promise: this.load(name) };
      const current = entry;
      entry.promise.then(
        (texture) => {
          current.texture = texture;
          if (!current.refs) texture.dispose();
        },
        () => {},
      );
      this.entries.set(name, entry);
    }
    entry.refs++;
    let released = false;
    return {
      promise: entry.promise,
      release: () => {
        if (released) return;
        released = true;
        entry.refs--;
        if (!entry.refs) {
          this.entries.delete(name);
          entry.texture?.dispose();
        }
        if (!this.entries.size) {
          // Let a StrictMode remount acquire its resources before ending workers.
          setTimeout(() => {
            if (!this.entries.size) {
              this.decoder?.dispose();
              this.decoder = undefined;
            }
          }, 0);
        }
      },
    };
  }

  async load(name: string): Promise<Texture> {
    let texture: Texture;
    const compressed = [
      "WEBGL_compressed_texture_astc",
      "WEBGL_compressed_texture_s3tc",
      "WEBGL_compressed_texture_etc",
      "EXT_texture_compression_bptc",
    ].some((ext) => this.gl.extensions.has(ext));
    if (name === "flow-noise") {
      texture = await withDeadline(this.image.loadAsync(`${ROOT}${name}.png`));
    } else if (compressed) {
      this.decoder ??= new KTX2Loader()
        .setTranscoderPath("/decoders/basis/")
        .setWorkerLimit(2)
        .detectSupport(this.gl);
      try {
        texture = await withDeadline(
          this.decoder.loadAsync(`${ROOT}${name}.ktx2`),
        );
      } catch {
        texture = await withDeadline(
          this.image.loadAsync(`${ROOT}${name}.webp`),
        );
      }
    } else {
      texture = await withDeadline(this.image.loadAsync(`${ROOT}${name}.webp`));
    }
    texture.name = name;
    texture.flipY = false;
    texture.colorSpace = name.startsWith("day-")
      ? SRGBColorSpace
      : NoColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT =
      name === "flow-noise" ? RepeatWrapping : ClampToEdgeWrapping;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.anisotropy = Math.min(4, this.gl.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
    return texture;
  }
}

const stores = new WeakMap<WebGLRenderer, TextureStore>();
function storeFor(gl: WebGLRenderer) {
  let store = stores.get(gl);
  if (!store) {
    store = new TextureStore(gl);
    stores.set(gl, store);
  }
  return store;
}

type Bundle = { textures: SpaceTextures; release: () => void };

export function useSpaceTextures(
  quality: GraphicsQuality,
  closeUp: boolean,
  onFailure?: () => void,
) {
  const gl = useThree((state) => state.gl);
  const store = useMemo(() => storeFor(gl), [gl]);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [error, setError] = useState(false);
  const { day, detail } = textureResolution(
    quality,
    closeUp,
    gl.capabilities.maxTextureSize,
  );

  useEffect(() => {
    let cancelled = false;
    const assets = {
      day: store.acquire(`day-${day}`),
      detail: store.acquire(`detail-${detail}`),
      night: store.acquire(`night-${detail}`),
      clouds: store.acquire(`clouds-${detail}`),
      noise: store.acquire("flow-noise"),
    };
    const release = () =>
      Object.values(assets).forEach((asset) => asset.release());
    Promise.allSettled(
      Object.values(assets).map((asset) => asset.promise),
    ).then((results) => {
      if (cancelled || results.some((result) => result.status === "rejected")) {
        release();
        if (!cancelled) setError(true);
        return;
      }
      const [day, detail, night, clouds, noise] = results.map(
        (result) => (result as PromiseFulfilledResult<Texture>).value,
      );
      setBundle({ textures: { day, detail, night, clouds, noise }, release });
    });
    return () => {
      cancelled = true;
    };
  }, [day, detail, store]);

  // Old maps remain valid until the new bundle is committed to the materials.
  useEffect(() => () => bundle?.release(), [bundle]);
  useEffect(() => {
    if (error && !bundle) onFailure?.();
  }, [error, bundle, onFailure]);
  useEffect(() => {
    if (bundle)
      gl.domElement.setAttribute("data-texture-tier", bundle.textures.day.name);
  }, [bundle, gl]);
  return bundle?.textures ?? null;
}
