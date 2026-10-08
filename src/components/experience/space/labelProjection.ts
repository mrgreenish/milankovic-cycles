import { Vector3, type Camera, type Object3D } from "three";

/** Freeze hidden labels without mutating the previous position retained by Drei. */
export function createLabelProjection() {
  const point = new Vector3();
  let previous: [number, number] = [0, 0];

  return (
    object: Object3D,
    camera: Camera,
    size: { width: number; height: number },
    visible: boolean,
  ): [number, number] => {
    if (!visible) return previous;

    point.setFromMatrixPosition(object.matrixWorld).project(camera);
    // Html retains each returned tuple for its next position comparison.
    // Reuse only the scratch Vector3, never a tuple's coordinate storage.
    const next: [number, number] = [
      ((point.x + 1) * size.width) / 2,
      ((1 - point.y) * size.height) / 2,
    ];
    previous = next;
    return next;
  };
}
