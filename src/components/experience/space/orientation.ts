import { Quaternion, Vector3 } from "three";

const UP = new Vector3(0, 1, 0);
const twist = new Quaternion();

/**
 * Earth's orientation in the orbit's own frame: "up" turned the short way onto
 * the axis. The timeline also turns the whole scene by `yaw` to hold Earth in
 * place while the orbit swings, and that turn would carry the continents round
 * with it, one full roll about the axis per precession cycle. Undoing the yaw
 * about the axis first leaves the globe's orientation on screen set by the axis
 * alone. With no yaw this is the plain shortest turn.
 */
export function bodyOrientation(axis: Vector3, yaw: number, out: Quaternion) {
  out.setFromUnitVectors(UP, axis);
  return out.multiply(twist.setFromAxisAngle(UP, -yaw));
}
