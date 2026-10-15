import { describe, it, expect } from 'vitest';
import { calculate, flow, watts, type Hass, type CardConfig } from './power';
function hass(values: Record<string, number | string | [number,string]>): Hass {
  return {states:Object.fromEntries(Object.entries(values).map(([key,value]) => [key,{state:String(Array.isArray(value) ? value[0] : value),attributes:{unit_of_measurement:Array.isArray(value) ? value[1] : 'W'}}]))};
}
const config: CardConfig = {type:'custom:energy-flow-card',solar_entity:'solar',grid:{import_entity:'import',export_entity:'export'},battery:{import_entity:'discharge',export_entity:'charge'},consumers:[{entity:'oven'},{entity:'car'}]};
describe('live power balance', () => {
  it('subtracts export and battery charging from home consumption', () => {
    const result = calculate(hass({solar:5000,import:0,export:1000,discharge:0,charge:1500,oven:500,car:1000}),config);
    expect(result.home).toBe(2500);
    expect(result.other).toBe(1000);
    expect(result.sources.map(s=>s.power)).toEqual([2500,0,0]);
  });
  it('handles signed grid and battery sensors and inversion', () => {
    const h = hass({grid:-300,battery:200});
    expect(flow(h,{entity:'grid'})).toEqual({incoming:0,outgoing:300});
    expect(flow(h,{entity:'battery',invert:true})).toEqual({incoming:0,outgoing:200});
  });
  it('converts kW and rejects energy or unavailable sensors', () => {
    const h = hass({solar:[2.5,'kW'],bad:[3,'kWh'],offline:'unavailable',blank:''});
    expect(watts(h,'solar')).toBe(2500);
    for(const entity of ['bad','offline','blank','missing']) expect(watts(h,entity)).toBeNull();
  });
  it('does not show a false home total when a required sensor is unknown', () => {
    const result = calculate(hass({solar:'unavailable'}),{type:config.type,solar_entity:'solar'});
    expect(result.home).toBeNull();
    expect(result.other).toBeNull();
    expect(result.sources).toEqual([]);
  });
  it('allocates the home source mix proportionally and sums to the home total', () => {
    const result = calculate(hass({solar:2000,import:1000,export:0,discharge:1000,charge:0,oven:100,car:200}),config);
    expect(result.home).toBe(4000);
    expect(result.sources.map(s=>s.power)).toEqual([2000,1000,1000]);
  });
  it('flags consumer overlap instead of showing negative other consumption', () => {
    const result = calculate(hass({solar:100,import:0,export:0,discharge:0,charge:0,oven:200,car:300}),config);
    expect(result.other).toBe(0);
    expect(result.mismatch).toBe(true);
  });
  it('keeps consumer order unless sorting is enabled', () => {
    const h = hass({solar:1000,import:0,export:0,discharge:0,charge:0,oven:100,car:500});
    expect(calculate(h,config).consumers[0].entity).toBe('oven');
    expect(calculate(h,{...config,sort_by_power:true}).consumers[0].entity).toBe('car');
  });
  it.each(['unavailable','unknown','missing'])('treats a %s consumer as zero and keeps other consumption calculated', state => {
    const h = hass({solar:1000,car:200,...(state === 'missing' ? {} : {oven:state})});
    const result = calculate(h,{type:config.type,solar_entity:'solar',consumers:config.consumers,sort_by_power:true});
    expect(result.consumers.find(c => c.entity === 'oven')?.power).toBe(0);
    expect(result.consumers[0].entity).toBe('car');
    expect(result.home).toBe(1000);
    expect(result.other).toBe(800);
    expect(result.mismatch).toBe(false);
  });
  it('supports absent sources and flags a negative power balance', () => {
    const result = calculate(hass({grid:-500}),{type:config.type,grid:{entity:'grid'}});
    expect(result.home).toBe(0);
    expect(result.mismatch).toBe(true);
  });
});
