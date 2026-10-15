export interface EntityState { state: string; attributes: { unit_of_measurement?: string; [key: string]: unknown } }
export interface Hass { states: Record<string, EntityState>; [key: string]: unknown }
export interface FlowConfig { entity?: string; import_entity?: string; export_entity?: string; invert?: boolean }
export interface Consumer { entity: string; name?: string; icon?: string }
export interface CardConfig {
  type: string; title?: string; solar_entity?: string; grid?: FlowConfig; battery?: FlowConfig;
  battery_soc_entity?: string; consumers?: Consumer[]; sort_by_power?: boolean; animation?: boolean;
  animation_power_max?: number;
}
// All calculations use watts. Source readings must remain unknown when invalid.
export function watts(hass: Hass, entity?: string): number | null {
  if (!entity) return 0;
  const s = hass.states[entity];
  if (!s || !s.state.trim() || !Number.isFinite(Number(s.state))) return null;
  const unit = s.attributes.unit_of_measurement;
  if (unit !== 'W' && unit !== 'kW') return null;
  return Number(s.state) * (unit === 'kW' ? 1000 : 1);
}
export function flow(hass: Hass, config?: FlowConfig) {
  if (config?.entity) {
    const raw = watts(hass, config.entity);
    if (raw === null) return null;
    const n = raw * (config.invert ? -1 : 1);
    return { incoming: Math.max(0, n), outgoing: Math.max(0, -n) };
  }
  const incoming = watts(hass, config?.import_entity);
  const outgoing = watts(hass, config?.export_entity);
  if (incoming === null || outgoing === null) return null;
  return { incoming: Math.max(0, incoming), outgoing: Math.max(0, outgoing) };
}
export function calculate(hass: Hass, config: CardConfig) {
  const solarValue = watts(hass, config.solar_entity);
  const solar = solarValue === null ? null : Math.max(0, solarValue);
  const grid = flow(hass, config.grid);
  // Battery incoming means discharge into the home; outgoing means charging.
  const battery = flow(hass, config.battery);
  const balance = solar === null || !grid || !battery ? null : solar + grid.incoming + battery.incoming - grid.outgoing - battery.outgoing;
  const home = balance === null ? null : Math.max(0, balance);
  // Consumers can go offline (for example when a smart plug is switched off).
  // Treat their missing readings as zero without invalidating the home remainder.
  let consumers = (config.consumers ?? []).map(c => {
    const power = watts(hass, c.entity);
    return { ...c, power: power ?? 0, unavailable: power === null };
  });
  if (config.sort_by_power) consumers = [...consumers].sort((a, b) => b.power - a.power);
  const measured = consumers.reduce((sum, c) => sum + Math.max(0, c.power), 0);
  const other = home === null ? null : Math.max(0, home - measured);
  const mismatch = balance !== null && (balance < -1 || measured > balance + 1);
  const supply = (solar ?? 0) + (grid?.incoming ?? 0) + (battery?.incoming ?? 0);
  // Proportional allocation: the same source mix feeds home, charging, and export.
  const sources = home === null ? [] : [
    { name: 'Solar', color: 'var(--ef-solar)', power: supply ? home * (solar ?? 0) / supply : 0 },
    { name: 'Grid', color: 'var(--ef-grid)', power: supply ? home * (grid?.incoming ?? 0) / supply : 0 },
    { name: 'Battery', color: 'var(--ef-battery)', power: supply ? home * (battery?.incoming ?? 0) / supply : 0 }
  ];
  return { solar, grid, battery, home, consumers, other, mismatch, sources };
}
export function formatPower(n: number | null): string {
  return n === null ? 'Unavailable' : Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(2)} kW` : `${Math.round(n)} W`;
}
