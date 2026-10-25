import { FlowMotion, MAX_PARTICLES } from './motion';

export const FLOW_GEOMETRY = {
  'solar-flow': { x1:260,y1:172,x2:260,y2:250,hubAtEnd:true },
  'grid-flow': { x1:152,y1:250,x2:260,y2:250,hubAtEnd:true },
  'battery-flow': { x1:260,y1:328,x2:260,y2:250,hubAtEnd:true },
  'home-flow': { x1:260,y1:250,x2:349,y2:250,hubAtEnd:false },
} as const;
export type FlowId = keyof typeof FLOW_GEOMETRY;
interface Stream { motion: FlowMotion; particles: SVGGElement[] }

/** One frame loop per visible card. Lit renders sensor values, never animation frames. */
export class FlowAnimator {
  private streams = new Map<FlowId, Stream>();
  private root?: SVGSVGElement;
  private glow?: SVGCircleElement;
  private core?: SVGCircleElement;
  private frame?: number;
  private lastTime?: number;
  private connected = false;
  private visible = true;
  private media?: MediaQueryList;
  private observer?: IntersectionObserver;
  private mode?: boolean;
  private junction = 0;

  connect() {
    if (this.connected) return;
    this.connected = true;
    this.media = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.media.addEventListener('change', this.runStateChanged);
    document.addEventListener('visibilitychange', this.pageVisibilityChanged);
    window.addEventListener('pageshow', this.pageVisibilityChanged);
    window.addEventListener('resize', this.pageVisibilityChanged);
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.target === this.root)) return;
        // WebKit can deliver an initial intersection from before SVG layout.
        // Check its current geometry instead of suspending on that stale result.
        this.visible = this.rootIntersectsViewport();
        this.runStateChanged();
      });
    }
  }

  disconnect() {
    this.connected = false;
    this.cancelFrame();
    this.media?.removeEventListener('change', this.runStateChanged);
    document.removeEventListener('visibilitychange', this.pageVisibilityChanged);
    window.removeEventListener('pageshow', this.pageVisibilityChanged);
    window.removeEventListener('resize', this.pageVisibilityChanged);
    this.observer?.disconnect();
    this.observer = undefined;
    this.streams.clear();
    this.root = undefined;
    this.glow = this.core = undefined;
    this.visible = true;
    this.junction = 0;
  }

  sync(root: SVGSVGElement | null, powers: Record<FlowId, number | null>, maxPower: number | undefined, mode: boolean | undefined) {
    const previousRoot = this.root;
    this.root = root ?? undefined;
    if (previousRoot !== this.root) {
      if (previousRoot) this.observer?.unobserve(previousRoot);
      this.visible = this.rootIntersectsViewport();
      if (this.root) this.observer?.observe(this.root);
    }
    this.mode = mode;
    this.glow = root?.querySelector<SVGCircleElement>('.junction-glow') ?? undefined;
    this.core = root?.querySelector<SVGCircleElement>('.junction') ?? undefined;
    for (const [index, id] of (Object.keys(FLOW_GEOMETRY) as FlowId[]).entries()) {
      const group = root?.querySelector(`[data-flow="${id}"]`);
      if (!group) { this.streams.delete(id); continue; }
      let stream = this.streams.get(id);
      if (!stream) {
        const g = FLOW_GEOMETRY[id];
        stream = { motion: new FlowMotion(Math.hypot(g.x2 - g.x1, g.y2 - g.y1), index * .137), particles: [] };
        this.streams.set(id, stream);
      }
      stream.particles = Array.from(group.querySelectorAll<SVGGElement>('.flow-particle'));
      stream.motion.setTarget(powers[id], maxPower);
    }
    this.runStateChanged();
  }

  private get motionAllowed() { return this.mode === true || (this.mode !== false && !this.media?.matches); }
  private rootIntersectsViewport() {
    const rect = this.root?.getBoundingClientRect();
    return Boolean(rect && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth);
  }
  private pageVisibilityChanged = () => {
    if (!document.hidden) this.visible = this.rootIntersectsViewport();
    this.runStateChanged();
  };
  private cancelFrame() {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = this.lastTime = undefined;
  }
  private runStateChanged = () => {
    this.root?.toggleAttribute('data-motion', this.motionAllowed);
    const hasMotion = [...this.streams.values()].some(s => s.motion.moving);
    if (!hasMotion) {
      this.junction = 0;
      this.glow?.setAttribute('opacity', '0');
      this.core?.setAttribute('opacity', '.5');
    }
    const active = this.connected && this.visible && !document.hidden && this.motionAllowed && this.root && hasMotion;
    if (!active) {
      this.cancelFrame();
      if (!this.motionAllowed) this.glow?.setAttribute('opacity', '0');
      return;
    }
    if (this.frame === undefined) this.frame = requestAnimationFrame(this.tick);
  };

  private tick = (time: number) => {
    this.frame = undefined;
    const dt = this.lastTime === undefined ? 1 / 60 : Math.min(.064, (time - this.lastTime) / 1000);
    this.lastTime = time;
    let presence = 0;
    let arrival = 0;
    for (const [id, stream] of this.streams) {
      const g = FLOW_GEOMETRY[id];
      const motion = stream.motion;
      if (!motion.moving) continue;
      motion.step(dt);
      presence = Math.max(presence, motion.visibility * motion.brightness);
      const angle = Math.atan2(g.y2 - g.y1, g.x2 - g.x1) * 180 / Math.PI + (motion.direction < 0 ? 180 : 0);
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const particle = motion.particle(i);
        const element = stream.particles[i];
        if (!element) continue;
        element.setAttribute('transform', `translate(${g.x1 + (g.x2 - g.x1) * particle.t},${g.y1 + (g.y2 - g.y1) * particle.t}) rotate(${angle})`);
        element.setAttribute('opacity', particle.opacity.toFixed(3));
        const distanceToHub = g.hubAtEnd ? 1 - particle.t : particle.t;
        arrival = Math.max(arrival, Math.max(0, 1 - distanceToHub / .2) * particle.opacity);
      }
    }
    this.junction += (arrival - this.junction) * (1 - Math.exp(-dt / .2));
    this.glow?.setAttribute('r', String(13 + presence * 3 + this.junction * 2));
    this.glow?.setAttribute('opacity', String(presence * .38 + this.junction * .24));
    this.core?.setAttribute('opacity', String(.5 + presence * .2 + this.junction * .3));
    this.runStateChanged();
  };
}
