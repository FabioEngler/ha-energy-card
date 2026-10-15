import { LitElement, html, css, svg, nothing } from 'lit';
import { calculate, formatPower, type CardConfig, type Hass } from './power';
import './editor';

class EnergyFlowCard extends LitElement {
  static properties = { hass: { attribute: false }, config: { state: true } };
  declare hass: Hass;
  declare config: CardConfig;
  static getConfigElement() { return document.createElement('energy-flow-card-editor'); }
  static getStubConfig() { return { type: 'custom:energy-flow-card', title: 'Live energy', consumers: [] }; }
  setConfig(config: CardConfig) {
    if (!config || typeof config !== 'object') throw new Error('A card configuration is required');
    if (config.consumers && (!Array.isArray(config.consumers) || config.consumers.some(c => !c.entity))) throw new Error('Each consumer needs an entity');
    this.config = { ...config, consumers: config.consumers ?? [] };
  }
  getCardSize() { return 5 + (this.config?.consumers?.length ?? 0); }
  private connection(id: string, path: string, power: number | null, color: string) {
    const active = power !== null && Math.abs(power) > 1;
    const reverse = (power ?? 0) < 0;
    const duration = Math.max(1.2, 5 - Math.log10(Math.abs(power ?? 0) + 1));
    return svg`<path d=${path} class="wire" stroke=${color}/>
      ${active ? svg`<path id=${id} d=${path} class="current" stroke=${color} style=${`animation-duration:${duration}s;animation-direction:${reverse ? 'reverse' : 'normal'}`}/>` : nothing}`;
  }
  private node(x: number, y: number, icon: string, label: string, value: string, color: string, sub?: string, labelAbove = false) {
    return svg`<g transform=${`translate(${x},${y})`}>
      <circle r="43" class="node" stroke=${color}/>
      <foreignObject x="-12" y="-28" width="24" height="24"><ha-icon class="node-icon" .icon=${icon}></ha-icon></foreignObject>
      <text y="12" class="value">${value}</text>
      ${sub ? svg`<text y="28" class="sub">${sub}</text>` : nothing}
      <text y=${labelAbove ? -56 : 62} class="label">${label}</text>
    </g>`;
  }
  render() {
    if (!this.hass || !this.config) return nothing;
    const c = this.config;
    const m = calculate(this.hass, c);
    const configured = Boolean(c.solar_entity || c.grid?.entity || c.grid?.import_entity || c.grid?.export_entity || c.battery?.entity || c.battery?.import_entity || c.battery?.export_entity);
    if (!configured) return html`<ha-card><div class="empty">Select your solar, grid, and battery sensors in the visual editor to get started.</div></ha-card>`;
    const batteryPresent = Boolean(c.battery?.entity || c.battery?.import_entity || c.battery?.export_entity);
    const socState = c.battery_soc_entity ? this.hass.states[c.battery_soc_entity] : undefined;
    const soc = socState && socState.state.trim() && Number.isFinite(Number(socState.state)) && Number(socState.state) >= 0 && Number(socState.state) <= 100 ? `${Math.round(Number(socState.state))}%` : undefined;
    const gridNet = m.grid ? m.grid.incoming - m.grid.outgoing : null;
    const batteryNet = m.battery ? m.battery.incoming - m.battery.outgoing : null;
    return html`<ha-card>
      <header><div><span class="eyebrow">POWER FLOW</span><h2>${c.title || 'Live energy'}</h2></div><span class="live"><i></i> Live</span></header>
      <svg class=${`diagram motion-${c.animation === true ? 'on' : c.animation === false ? 'off' : 'auto'}`} viewBox="0 0 460 400" role="img" aria-label="Live power flow: solar, grid, battery, and home meet at a shared junction">
        ${this.connection('solar-flow', 'M230 115 V192', m.solar, 'var(--ef-solar)')}
        ${this.connection('grid-flow', 'M113 192 H230', gridNet, 'var(--ef-grid)')}
        ${batteryPresent ? this.connection('battery-flow', 'M230 269 V192', batteryNet, 'var(--ef-battery)') : nothing}
        ${this.connection('home-flow', 'M230 192 H347', m.home, 'var(--ef-home)')}
        <circle cx="230" cy="192" r="4" class="junction"/>
        ${this.node(230, 72, 'mdi:solar-power-variant', 'Solar', formatPower(m.solar), 'var(--ef-solar)', 'Production', true)}
        ${this.node(70, 192, 'mdi:transmission-tower', 'Grid', formatPower(gridNet === null ? null : Math.abs(gridNet)), 'var(--ef-grid)', gridNet === null ? 'Unavailable' : gridNet < 0 ? 'Exporting' : gridNet > 0 ? 'Importing' : 'Idle')}
        ${this.node(390, 192, 'mdi:home-lightning-bolt-outline', 'Home', formatPower(m.home), 'var(--ef-home)', 'Calculated')}
        ${batteryPresent ? this.node(230, 312, 'mdi:battery-outline', 'Battery', formatPower(batteryNet === null ? null : Math.abs(batteryNet)), 'var(--ef-battery)', `${soc ? soc + ' · ' : ''}${batteryNet === null ? 'Unavailable' : batteryNet < 0 ? 'Charging' : batteryNet > 0 ? 'Discharging' : 'Idle'}`) : nothing}
      </svg>
      <section class="mix" aria-label="Estimated household power sources">
        <div class="section-title">Home power sources <span>Estimated mix</span></div>
        <div class="mix-bar">${m.sources.map(s => html`<div style=${`width:${m.home ? s.power / m.home * 100 : 0}%;background:${s.color}`} title=${`${s.name}: ${formatPower(s.power)}`}></div>`)}</div>
        <div class="legend">${m.sources.map(s => html`<span><i style=${`background:${s.color}`}></i>${s.name} <b>${formatPower(s.power)}</b></span>`)}</div>
        <p class="hint">Sources allocated proportionally after export and battery charging.</p>
      </section>
      <section class="consumers">
        <div class="section-title">Consumers <span>${m.consumers.length} ${m.consumers.length === 1 ? 'device' : 'devices'}</span></div>
        ${m.consumers.map(device => this.consumer(device.name || String(this.hass.states[device.entity]?.attributes.friendly_name || device.entity), device.icon || 'mdi:power-plug-outline', device.power, m.home))}
        ${this.consumer('Other consumption', 'mdi:dots-horizontal', m.other, m.home)}
        ${m.mismatch ? html`<p class="warning" role="status">Measurements do not balance. Check sensor directions, overlapping consumers, and update timing.</p>` : nothing}
        ${m.home === null || m.consumers.some(d => d.power === null) ? html`<p class="warning" role="status">Some sensors are unavailable or do not report W/kW. Totals that depend on them are unavailable.</p>` : nothing}
      </section>
    </ha-card>`;
  }
  private consumer(name: string, icon: string, power: number | null, home: number | null) {
    const share = power !== null && home !== null && home > 0 ? Math.max(0, power) / home * 100 : null;
    return html`<div class="consumer"><ha-icon .icon=${icon}></ha-icon><div class="device"><div class="row"><span>${name}</span><strong>${formatPower(power)}</strong></div><div class="row"><div class="track"><div style=${`width:${Math.min(100, share ?? 0)}%`}></div></div><small>${share === null ? '—' : `${Math.round(share)}%`}</small></div></div></div>`;
  }
  static styles = css`
    :host { --ef-solar:#f6bd4f;--ef-grid:#a99af7;--ef-battery:#53d4bd;--ef-home:#68b7ff;display:block; }
    ha-card { overflow:hidden;background:var(--ha-card-background,var(--card-background-color,#191c24));color:var(--primary-text-color,#eee);border-radius:24px; }
    header { display:flex;align-items:center;justify-content:space-between;padding:24px 24px 0; }
    .eyebrow { font-size:10px;letter-spacing:2px;color:var(--secondary-text-color); } h2 { margin:5px 0;font-size:22px;font-weight:600; }
    .live { font-size:12px;color:var(--secondary-text-color);display:flex;gap:7px;align-items:center; }.live i { width:6px;height:6px;background:var(--ef-battery);border-radius:50%; }
    .diagram { width:100%;display:block;overflow:visible;margin:8px auto 20px;max-width:540px; }
    .node { fill:var(--ha-card-background,var(--card-background-color,#191c24));stroke-width:2; }
    text { fill:var(--primary-text-color,#eee);text-anchor:middle;font-family:inherit; }.value { font-size:13px;font-weight:600; }.sub { font-size:9px;fill:var(--secondary-text-color,#aaa); }.label { font-size:12px;fill:var(--secondary-text-color,#aaa); }
    foreignObject { color:var(--primary-text-color,#eee); }.node-icon { display:flex;align-items:center;justify-content:center;width:24px;height:24px;--mdc-icon-size:24px; }
    .wire { fill:none;stroke-width:1.5;opacity:.3; }.current { fill:none;stroke-width:4;stroke-linecap:round;stroke-dasharray:1 24;animation:flow linear infinite; }
    .junction { fill:var(--primary-text-color,#eee); }.motion-off .current { animation:none; }
    @keyframes flow { from { stroke-dashoffset:0; } to { stroke-dashoffset:-50; } }
    section { padding:0 24px 20px; }.section-title { display:flex;justify-content:space-between;gap:8px;font-size:13px;font-weight:600;margin-bottom:14px; }.section-title span { font-size:11px;font-weight:400;color:var(--secondary-text-color); }
    .mix-bar { height:8px;display:flex;overflow:hidden;border-radius:8px;background:var(--divider-color,#333); }.mix-bar div { transition:width .5s; }
    .legend { display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;font-size:11px; }.legend span { display:flex;align-items:center;gap:5px; }.legend i { width:6px;height:6px;border-radius:50%; }.legend b { font-weight:500; }
    .hint { font-size:10px;color:var(--secondary-text-color);margin:9px 0 0; }.consumers { border-top:1px solid var(--divider-color,#333);padding-top:20px; }
    .consumer { display:flex;gap:12px;align-items:center;margin:17px 0; }.consumer ha-icon { color:var(--secondary-text-color);--mdc-icon-size:22px; }.device { flex:1;min-width:0; }.row { display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px; }.row span { overflow-wrap:anywhere; }.row strong { white-space:nowrap;font-size:13px;font-weight:500; }.row small { width:35px;text-align:right;color:var(--secondary-text-color);font-size:10px; }
    .track { flex:1;height:4px;border-radius:4px;background:var(--divider-color,#333);margin-top:6px;overflow:hidden; }.track div { height:100%;background:var(--ef-home);border-radius:4px;transition:width .5s; }
    .warning { font-size:12px;color:var(--warning-color,#e7ac55);line-height:1.5; }.empty { padding:24px;line-height:1.6; }
    @media (prefers-reduced-motion:reduce) { .motion-auto .current { animation:none; } * { transition:none!important; } }
    @media (max-width:360px) { header { padding:18px 16px 0; } section { padding-left:16px;padding-right:16px; }.legend { gap:8px; } }
  `;
}
customElements.define('energy-flow-card', EnergyFlowCard);
const registry = window as unknown as { customCards: {type:string;name:string;description:string;preview:boolean}[] };
registry.customCards = registry.customCards || [];
registry.customCards.push({ type:'energy-flow-card', name:'Energy Flow Card', description:'Animated live power flow with a detailed consumer breakdown.', preview:true });
