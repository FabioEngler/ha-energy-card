export const DEFAULT_COLORS = {
  solar:'#f6bd4f', grid:'#a99af7', battery:'#53d4bd', home:'#68b7ff',
  battery_low:'#ef5350', battery_medium:'#ffb300', battery_high:'#43a047',
  consumers:'#68b7ff', charging:'#4ade80', discharging:'#fb7185',
} as const;
export type ColorKey = keyof typeof DEFAULT_COLORS;
export const isHexColor = (value:unknown): value is string => typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
export function pickerColor(value:string) {return value.length===4 ? '#'+[...value.slice(1)].map(c=>c+c).join('') : value;}
