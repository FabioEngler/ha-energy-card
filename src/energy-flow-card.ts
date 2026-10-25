import { DEFAULT_COLORS, isHexColor, type ColorKey } from './colors';
import { LitElement, html, css, svg, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { calculate, formatPower, type CardConfig, type Hass } from './power';
import { batteryAppearance, formatShare, stateOfCharge } from './presentation';
import { BalanceGracePeriod } from './balance';
import { FlowAnimator, FLOW_GEOMETRY, type FlowId } from './flow-animator';
import { DEFAULT_ANIMATION_POWER_MAX, MAX_PARTICLES, powerEnvelope } from './motion';
import { nodeIconPath } from './icons';
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
  static properties = { hass: { attribute: false }, config: { state: true }, diagramScale: { state: true } };
  declare hass: Hass;
  declare config: CardConfig;
  private balanceGrace = new BalanceGracePeriod();
  private reading?: ReturnType<BalanceGracePeriod['update']>;
  private balanceTimer?: ReturnType<typeof setTimeout>;
  private flowAnimator = new FlowAnimator();
  private diagramScale = 1;
  private diagram?: SVGSVGElement;
  private resizeObserver?: ResizeObserver;
  private observedWidth = -1;
  private updateDiagramScale() {
    const width = this.diagram?.getBoundingClientRect().width;
    if (!width) return;
    // SVG scales with the card, but text and icons keep readable CSS sizes.
    const scale = Math.max(1, 520 / width);
    if (Math.abs(scale - this.diagramScale) > .001) {
      this.style.setProperty('--ef-diagram-text-scale', String(scale));
      this.diagramScale = scale;
    }
  }
  private clearBalanceTimer() {
    if (this.balanceTimer !== undefined) clearTimeout(this.balanceTimer);
    this.balanceTimer = undefined;
  }
  connectedCallback() {
    this.balanceGrace.reset();
    super.connectedCallback();
    this.flowAnimator.connect();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect.width;
        if (width !== undefined && Math.abs(width - this.observedWidth) > .1) {
          this.observedWidth = width;
          this.updateDiagramScale();
        }
      });
      this.resizeObserver.observe(this);
    }
    this.requestUpdate();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearBalanceTimer();
    this.balanceGrace.reset();
    this.flowAnimator.disconnect();
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.diagram = undefined;
    this.observedWidth = -1;
  }
  protected willUpdate() {
    this.clearBalanceTimer();
    if (!this.hass || !this.config) return;
    this.reading = this.balanceGrace.update(calculate(this.hass, this.config), Date.now());
    if (this.reading.recheckIn > 0 && this.isConnected) {
      this.balanceTimer = setTimeout(() => {
        this.balanceTimer = undefined;
        this.requestUpdate();
      }, this.reading.recheckIn);
    }
  }
  protected updated() {
    const m = this.reading;
    if (!m) return;
    const diagram = this.renderRoot.querySelector<SVGSVGElement>('.diagram');
    if (diagram !== (this.diagram ?? null)) {
      this.diagram = diagram ?? undefined;
      this.updateDiagramScale();
    }
    this.flowAnimator.sync(diagram, {
      'solar-flow': m.solar,
      'grid-flow': m.grid ? m.grid.incoming - m.grid.outgoing : null,
      'battery-flow': m.battery ? m.battery.incoming - m.battery.outgoing : null,
      'home-flow': m.home,
    }, this.config.animation_power_max, this.config.animation);
  }
  static getConfigElement() { return document.createElement('energy-flow-card-editor'); }
  static getStubConfig() { return { type: 'custom:energy-flow-card', title: 'Live energy', consumers: [] }; }
  setConfig(config: CardConfig) {
    if (!config || typeof config !== 'object') throw new Error('A card configuration is required');
    if (config.consumers && (!Array.isArray(config.consumers) || config.consumers.some(c => !c.entity))) throw new Error('Each consumer needs an entity');
    if (config.animation_power_max !== undefined && (!Number.isFinite(config.animation_power_max) || config.animation_power_max <= 0)) throw new Error('Animation power limit must be a positive number in watts');
    for (const [key,value] of Object.entries(config.colors ?? {})) {
      if (!(Object.hasOwn(DEFAULT_COLORS,key)) || (value && !isHexColor(value))) throw new Error('Colors must be hex codes such as #33AABB');
    }
    if (config.consumers?.some(c => c.color && !isHexColor(c.color))) throw new Error('Consumer colors must be hex codes such as #33AABB');
    for (const key of Object.keys(DEFAULT_COLORS) as ColorKey[]) {
      const value=config.colors?.[key];
      if (value) this.style.setProperty(`--ef-${key}`,value);
      else this.style.removeProperty(`--ef-${key}`);
    }
    this.clearBalanceTimer();
    this.balanceGrace.reset();
    this.config = { ...config, consumers: config.consumers ?? [] };
  }
  getCardSize() { return 5 + (this.config?.consumers?.length ?? 0); }
  private connection(id: FlowId, power: number | null, color: string) {
    const g = FLOW_GEOMETRY[id];
    const visual = powerEnvelope(power, this.config.animation_power_max ?? DEFAULT_ANIMATION_POWER_MAX);
    const angle = Math.atan2(g.y2 - g.y1, g.x2 - g.x1) * 180 / Math.PI + (visual.direction < 0 ? 180 : 0);
    return svg`<g data-flow=${id} style=${`color:${color}`} aria-hidden="true" class="energy-flow">
      <path d=${`M${g.x1} ${g.y1} L${g.x2} ${g.y2}`} class="wire"/>
      <path class="flow-static" d="M-4 -3 L0 0 L-4 3" opacity=${visual.active ? visual.brightness : 0}
        transform=${`translate(${(g.x1 + g.x2) / 2},${(g.y1 + g.y2) / 2}) rotate(${angle})`}/>
      <g class="flow-particles">${Array.from({ length: MAX_PARTICLES }, () => svg`<g class="flow-particle" opacity="0">
        <circle cx="-9" r=".6" opacity=".15"/><circle cx="-6" r="1" opacity=".3"/><circle cx="-3" r="1.4" opacity=".55"/>
        <circle r="4" opacity=".12"/><circle r="2"/><circle r=".7" fill="white" opacity=".85"/>
      </g>`)}</g>
    </g>`;
  }
  private moreInfo(entity?: string) {
    if (entity) this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: entity }, bubbles: true, composed: true }));
  }
  private homeRing(sources: NonNullable<NodeOptions['ring']>, home: number | null, radius: number) {
    let offset = 0;
    return svg`<circle r=${radius} class="home-ring-track"/>
      ${sources.map(source => {
        const share = home && home > 0 ? source.power / home * 100 : 0;
        const start = offset;
        offset += share;
        return share > 0 ? svg`<circle r=${radius} pathLength="100" class="home-ring-segment" stroke=${source.color}
          stroke-dasharray=${`${share} ${100 - share}`} stroke-dashoffset=${-start} transform="rotate(-90)">
          <title>${source.name}: ${formatPower(source.power)} (estimated)</title>
        </circle>` : nothing;
      })}`;
  }
  private node(x: number, y: number, icon: string, label: string, value: string, color: string, sub?: string, labelAbove = false, options: NodeOptions = {}) {
    const radius = Math.max(options.home ? 64 : 52, (options.home ? 48 : 42) * this.diagramScale);
    const iconSize = 24 * this.diagramScale;
    const labelY = labelAbove ? -(radius + 12 * this.diagramScale) : Math.max(options.home ? 77 : 62, radius + 17 * this.diagramScale);
    return svg`<g transform=${`translate(${x},${y})`} class=${`flow-node ${options.home ? 'home-node' : ''} ${options.batteryStatus ? `battery-${options.batteryStatus}` : ''} ${options.entity ? 'interactive' : ''}`}
      role=${options.entity ? 'button' : nothing} tabindex=${options.entity ? '0' : nothing}
      aria-label=${`${label}: ${value}${sub ? `, ${sub}` : ''}${options.statusLabel ? `, ${options.statusLabel}` : ''}${options.entity ? '. Open entity details' : ''}`}
      @click=${() => this.moreInfo(options.entity)} @keydown=${(e: KeyboardEvent) => {
        if (options.entity && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.moreInfo(options.entity); }
      }}>
      <circle r=${radius} class="node" stroke=${color}/>
      ${options.home ? this.homeRing(options.ring ?? [], options.homePower ?? null, radius + 7) : nothing}
      <svg class="node-icon" data-icon=${icon} x=${-iconSize / 2} y=${(options.home ? -34 : -28) * this.diagramScale}
        width=${iconSize} height=${iconSize} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d=${nodeIconPath(icon)}/></svg>
      <text y=${10 * this.diagramScale} class=${`value ${value === 'Unavailable' ? 'unavailable-value' : ''}`}>${value}</text>
      ${sub ? svg`<text y=${26 * this.diagramScale} class="sub">${sub}</text>` : nothing}
      <text y=${labelY} class="label">${label}</text>
      ${options.statusLabel ? svg`<text y=${labelY + 17 * this.diagramScale} class="battery-status-label">${options.statusLabel}</text>` : nothing}
    </g>`;
  }
  render() {
    if (!this.hass || !this.config || !this.reading) return nothing;
    const c = this.config;
    const m = this.reading;
    const configured = Boolean(c.solar_entity || c.grid?.entity || c.grid?.import_entity || c.grid?.export_entity || c.battery?.entity || c.battery?.import_entity || c.battery?.export_entity);
    if (!configured) return html`<ha-card><div class="empty">Select your solar, grid, and battery sensors in the visual editor to get started.</div></ha-card>`;
    const batteryPresent = Boolean(c.battery?.entity || c.battery?.import_entity || c.battery?.export_entity);
    const soc = stateOfCharge(this.hass, c.battery_soc_entity);
    const gridNet = m.grid ? m.grid.incoming - m.grid.outgoing : null;
    const batteryNet = m.battery ? m.battery.incoming - m.battery.outgoing : null;
    const battery = batteryAppearance(soc, batteryNet);
    const gridEntity = c.grid?.entity || (gridNet !== null && gridNet < 0 ? c.grid?.export_entity || c.grid?.import_entity : c.grid?.import_entity || c.grid?.export_entity);
    const batteryEntity = c.battery?.entity || (batteryNet !== null && batteryNet < -1 ? c.battery?.export_entity || c.battery?.import_entity : c.battery?.import_entity || c.battery?.export_entity) || c.battery_soc_entity;
    return html`<ha-card class=${`motion-${c.animation === true ? 'on' : c.animation === false ? 'off' : 'auto'}`}>
      <header><div><span class="eyebrow">POWER FLOW</span><h2>${c.title || 'Live energy'}</h2></div><span class=${`live ${m.updating ? 'updating' : ''}`}><i></i>${m.updating ? 'Updating' : 'Live'}</span></header>
      <svg class=${`diagram motion-${c.animation === true ? 'on' : c.animation === false ? 'off' : 'auto'}`} viewBox="0 0 520 540" role="group" aria-label="Live power flow: solar, grid, battery, and home meet at a shared junction">
        <defs><radialGradient id="junction-halo"><stop offset="0" stop-color="currentColor" stop-opacity=".8"/><stop offset=".35" stop-color="currentColor" stop-opacity=".25"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>
        ${this.connection('solar-flow', m.solar, 'var(--ef-solar)')}
        ${this.connection('grid-flow', gridNet, 'var(--ef-grid)')}
        ${batteryPresent ? this.connection('battery-flow', batteryNet, 'var(--ef-battery)') : nothing}
        ${this.connection('home-flow', m.home, 'var(--ef-home)')}
        <circle cx="260" cy="250" r="13" class="junction-glow" fill="url(#junction-halo)" opacity="0" aria-hidden="true"/>
        <circle cx="260" cy="250" r="3.5" class="junction"/>
        ${this.node(260, 120, 'mdi:solar-power-variant', 'Solar', formatPower(m.solar), 'var(--ef-solar)', 'Production', true, { entity: c.solar_entity })}
        ${this.node(100, 250, 'mdi:transmission-tower', 'Grid', formatPower(gridNet === null ? null : Math.abs(gridNet)), 'var(--ef-grid)', gridNet === null ? 'Unavailable' : gridNet < 0 ? 'Exporting' : gridNet > 0 ? 'Importing' : 'Idle', false, { entity: gridEntity })}
        ${this.node(420, 250, 'mdi:home-lightning-bolt-outline', 'Home', formatPower(m.home), 'var(--ef-home)', m.updating ? 'Updating' : 'Calculated', false, { home: true, ring: m.sources, homePower: m.home })}
        ${batteryPresent ? this.node(260, 380, battery.icon, 'Battery', formatPower(batteryNet === null ? null : Math.abs(batteryNet)), 'var(--ef-battery)', soc !== null ? `${Math.round(soc)}%` : c.battery_soc_entity ? 'SoC —' : undefined, false, { entity: batteryEntity, batteryStatus: battery.status, statusLabel: battery.label }) : nothing}
      </svg>
      <section class="mix" aria-label="Estimated household power sources">
        <div class="section-title">Home power sources <span>${m.updating ? 'Updating' : 'Estimated mix'}</span></div>
        <div class="mix-bar">${m.sources.map(s => html`<div style=${`width:${m.home ? s.power / m.home * 100 : 0}%;background:${s.color}`} title=${`${s.name}: ${formatPower(s.power)}`}></div>`)}</div>
        <div class="legend">${m.sources.map(s => html`<span><i style=${`background:${s.color}`}></i>${s.name} <b>${formatPower(s.power)}</b></span>`)}</div>
        <p class="hint" role=${m.updating ? 'status' : nothing}>${m.updating ? m.home === null ? 'Waiting for source readings to balance.' : 'Showing the last balanced home total and source mix while readings catch up.' : 'Sources allocated proportionally after export and battery charging.'}</p>
      </section>
      <section class="consumers">
        <div class="section-title">Consumers <span>${m.consumers.length} ${m.consumers.length === 1 ? 'device' : 'devices'}</span></div>
        ${repeat(m.consumers, device => device.entity, device => this.consumer(device.name || String(this.hass.states[device.entity]?.attributes.friendly_name || device.entity), device.power, m.home, { entity: device.entity, icon: device.icon, offline: device.unavailable, color: device.color }))}
        ${this.consumer('Other consumption', m.other, m.home, { icon: 'mdi:dots-horizontal' })}
        ${m.mismatch ? html`<p class="warning" role="status">Measurements do not balance. Check sensor directions, overlapping consumers, and update timing.</p>` : nothing}
        ${m.home === null && !m.updating ? html`<p class="warning" role="status">Some source sensors are unavailable or do not report W/kW. Totals that depend on them are unavailable.</p>` : nothing}
      </section>
    </ha-card>`;
  }
  private consumer(name: string, power: number | null, home: number | null, options: { entity?: string; icon?: string; offline?: boolean; color?: string } = {}) {
    const share = power !== null && home !== null && home > 0 ? Math.max(0, power) / home * 100 : null;
    const state = options.entity ? this.hass.states[options.entity] : undefined;
    const contents = html`<span class="consumer-icon">${options.icon || !state
      ? html`<ha-icon .icon=${options.icon || 'mdi:power-plug-outline'}></ha-icon>`
      : html`<ha-state-icon .hass=${this.hass} .stateObj=${state}></ha-state-icon>`}</span>
      <span class="device"><span class="row"><span class="device-name">${name}${options.offline ? html`<span class="offline-badge" title="No usable power reading. Counted as 0 W.">Offline</span>` : nothing}</span><strong>${formatPower(power)}</strong></span>
      <span class="row"><span class="track"><span style=${`transform:scaleX(${Math.min(100, share ?? 0) / 100})`}></span></span><small>${formatShare(power, home)}</small></span></span>`;
    return options.entity ? html`<button class="consumer interactive" style=${`--consumer-color:${options.color || 'var(--ef-consumers)'}`} type="button" @click=${() => this.moreInfo(options.entity)}>${contents}</button>`
      : html`<div class="consumer" style="--consumer-color:var(--ef-consumers)">${contents}</div>`;
  }
  static styles = css`
    :host { --ef-solar:#f6bd4f;--ef-grid:#a99af7;--ef-battery:#53d4bd;--ef-home:#68b7ff;--ef-consumers:#68b7ff;--ef-charging:#4ade80;--ef-discharging:#fb7185;display:block;-webkit-text-size-adjust:100%;text-size-adjust:100%; }
    ha-card { overflow:hidden;background:var(--ha-card-background,var(--card-background-color,#191c24));color:var(--primary-text-color,#eee);border-radius:24px; }
    header { display:flex;align-items:center;justify-content:space-between;padding:24px 24px 0; }
    .eyebrow { font-size:11px;letter-spacing:2px;color:var(--secondary-text-color); } h2 { margin:5px 0;font-size:22px;font-weight:600; }
    .live { font-size:12px;color:var(--secondary-text-color);display:flex;gap:7px;align-items:center; }.live i { width:6px;height:6px;background:var(--ef-battery);border-radius:50%; }
    .live.updating i { background:var(--warning-color,#e7ac55); }
    .diagram { width:100%;display:block;overflow:visible;margin:8px auto 20px;max-width:540px; }
    .node { fill:var(--ha-card-background,var(--card-background-color,#191c24));stroke-width:2; }
    .home-node .value { font-size:calc(20px * var(--ef-diagram-text-scale,1));font-weight:750; }.home-node .value.unavailable-value { font-size:calc(13px * var(--ef-diagram-text-scale,1)); }.home-node .node { stroke-width:1.5; }
    .home-ring-track,.home-ring-segment { fill:none;stroke-width:4; }.home-ring-track { stroke:var(--divider-color,#444); }
    .battery-charging { --battery-state-color:var(--ef-charging); }.battery-discharging { --battery-state-color:var(--ef-discharging); }
    .battery-charging .node,.battery-discharging .node { stroke:var(--battery-state-color);filter:drop-shadow(0 0 6px var(--battery-state-color)); }
    .battery-charging .node-icon,.battery-discharging .node-icon { color:var(--battery-state-color); }
    .battery-status-label { font-size:calc(12px * var(--ef-diagram-text-scale,1));fill:var(--battery-state-color,var(--secondary-text-color,#aaa)); }
    .interactive { cursor:pointer; }.flow-node:focus-visible { outline:none; }.flow-node:focus-visible .node { stroke-width:4;stroke:var(--primary-color,#68b7ff); }
    text { fill:var(--primary-text-color,#eee);text-anchor:middle;font-family:inherit; }.value { font-size:calc(15px * var(--ef-diagram-text-scale,1));font-weight:600;font-variant-numeric:tabular-nums; }.value.unavailable-value { font-size:calc(12px * var(--ef-diagram-text-scale,1)); }.sub { font-size:calc(12px * var(--ef-diagram-text-scale,1));fill:var(--secondary-text-color,#aaa); }.label { font-size:calc(13px * var(--ef-diagram-text-scale,1));fill:var(--secondary-text-color,#aaa); }
    .node-icon { fill:currentColor;pointer-events:none; }
    .energy-flow { pointer-events:none; }.wire { fill:none;stroke:currentColor;stroke-width:1.5;opacity:.23; }
    .flow-static { fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round; }
    .flow-particles { display:none;fill:currentColor;filter:drop-shadow(0 0 1.5px currentColor); }
    .diagram[data-motion] .flow-particles { display:block; }.diagram[data-motion] .flow-static { display:none; }
    .junction { fill:var(--primary-text-color,#eee); }.junction-glow { pointer-events:none; }
    section { padding:0 24px 20px; }.section-title { display:flex;justify-content:space-between;gap:8px;font-size:14px;font-weight:600;margin-bottom:14px; }.section-title span { font-size:12px;font-weight:400;color:var(--secondary-text-color); }
    .mix-bar { height:8px;display:flex;overflow:hidden;border-radius:8px;background:var(--divider-color,#333); }.mix-bar div { transition:width .5s; }
    .legend { display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;font-size:13px; }.legend span { display:flex;align-items:center;gap:5px; }.legend i { width:6px;height:6px;border-radius:50%; }.legend b { font-weight:500; }
    .hint { font-size:12px;color:var(--secondary-text-color);margin:10px 0 0;line-height:1.5; }.consumers { border-top:1px solid var(--divider-color,#333);padding-top:20px; }
    .consumer { box-sizing:border-box;width:100%;display:flex;gap:12px;align-items:center;margin:6px 0;padding:10px 0;min-height:54px;border:0;background:transparent;color:inherit;font:inherit;text-align:left; }
    button.consumer { border-radius:10px; }button.consumer:hover { background:var(--secondary-background-color,rgba(127,127,127,.08)); }button.consumer:focus-visible { outline:2px solid var(--primary-color,#68b7ff);outline-offset:4px; }
    .consumer-icon { display:flex;align-items:center;justify-content:center;flex:0 0 30px;height:30px;border-radius:9px;background:var(--secondary-background-color,rgba(127,127,127,.08));color:var(--secondary-text-color);--mdc-icon-size:21px; }
    .device { flex:1;min-width:0; }.row { display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px; }.device-name { display:flex;align-items:center;gap:7px;flex-wrap:wrap;overflow-wrap:anywhere;min-width:0; }
    .row strong { white-space:nowrap;font-size:16px;font-weight:650;font-variant-numeric:tabular-nums; }.row small { width:35px;text-align:right;color:var(--secondary-text-color);font-size:12px;font-variant-numeric:tabular-nums; }
    .offline-badge { border:1px solid var(--divider-color,#555);border-radius:5px;padding:2px 5px;font-size:12px;line-height:1.2;color:var(--secondary-text-color);font-weight:400; }
    .track { flex:1;height:4px;border-radius:4px;background:var(--divider-color,#333);margin-top:6px;overflow:hidden; }.track span { display:block;width:100%;height:100%;background:var(--consumer-color,var(--ef-consumers));border-radius:4px;transform-origin:left center;transition:transform .4s cubic-bezier(.22,.61,.36,1); }
    .warning { font-size:12px;color:var(--warning-color,#e7ac55);line-height:1.5; }.empty { padding:24px;line-height:1.6; }
    .motion-off .track span,.motion-off .mix-bar div { transition:none; }
    @media (prefers-reduced-motion:reduce) { .motion-auto .track span,.motion-auto .mix-bar div { transition:none; } }
    @media (max-width:360px) { header { padding:18px 16px 0; } section { padding-left:16px;padding-right:16px; }.legend { gap:8px; } }
  `;
}
customElements.define('energy-flow-card', EnergyFlowCard);
const registry = window as unknown as { customCards: {type:string;name:string;description:string;preview:boolean}[] };
registry.customCards = registry.customCards || [];
registry.customCards.push({ type:'energy-flow-card', name:'Energy Flow Card', description:'Animated live power flow with a detailed consumer breakdown.', preview:true });
