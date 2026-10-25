import { describe, expect, it } from 'vitest';
import { batteryAppearance, batterySocBand, formatShare, stateOfCharge } from './presentation';

describe('battery presentation', () => {
  it.each([
    [62, -250, 'charging', 'mdi:battery-charging-60'],
    [100, -250, 'charging', 'mdi:battery-charging-100'],
    [0, -250, 'charging', 'mdi:battery-charging-outline'],
    [62, 250, 'discharging', 'mdi:battery-60'],
    [100, 0, 'idle', 'mdi:battery'],
    [0, 0, 'idle', 'mdi:battery-outline'],
    [null, 250, 'discharging', 'mdi:battery-unknown'],
    [50, null, 'unavailable', 'mdi:battery-50'],
    [50, 1, 'idle', 'mdi:battery-50'],
    [50, -1, 'idle', 'mdi:battery-50'],
  ] as const)('represents SOC %s and net power %s', (soc, net, status, icon) => {
    expect(batteryAppearance(soc, net)).toMatchObject({ status, icon });
  });
  it.each(['unknown', 'unavailable', '', '-1', '101'])('rejects invalid SOC %s', state => {
    expect(stateOfCharge({ states: { soc: { state, attributes: {} } } }, 'soc')).toBeNull();
  });
  it('accepts valid zero and fractional SOC without turning missing SOC into zero', () => {
    expect(stateOfCharge({ states: { soc: { state: '0', attributes: {} } } }, 'soc')).toBe(0);
    expect(stateOfCharge({ states: { soc: { state: '62.5', attributes: {} } } }, 'soc')).toBe(62.5);
    expect(stateOfCharge({ states: {} }, 'soc')).toBeNull();
  });
});

describe('consumer percentage labels', () => {
  it.each([
    [1, 372, '<1%'], [0, 372, '0%'], [100, 400, '25%'],
    [null, 400, '—'], [100, null, '—'], [0, 0, '—'],
  ] as const)('formats %s of %s watts', (power, home, expected) => {
    expect(formatShare(power, home)).toBe(expected);
  });
});

describe('battery charge color thresholds',()=>{
  it.each([[0,'low'],[19.99,'low'],[20,'medium'],[79.99,'medium'],[80,'high'],[100,'high'],[null,undefined],[NaN,undefined],[-1,undefined],[101,undefined]] as const)('classifies %s', (soc,band)=>{
    expect(batterySocBand(soc)).toBe(band);
  });
  it('supports custom thresholds and keeps zero red',()=>{
    expect(batterySocBand(24,25,85)).toBe('low');
    expect(batterySocBand(25,25,85)).toBe('medium');
    expect(batterySocBand(84,25,85)).toBe('medium');
    expect(batterySocBand(85,25,85)).toBe('high');
    expect(batterySocBand(0,0,80)).toBe('low');
  });
});
