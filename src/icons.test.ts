import { describe, expect, it } from 'vitest';
import { nodeIconPath } from './icons';
import { batteryAppearance } from './presentation';

describe('embedded diagram icons',()=>{
  it('provides distinct native paths for solar, grid, and home',()=>{
    const paths=['mdi:solar-power-variant','mdi:transmission-tower','mdi:home-lightning-bolt-outline'].map(nodeIconPath);
    expect(new Set(paths).size).toBe(3);
    for(const path of paths) expect(path).toMatch(/^M/);
  });
  it('covers every battery charge level in each operating state',()=>{
    for(const soc of [null,0,10,20,30,40,50,60,70,80,90,100]) {
      for(const net of [null,0,-100,100]) {
        const appearance=batteryAppearance(soc,net);
        expect(nodeIconPath(appearance.icon)).not.toBe(nodeIconPath('missing-icon'));
      }
    }
  });
});
