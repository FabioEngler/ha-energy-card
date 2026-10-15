export const DEFAULT_ANIMATION_POWER_MAX = 10_000;
export const MAX_PARTICLES = 6;
export const MIN_SPEED = 14;
export const MAX_SPEED = 48;

/** Bounded visual intensity; actual readings are never capped or smoothed. */
export function powerEnvelope(power: number | null, maxPower = DEFAULT_ANIMATION_POWER_MAX) {
  const active = power !== null && Number.isFinite(power) && Math.abs(power) > 1;
  if (!active) return { active: false, direction: 1, speed: 0, count: 0, brightness: 0 };
  const cap = Math.max(1, Number.isFinite(maxPower) && maxPower > 0 ? maxPower : DEFAULT_ANIMATION_POWER_MAX);
  const intensity = Math.log1p(Math.min(Math.abs(power), cap) / 100) / Math.log1p(cap / 100);
  return {
    active: true,
    direction: power < 0 ? -1 : 1,
    speed: MIN_SPEED + (MAX_SPEED - MIN_SPEED) * intensity,
    count: 2 + (MAX_PARTICLES - 2) * intensity,
    brightness: .4 + .55 * intensity,
  };
}

const ease = (current: number, target: number, dt: number, tau: number) => target + (current - target) * Math.exp(-dt / tau);
// Add particles between existing ones; changing density never repositions them.
const OFFSETS = [0, .5, 1 / 6, 4 / 6, 2 / 6, 5 / 6];

export class FlowMotion {
  phase: number;
  speed = 0;
  count = 0;
  brightness = 0;
  visibility = 0;
  direction = 1;
  target = powerEnvelope(0);

  constructor(readonly length: number, seed = 0) { this.phase = seed; }

  setTarget(power: number | null, maxPower?: number) {
    this.target = powerEnvelope(power, maxPower);
    // A new stream can start in either direction without a needless reversal.
    if (this.speed === 0 && this.visibility === 0 && this.target.active) this.direction = this.target.direction;
  }

  get moving() { return this.target.active || this.speed > .01 || this.visibility > .002; }

  step(seconds: number) {
    // Resuming a background tab must not fast-forward particle positions.
    const dt = Math.max(0, Math.min(seconds, .064));
    const reversing = this.target.active && this.target.direction !== this.direction;
    const running = this.target.active && !reversing;
    const previousSpeed = this.speed;
    this.speed = ease(this.speed, running ? this.target.speed : 0, dt, reversing ? .16 : running ? .45 : .25);
    this.visibility = ease(this.visibility, running ? 1 : 0, dt, reversing ? .1 : running ? .22 : .18);
    this.count = ease(this.count, this.target.active ? this.target.count : 0, dt, .4);
    this.brightness = ease(this.brightness, this.target.brightness, dt, .45);
    this.phase = ((this.phase + this.direction * (previousSpeed + this.speed) / 2 * dt / this.length) % 1 + 1) % 1;
    if (reversing && this.speed < 1 && this.visibility < .025) {
      this.direction = this.target.direction;
      this.speed = 0;
      this.visibility = 0;
    }
    if (!this.target.active && this.speed < .01 && this.visibility < .002) {
      this.speed = this.visibility = this.count = this.brightness = 0;
    }
  }

  particle(index: number) {
    const t = (this.phase + OFFSETS[index]) % 1;
    const density = Math.max(0, Math.min(1, this.count - index));
    // Fade into the junction and nodes, then emerge at the other end.
    const edge = Math.min(1, t / .12, (1 - t) / .12);
    return { t, opacity: density * this.visibility * this.brightness * Math.max(0, edge) };
  }
}
