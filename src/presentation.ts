import type { Hass } from './power';

export function stateOfCharge(hass: Hass, entity?: string): number | null {
  const value = entity ? hass.states[entity]?.state : undefined;
  if (!value?.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

export function batteryAppearance(soc: number | null, net: number | null) {
  const status = net === null ? 'unavailable' : net < -1 ? 'charging' : net > 1 ? 'discharging' : 'idle';
  const level = soc === null ? null : Math.round(soc / 10) * 10;
  const icon = status === 'charging'
    ? level === null || level === 0 ? 'mdi:battery-charging-outline' : `mdi:battery-charging-${level}`
    : level === null ? 'mdi:battery-unknown' : level === 100 ? 'mdi:battery' : level === 0 ? 'mdi:battery-outline' : `mdi:battery-${level}`;
  const label = { unavailable: 'Unavailable', charging: 'Charging', discharging: 'Discharging', idle: 'Idle' }[status];
  return { status, icon, label };
}

export function formatShare(power: number | null, home: number | null) {
  if (power === null || home === null || home <= 0) return '—';
  const share = Math.max(0, power) / home * 100;
  return share > 0 && share < 1 ? '<1%' : `${Math.round(share)}%`;
}
