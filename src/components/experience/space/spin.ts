/**
 * Earth turns faster the faster time runs, up to a speed the eye can follow.
 * Slow scrubbing gives a gentle turn; a long sweep tops out at 270° a second.
 */
const RAD_PER_KYR = (3 * Math.PI) / 180;
export const SPIN_MAX_RAD_PER_S = (270 * Math.PI) / 180;
/** Below this clock speed (thousand years a second) the globe starts settling back. */
const CALM_BELOW_KYR_PER_S = 4;
/** How quickly a resting globe finds its way back to the home orientation, per second. */
const RETURN_RATE = 2.2;

const TWO_PI = Math.PI * 2;
const wrap = (angle: number) => angle - TWO_PI * Math.round(angle / TWO_PI);

/**
 * Moves the extra turn of Earth on by one frame. While time runs the globe
 * turns in step with it, west to east as the planet does when time runs
 * forward and the other way when it runs back. When time slows or stops it
 * eases back to its home orientation by the short way, so the ice sheets end
 * up facing the viewer.
 */
export function stepSpin(spin: number, kyrPerSecond: number, seconds: number) {
  const rate =
    SPIN_MAX_RAD_PER_S *
    Math.tanh((kyrPerSecond * RAD_PER_KYR) / SPIN_MAX_RAD_PER_S);
  const calm = 1 - Math.min(1, Math.abs(kyrPerSecond) / CALM_BELOW_KYR_PER_S);
  const turned = wrap(spin + rate * seconds);
  return turned - turned * (1 - Math.exp(-RETURN_RATE * seconds)) * calm;
}
