import { describe, expect, it } from 'vitest';
import { DEFAULT_ANIMATION_POWER_MAX, FlowMotion, MAX_PARTICLES, MAX_SPEED, powerEnvelope } from './motion';
function advance(motion: FlowMotion, seconds: number, fps = 60) {
  for (let i = 0; i < seconds * fps; i++) motion.step(1 / fps);
}

describe('bounded power visuals', () => {
  it('increases speed, density, and brightness without exceeding their caps', () => {
    const low = powerEnvelope(100);
    const mid = powerEnvelope(2000);
    const full = powerEnvelope(DEFAULT_ANIMATION_POWER_MAX);
    const extreme = powerEnvelope(1e12);
    for (const key of ['speed','count','brightness'] as const) {
      expect(mid[key]).toBeGreaterThan(low[key]);
      expect(full[key]).toBeGreaterThan(mid[key]);
      expect(extreme[key]).toBe(full[key]);
    }
    expect(full.count).toBe(MAX_PARTICLES);
    expect(full.speed).toBe(MAX_SPEED);
    expect(full.brightness).toBeCloseTo(.95);
  });
  it('uses a configurable power ceiling and keeps the direction independent of intensity', () => {
    expect(powerEnvelope(5000,5000)).toMatchObject({speed:MAX_SPEED,count:MAX_PARTICLES});
    expect(powerEnvelope(5000,20000).speed).toBeLessThan(MAX_SPEED);
    expect(powerEnvelope(-5000,5000)).toMatchObject({speed:MAX_SPEED,count:MAX_PARTICLES,direction:-1});
    expect(powerEnvelope(5000,NaN)).toEqual(powerEnvelope(5000));
    expect(powerEnvelope(5000,Number.MIN_VALUE)).toMatchObject({speed:MAX_SPEED,count:MAX_PARTICLES});
  });
  it.each([null,0,1,-1,NaN,Infinity])('keeps %s inactive', value => {
    expect(powerEnvelope(value)).toMatchObject({active:false,speed:0,count:0,brightness:0});
  });
});

describe('continuous particle motion', () => {
  it('eases toward a new speed without resetting phase, positions, or visibility', () => {
    const motion = new FlowMotion(117,.2);
    motion.setTarget(100);advance(motion,3);
    const {phase,speed,visibility}=motion;
    const positions=Array.from({length:MAX_PARTICLES},(_,i)=>motion.particle(i).t);
    motion.setTarget(10000);
    expect(motion.phase).toBe(phase);
    expect(Array.from({length:MAX_PARTICLES},(_,i)=>motion.particle(i).t)).toEqual(positions);
    motion.step(1 / 60);
    expect(motion.speed).toBeGreaterThan(speed);
    expect(motion.speed).toBeLessThan(speed+2);
    expect(motion.visibility).toBeGreaterThanOrEqual(visibility);
    advance(motion,1.5);
    expect(motion.speed).toBeGreaterThan(MAX_SPEED*.95);
    expect(motion.speed).toBeLessThanOrEqual(MAX_SPEED);
  });
  it('fades and slows to an idle state instead of stopping abruptly', () => {
    const motion=new FlowMotion(77,.2);
    motion.setTarget(10000);advance(motion,3);
    const before=motion.speed;
    motion.setTarget(0);motion.step(1/60);
    expect(motion.speed).toBeGreaterThan(0);
    expect(motion.speed).toBeLessThan(before);
    expect(motion.visibility).toBeGreaterThan(.8);
    expect(motion.visibility).toBeLessThan(1);
    advance(motion,3);
    expect(motion.moving).toBe(false);
    expect(motion.visibility).toBe(0);
    expect(motion.speed).toBe(0);
  });
  it('brakes and fades before reversing, then accelerates in the new direction', () => {
    const motion=new FlowMotion(117,.2);
    motion.setTarget(5000);advance(motion,3);
    motion.setTarget(-5000);advance(motion,.15);
    expect(motion.direction).toBe(1);
    expect(motion.speed).toBeLessThan(20);
    for(let i=0;i<120 && motion.direction===1;i++) motion.step(1/60);
    expect(motion.direction).toBe(-1);
    expect(motion.visibility).toBe(0);
    expect(motion.speed).toBe(0);
    advance(motion,1.5);
    expect(motion.speed).toBeGreaterThan(35);
    expect(motion.visibility).toBeGreaterThan(.95);
    const phase=motion.phase;motion.step(1/60);
    const delta=(motion.phase-phase+1)%1;
    expect(delta).toBeGreaterThan(.98); // Negative movement modulo one.
  });
  it('repeated sensor targets do not restart progress or acceleration', () => {
    const normal=new FlowMotion(101,.3), frequent=new FlowMotion(101,.3);
    normal.setTarget(2000);
    for(let i=0;i<180;i++) {
      frequent.setTarget(2000);
      normal.step(1/60);frequent.step(1/60);
    }
    expect(frequent.phase).toBeCloseTo(normal.phase,10);
    expect(frequent.speed).toBeCloseTo(normal.speed,10);
  });
  it('keeps motion consistent at different frame rates and avoids jumps after a pause', () => {
    const a=new FlowMotion(117,.2),b=new FlowMotion(117,.2);
    a.setTarget(5000);b.setTarget(5000);advance(a,2,60);advance(b,2,120);
    expect(a.speed).toBeCloseTo(b.speed,8);
    expect(a.phase).toBeCloseTo(b.phase,3);
    const phase=a.phase;a.step(120);
    expect((a.phase-phase+1)%1).toBeLessThan(.03);
  });
  it('fades particles at both endpoints and bounds every particle opacity', () => {
    const motion=new FlowMotion(77);
    motion.setTarget(10000);advance(motion,5);
    motion.phase=0;expect(motion.particle(0).opacity).toBe(0);
    motion.phase=.5;expect(motion.particle(0).opacity).toBeGreaterThan(.9);
    motion.phase=.99;expect(motion.particle(0).opacity).toBeLessThan(.1);
    for(let i=0;i<MAX_PARTICLES;i++) {
      expect(motion.particle(i).opacity).toBeGreaterThanOrEqual(0);
      expect(motion.particle(i).opacity).toBeLessThanOrEqual(.95);
    }
  });
});
