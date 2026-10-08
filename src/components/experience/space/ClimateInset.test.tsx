import { render, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFrame, type RootState } from "@react-three/fiber";
import { Group, Object3D, PerspectiveCamera, Scene, Vector3 } from "three";
import { ClimateInset } from "./ClimateInset";
import { useSceneFrame, type SceneFrame } from "./SceneState";

vi.mock("@react-three/fiber", () => ({ useFrame: vi.fn() }));
vi.mock("./SceneState", () => ({ useSceneFrame: vi.fn() }));

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

function setup(rect: { size: number; right: number; top: number } | null) {
  const frame = {
    earth: new Vector3(4, 0, -2),
    axis: new Vector3(0.2, 1, 0).normalize(),
    radius: 0.72,
  };
  vi.mocked(useSceneFrame).mockReturnValue(frame as SceneFrame);
  render(<ClimateInset rect={rect} />);
  const draw = vi.mocked(useFrame).mock.calls.at(-1)![0];
  const scene = new Scene();
  const parent = new Group();
  const earth = new Object3D();
  scene.add(parent);
  parent.add(earth);
  earth.position.copy(frame.earth);
  const update = vi.spyOn(scene, "updateMatrixWorld");
  const main = new PerspectiveCamera();
  const passes: { world: number[]; view: number[]; inset: boolean }[] = [];
  const gl = {
    autoClear: true,
    setScissorTest: vi.fn(),
    setScissor: vi.fn(),
    setViewport: vi.fn(),
    clearDepth: vi.fn(),
    render: vi.fn((world: Scene, camera: PerspectiveCamera) => {
      // Three r185 updates the scene and an unparented camera independently.
      if (world.matrixWorldAutoUpdate) world.updateMatrixWorld();
      if (camera.parent === null && camera.matrixWorldAutoUpdate)
        camera.updateMatrixWorld();
      passes.push({
        world: earth.matrixWorld.toArray(),
        view: camera.matrixWorldInverse.toArray(),
        inset: !!camera.userData.inset,
      });
    }),
  };
  const state = { gl, scene, camera: main, size: { width: 1200, height: 800 } };
  return {
    frame, scene, parent, gl, passes, update,
    draw: () => draw(state as unknown as RootState, 1 / 60),
  };
}

describe("climate inset render passes", () => {
  const rect = { size: 160, right: 24, top: 40 };

  it("reuses world matrices within a frame and refreshes both views on the next frame", () => {
    const { draw, frame, scene, parent, passes, update, gl } = setup(rect);
    draw();
    expect(update).toHaveBeenCalledTimes(1);
    expect(passes.map((pass) => pass.inset)).toEqual([false, true]);
    expect(passes[1].world).toEqual(passes[0].world);

    parent.rotation.y = 0.8;
    frame.earth.set(-2, 1, 3);
    frame.axis.set(0.3, 1, -0.2).normalize();
    draw();
    expect(update).toHaveBeenCalledTimes(2);
    expect(passes[2].world).not.toEqual(passes[0].world);
    expect(passes[3].world).toEqual(passes[2].world);
    expect(passes[3].view).not.toEqual(passes[1].view);
    expect(scene.matrixWorldAutoUpdate).toBe(true);
    expect(gl.autoClear).toBe(true);
    expect(gl.setScissor).toHaveBeenLastCalledWith(1016, 600, 160, 160);
    expect(gl.setScissorTest).toHaveBeenLastCalledWith(false);
    expect(gl.setViewport).toHaveBeenLastCalledWith(0, 0, 1200, 800);
  });

  it.each([null, { size: 23, right: 0, top: 0 }])(
    "only renders the main view when the inset is absent or too small (%s)",
    (rect) => {
      const { draw, gl, update } = setup(rect);
      draw();
      expect(gl.render).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledTimes(1);
      expect(gl.clearDepth).not.toHaveBeenCalled();
    },
  );

  it.each([true, false])("restores the existing renderer flags after an inset error (%s)", (auto) => {
    const { draw, gl, scene } = setup(rect);
    gl.autoClear = auto;
    scene.matrixWorldAutoUpdate = auto;
    gl.render.mockImplementation((_world, camera) => {
      if (camera.userData.inset) throw new Error("inset render failed");
    });
    expect(draw).toThrow("inset render failed");
    expect(gl.autoClear).toBe(auto);
    expect(scene.matrixWorldAutoUpdate).toBe(auto);
    expect(gl.setScissorTest).toHaveBeenLastCalledWith(false);
    expect(gl.setViewport).toHaveBeenLastCalledWith(0, 0, 1200, 800);
  });
});
