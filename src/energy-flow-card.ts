import { LitElement, html, css, svg, nothing } from 'lit';
import { calculate, formatPower, type CardConfig, type Hass } from './power';
import { batteryAppearance, formatShare, stateOfCharge } from './presentation';
import './editor';

interface NodeOptions {
  entity?: string;
  home?: boolean;
  batteryStatus?: string;
  statusLabel?: string;
  ring?: ReturnType<typeof calculate>['sources'];
  homePower?: number | null;
}

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
  private moreInfo(entity?: string) {
    if (entity) this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: entity }, bubbles: true, composed: true }));
  }
  private homeRing(sources: NonNullable<NodeOptions['ring']>, home: number | null) {
    let offset = 0;
    return svg`<circle r="59" class="home-ring-track"/>
      ${sources.map(source => {
        const share = home && home > 0 ? source.power / home * 100 : 0;
        const start = offset;
        offset += share;
        return share > 0 ? svg`<circle r="59" pathLength="100" class="home-ring-segment" stroke=${source.color}
          stroke-dasharray=${`${share} ${100 - share}`} stroke-dashoffset=${-start} transform="rotate(-90)">
          <title>${source.name}: ${formatPower(source.power)} (estimated)</title>
        </circle>` : nothing;
      })}`;
  }
  private node(x: number, y: number, icon: string, label: string, value: string, color: string, sub?: string, labelAbove = false, options: NodeOptions = {}) {
    return svg`<g transform=${`translate(${x},${y})`} class=${`flow-node ${options.home ? 'home-node' : ''} ${options.batteryStatus ? `battery-${options.batteryStatus}` : ''} ${options.entity ? 'interactive' : ''}`}
      role=${options.entity ? 'button' : nothing} tabindex=${options.entity ? '0' : nothing}
      aria-label=${`${label}: ${value}${sub ? `, ${sub}` : ''}${options.statusLabel ? `, ${options.statusLabel}` : ''}${options.entity ? '. Open entity details' : ''}`}
      @click=${() => this.moreInfo(options.entity)} @keydown=${(e: KeyboardEvent) => {
        if (options.entity && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.moreInfo(options.entity); }
      }}>
      <circle r=${options.home ? 52 : 43} class="node" stroke=${color}/>
      ${options.home ? this.homeRing(options.ring ?? [], options.homePower ?? null) : nothing}
      <foreignObject x="-12" y=${options.home ? -34 : -28} width="24" height="24"><ha-icon class="node-icon" .icon=${icon}></ha-icon></foreignObject>
      <text y="12" class=${`value ${value === 'Unavailable' ? 'unavailable-value' : ''}`}>${value}</text>
      ${sub ? svg`<text y="28" class="sub">${sub}</text>` : nothing}
      <text y=${labelAbove ? -56 : options.home ? 77 : 62} class="label">${label}</text>
      ${options.statusLabel ? svg`<text y="78" class="battery-status-label">${options.statusLabel}</text>` : nothing}
    </g>`;
  }
  render() {
    if (!this.hass || !this.config) return nothing;
    const c = this.config;
    const m = calculate(this.hass, c);
    const configured = Boolean(c.solar_entity || c.grid?.entity || c.grid?.import_entity || c.grid?.export_entity || c.battery?.entity || c.battery?.import_entity || c.battery?.export_entity);
    if (!configured) return html`<ha-card><div class="empty">Select your solar, grid, and battery sensors in the visual editor to get started.</div></ha-card>`;
    const batteryPresent = Boolean(c.battery?.entity || c.battery?.import_entity || c.battery?.export_entity);
    const soc = stateOfCharge(this.hass, c.battery_soc_entity);
    const gridNet = m.grid ? m.grid.incoming - m.grid.outgoing : null;
    const batteryNet = m.battery ? m.battery.incoming - m.battery.outgoing : null;
    const battery = batteryAppearance(soc, batteryNet);
    const gridEntity = c.grid?.entity || (gridNet !== null && gridNet < 0 ? c.grid?.export_entity || c.grid?.import_entity : c.grid?.import_entity || c.grid?.export_entity);
    const batteryEntity = c.battery?.entity || (batteryNet !== null && batteryNet < -1 ? c.battery?.export_entity || c.battery?.import_entity : c.battery?.import_entity || c.battery?.export_entity) || c.battery_soc_entity;
    return html`<ha-card>
      <header><div><span class="eyebrow">POWER FLOW</span><h2>${c.title || 'Live energy'}</h2></div><span class="live"><i></i> Live</span></header>
      <svg class=${`diagram motion-${c.animation === true ? 'on' : c.animation === false ? 'off' : 'auto'}`} viewBox="0 0 460 400" role="group" aria-label="Live power flow: solar, grid, battery, and home meet at a shared junction">
        ${this.connection('solar-flow', 'M230 115 V192', m.solar, 'var(--ef-solar)')}
        ${this.connection('grid-flow', 'M113 192 H230', gridNet, 'var(--ef-grid)')}
        ${batteryPresent ? this.connection('battery-flow', 'M230 269 V192', batteryNet, 'var(--ef-battery)') : nothing}
        ${this.connection('home-flow', 'M230 192 H331', m.home, 'var(--ef-home)')}
        <circle cx="230" cy="192" r="4" class="junction"/>
        ${this.node(230, 72, 'mdi:solar-power-variant', 'Solar', formatPower(m.solar), 'var(--ef-solar)', 'Production', true, { entity: c.solar_entity })}
        ${this.node(70, 192, 'mdi:transmission-tower', 'Grid', formatPower(gridNet === null ? null : Math.abs(gridNet)), 'var(--ef-grid)', gridNet === null ? 'Unavailable' : gridNet < 0 ? 'Exporting' : gridNet > 0 ? 'Importing' : 'Idle', false, { entity: gridEntity })}
        ${this.node(390, 192, 'mdi:home-lightning-bolt-outline', 'Home', formatPower(m.home), 'var(--ef-home)', 'Calculated', false, { home: true, ring: m.sources, homePower: m.home })}
        ${batteryPresent ? this.node(230, 312, battery.icon, 'Battery', formatPower(batteryNet === null ? null : Math.abs(batteryNet)), 'var(--ef-battery)', soc !== null ? `${Math.round(soc)}%` : c.battery_soc_entity ? 'SoC —' : undefined, false, { entity: batteryEntity, batteryStatus: battery.status, statusLabel: battery.label }) : nothing}
      </svg>
      <section class="mix" aria-label="Estimated household power sources">
        <div class="section-title">Home power sources <span>Estimated mix</span></div>
        <div class="mix-bar">${m.sources.map(s => html`<div style=${`width:${m.home ? s.power / m.home * 100 : 0}%;background:${s.color}`} title=${`${s.name}: ${formatPower(s.power)}`}></div>`)}</div>
        <div class="legend">${m.sources.map(s => html`<span><i style=${`background:${s.color}`}></i>${s.name} <b>${formatPower(s.power)}</b></span>`)}</div>
        <p class="hint">Sources allocated proportionally after export and battery charging.</p>
      </section>
      <section class="consumers">
        <div class="section-title">Consumers <span>${m.consumers.length} ${m.consumers.length === 1 ? 'device' : 'devices'}</span></div>
        ${m.consumers.map(device => this.consumer(device.name || String(this.hass.states[device.entity]?.attributes.friendly_name || device.entity), device.power, m.home, { entity: device.entity, icon: device.icon, offline: device.unavailable }))}
        ${this.consumer('Other consumption', m.other, m.home, { icon: 'mdi:dots-horizontal' })}
        ${m.mismatch ? html`<p class="warning" role="status">Measurements do not balance. Check sensor directions, overlapping consumers, and update timing.</p>` : nothing}
        ${m.home === null ? html`<p class="warning" role="status">Some source sensors are unavailable or do not report W/kW. Totals that depend on them are unavailable.</p>` : nothing}
      </section>
    </ha-card>`;
  }
  private consumer(name: string, power: number | null, home: number | null, options: { entity?: string; icon?: string; offline?: boolean } = {}) {
    const share = power !== null && home !== null && home > 0 ? Math.max(0, power) / home * 100 : null;
    const state = options.entity ? this.hass.states[options.entity] : undefined;
    const contents = html`<span class="consumer-icon">${options.icon || !state
      ? html`<ha-icon .icon=${options.icon || 'mdi:power-plug-outline'}></ha-icon>`
      : html`<ha-state-icon .hass=${this.hass} .stateObj=${state}></ha-state-icon>`}</span>
      <span class="device"><span class="row"><span class="device-name">${name}${options.offline ? html`<span class="offline-badge" title="No usable power reading. Counted as 0 W.">Offline</span>` : nothing}</span><strong>${formatPower(power)}</strong></span>
      <span class="row"><span class="track"><span style=${`width:${Math.min(100, share ?? 0)}%`}></span></span><small>${formatShare(power, home)}</small></span></span>`;
    return options.entity ? html`<button class="consumer interactive" type="button" @click=${() => this.moreInfo(options.entity)}>${contents}</button>`
      : html`<div class="consumer">${contents}</div>`;
  }
  static styles = css`
    :host { --ef-solar:#f6bd4f;--ef-grid:#a99af7;--ef-battery:#53d4bd;--ef-home:#68b7ff;display:block; }
    ha-card { overflow:hidden;background:var(--ha-card-background,var(--card-background-color,#191c24));color:var(--primary-text-color,#eee);border-radius:24px; }
    header { display:flex;align-items:center;justify-content:space-between;padding:24px 24px 0; }
    .eyebrow { font-size:10px;letter-spacing:2px;color:var(--secondary-text-color); } h2 { margin:5px 0;font-size:22px;font-weight:600; }
    .live { font-size:12px;color:var(--secondary-text-color);display:flex;gap:7px;align-items:center; }.live i { width:6px;height:6px;background:var(--ef-battery);border-radius:50%; }
    .diagram { width:100%;display:block;overflow:visible;margin:8px auto 20px;max-width:540px; }
    .node { fill:var(--ha-card-background,var(--card-background-color,#191c24));stroke-width:2; }
    .home-node .value { font-size:20px;font-weight:750; }.home-node .unavailable-value { font-size:13px; }.home-node .node { stroke-width:1.5; }
    .home-ring-track,.home-ring-segment { fill:none;stroke-width:4; }.home-ring-track { stroke:var(--divider-color,#444); }
    .battery-charging { --battery-state-color:#4ade80; }.battery-discharging { --battery-state-color:#fb7185; }
    .battery-charging .node,.battery-discharging .node { stroke:var(--battery-state-color);filter:drop-shadow(0 0 6px var(--battery-state-color)); }
    .battery-charging .node-icon,.battery-discharging .node-icon { color:var(--battery-state-color); }
    .battery-status-label { font-size:10px;fill:var(--battery-state-color,var(--secondary-text-color,#aaa)); }
    .interactive { cursor:pointer; }.flow-node:focus-visible { outline:none; }.flow-node:focus-visible .node { stroke-width:4;stroke:var(--primary-color,#68b7ff); }
    text { fill:var(--primary-text-color,#eee);text-anchor:middle;font-family:inherit; }.value { font-size:13px;font-weight:600;font-variant-numeric:tabular-nums; }.sub { font-size:9px;fill:var(--secondary-text-color,#aaa); }.label { font-size:12px;fill:var(--secondary-text-color,#aaa); }
    foreignObject { color:var(--primary-text-color,#eee); }.node-icon { display:flex;align-items:center;justify-content:center;width:24px;height:24px;--mdc-icon-size:24px; }
    .wire { fill:none;stroke-width:1.5;opacity:.3; }.current { fill:none;stroke-width:4;stroke-linecap:round;stroke-dasharray:1 24;animation:flow linear infinite; }
    .junction { fill:var(--primary-text-color,#eee); }.motion-off .current { animation:none; }
    @keyframes flow { from { stroke-dashoffset:0; } to { stroke-dashoffset:-50; } }
    section { padding:0 24px 20px; }.section-title { display:flex;justify-content:space-between;gap:8px;font-size:13px;font-weight:600;margin-bottom:14px; }.section-title span { font-size:11px;font-weight:400;color:var(--secondary-text-color); }
    .mix-bar { height:8px;display:flex;overflow:hidden;border-radius:8px;background:var(--divider-color,#333); }.mix-bar div { transition:width .5s; }
    .legend { display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;font-size:11px; }.legend span { display:flex;align-items:center;gap:5px; }.legend i { width:6px;height:6px;border-radius:50%; }.legend b { font-weight:500; }
    .hint { font-size:10px;color:var(--secondary-text-color);margin:9px 0 0; }.consumers { border-top:1px solid var(--divider-color,#333);padding-top:20px; }
    .consumer { box-sizing:border-box;width:100%;display:flex;gap:12px;align-items:center;margin:6px 0;padding:10px 0;min-height:54px;border:0;background:transparent;color:inherit;font:inherit;text-align:left; }
    button.consumer { border-radius:10px; }button.consumer:hover { background:var(--secondary-background-color,rgba(127,127,127,.08)); }button.consumer:focus-visible { outline:2px solid var(--primary-color,#68b7ff);outline-offset:4px; }
    .consumer-icon { display:flex;align-items:center;justify-content:center;flex:0 0 30px;height:30px;border-radius:9px;background:var(--secondary-background-color,rgba(127,127,127,.08));color:var(--secondary-text-color);--mdc-icon-size:21px; }
    .device { flex:1;min-width:0; }.row { display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px; }.device-name { display:flex;align-items:center;gap:7px;flex-wrap:wrap;overflow-wrap:anywhere;min-width:0; }
    .row strong { white-space:nowrap;font-size:15px;font-weight:650;font-variant-numeric:tabular-nums; }.row small { width:35px;text-align:right;color:var(--secondary-text-color);font-size:11px;font-variant-numeric:tabular-nums; }
    .offline-badge { border:1px solid var(--divider-color,#555);border-radius:5px;padding:2px 5px;font-size:9px;line-height:1.2;color:var(--secondary-text-color);font-weight:400; }
    .track { flex:1;height:4px;border-radius:4px;background:var(--divider-color,#333);margin-top:6px;overflow:hidden; }.track span { display:block;height:100%;background:var(--ef-home);border-radius:4px;transition:width .5s; }
    .warning { font-size:12px;color:var(--warning-color,#e7ac55);line-height:1.5; }.empty { padding:24px;line-height:1.6; }
    @media (prefers-reduced-motion:reduce) { .motion-auto .current { animation:none; } * { transition:none!important; } }
    @media (max-width:360px) { header { padding:18px 16px 0; } section { padding-left:16px;padding-right:16px; }.legend { gap:8px; } }
  `;
}
customElements.define('energy-flow-card', EnergyFlowCard);
const registry = window as unknown as { customCards: {type:string;name:string;description:string;preview:boolean}[] };
registry.customCards = registry.customCards || [];
registry.customCards.push({ type:'energy-flow-card', name:'Energy Flow Card', description:'Animated live power flow with a detailed consumer breakdown.', preview:true });
