/**
 * Moves a value toward a target along a critically damped spring: it speeds up
 * gently, never passes the target, and slows to a stop, with the speed capped
 * at `maxSpeed`. Unlike a plain exponential chase it has no sudden start.
 * Returns the new value and the new velocity.
 */
export function smoothDamp(
  current: number,
  target: number,
  velocity: number,
  smoothTime: number,
  maxSpeed: number,
  dt: number,
): [number, number] {
  if (dt <= 0) return [current, velocity];
  const time = Math.max(0.0001, smoothTime);
  const omega = 2 / time;
  const x = omega * dt;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const limit = maxSpeed * time;
  const change = Math.max(-limit, Math.min(limit, current - target));
  const reached = current - change;
  const carry = (velocity + omega * change) * dt;
  let nextVelocity = (velocity - omega * carry) * decay;
  let next = reached + (change + carry) * decay;
  // Never end up on the far side of the real target.
  if (target - current > 0 === next > target) {
    next = target;
    nextVelocity = (next - target) / dt;
  }
  return [next, nextVelocity];
}
