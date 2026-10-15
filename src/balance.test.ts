import { describe, expect, it } from 'vitest';
import { BalanceGracePeriod, BALANCE_GRACE_MS } from './balance';
import { calculate, type CardConfig } from './power';
const config: CardConfig = {type:'custom:energy-flow-card',solar_entity:'solar',grid:{entity:'grid'},consumers:[{entity:'device'}]};
function reading(solar: number | string, grid: number, device = 1) {
  return calculate({states:Object.fromEntries(Object.entries({solar,grid,device}).map(([id,state])=>[id,{state:String(state),attributes:{unit_of_measurement:'W'}}]))}, config);
}

describe('balance grace period', () => {
  it('holds the home total and mix while sources and consumers continue updating', () => {
    const grace = new BalanceGracePeriod();
    const good = reading(5700,-5328);
    grace.update(good,0);
    const held = grace.update(reading(5400,-5590,20),100);
    expect(held).toMatchObject({home:372,other:352,updating:true,mismatch:false,recheckIn:BALANCE_GRACE_MS});
    expect(held.sources).toEqual(good.sources);
    expect(held.solar).toBe(5400);
    expect(held.consumers[0].power).toBe(20);
  });
  it('uses the latest valid readings immediately on recovery', () => {
    const grace = new BalanceGracePeriod();
    grace.update(reading(5700,-5328),0);
    grace.update(reading(5400,-5590),100);
    const recovered = grace.update(reading(5900,-5590),2000);
    expect(recovered).toMatchObject({home:310,other:309,updating:false,mismatch:false,recheckIn:0});
    expect(grace.update(reading(5400,-5590),2100)).toMatchObject({home:310,updating:true,recheckIn:BALANCE_GRACE_MS});
  });
  it('does not extend the window when more mismatched readings arrive', () => {
    const grace = new BalanceGracePeriod();
    grace.update(reading(5700,-5328),0);
    grace.update(reading(5400,-5590),100);
    expect(grace.update(reading(5300,-5590),2000).recheckIn).toBe(1100);
    expect(grace.update(reading(5300,-5590),3100)).toMatchObject({home:0,updating:false,mismatch:true,recheckIn:0});
    expect(grace.update(reading(5200,-5590),9000).mismatch).toBe(true);
  });
  it('does not invent a last valid reading at startup', () => {
    const grace = new BalanceGracePeriod();
    expect(grace.update(reading(5400,-5590),0)).toMatchObject({home:null,other:null,sources:[],updating:true});
    expect(grace.update(reading(5400,-5590),3000)).toMatchObject({updating:false,mismatch:true});
  });
  it('shows source outages immediately and clears held history', () => {
    const grace = new BalanceGracePeriod();
    grace.update(reading(5700,-5328),0);
    grace.update(reading(5400,-5590),100);
    expect(grace.update(reading('unavailable',-5590),200)).toMatchObject({home:null,updating:false,recheckIn:0});
    expect(grace.update(reading(5400,-5590),300)).toMatchObject({home:null,updating:true});
  });
  it('does not hide a genuine zero home reading and forgets old readings on reset', () => {
    const grace = new BalanceGracePeriod();
    grace.update(reading(5700,-5328),0);
    expect(grace.update(reading(0,0,0),100)).toMatchObject({home:0,updating:false,mismatch:false});
    grace.reset();
    expect(grace.update(reading(5400,-5590),200).home).toBeNull();
  });
});
