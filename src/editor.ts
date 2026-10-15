import { LitElement, html, css, nothing } from 'lit';
import type { CardConfig, Consumer, Hass, FlowConfig } from './power';

class EnergyFlowEditor extends LitElement {
  static properties = { hass: { attribute:false }, config: { state:true } };
  declare hass: Hass;
  declare config: CardConfig;
  setConfig(config: CardConfig) { this.config = { ...config }; }
  private updateConfig(patch: Partial<CardConfig>) {
    this.config = { ...this.config, ...patch };
    this.dispatchEvent(new CustomEvent('config-changed', { detail:{ config:this.config }, bubbles:true, composed:true }));
  }
  private form(schema: unknown[], data: Record<string, unknown>, change: (value: any) => void) {
    return html`<ha-form .hass=${this.hass} .schema=${schema} .data=${data}
      .computeLabel=${(s: {label?:string;name:string}) => s.label || s.name}
      @value-changed=${(e: CustomEvent) => { e.stopPropagation(); change(e.detail.value); }}></ha-form>`;
  }
  private entity(name:string, label:string, soc = false) {
    return { name, label, selector:{ entity:{ domain:'sensor', device_class: soc ? 'battery' : 'power' } } };
  }
  private source(key:'grid'|'battery') {
    const v = this.config[key] ?? {};
    const combined = Object.hasOwn(v, 'entity');
    const battery = key === 'battery';
    return html`<details open><summary>${battery ? 'Battery' : 'Grid'}</summary>
      <p>${battery ? 'Discharge supplies the home; charge draws power from it.' : 'Import supplies the home; export sends power to the grid.'}</p>
      <label class="check"><input type="checkbox" .checked=${combined} @change=${(e:Event) => {
        const checked = (e.target as HTMLInputElement).checked;
        // Preserve the chosen sensor mode before an entity is selected.
        this.updateConfig({ [key]: checked ? { entity:'' } : {} });
      }}>One signed sensor</label>
      ${this.form(combined ? [this.entity('entity','Signed power sensor'), {name:'invert',label:'Invert direction (default: positive = import / discharge)',selector:{boolean:{}}}] : [this.entity('import_entity',battery ? 'Discharge power' : 'Grid import'),this.entity('export_entity',battery ? 'Charge power' : 'Grid export')], v as Record<string,unknown>, (data: FlowConfig) => this.updateConfig({[key]:data}))}
    </details>`;
  }
  private editConsumer(index:number, patch:Partial<Consumer>) {
    const consumers = [...(this.config.consumers ?? [])];
    consumers[index] = { ...consumers[index], ...patch };
    this.updateConfig({consumers});
  }
  render() {
    if (!this.hass || !this.config) return nothing;
    return html`<div class="editor">
      ${this.form([{name:'title',label:'Title',selector:{text:{}}},this.entity('solar_entity','Solar production'),this.entity('battery_soc_entity','Battery state of charge',true),{name:'animation',label:'Animate power flows',selector:{boolean:{}}},{name:'sort_by_power',label:'Sort consumers by current power',selector:{boolean:{}}}],{animation:true,...this.config},data => this.updateConfig(data))}
      ${this.source('grid')}${this.source('battery')}
      <h3>Consumers</h3><p>Choose individual, non-overlapping power sensors. Home consumption is calculated automatically.</p>
      ${(this.config.consumers ?? []).map((device,index) => html`<div class="consumer">
        ${this.form([this.entity('entity','Power sensor'),{name:'name',label:'Display name',selector:{text:{}}},{name:'icon',label:'Icon',selector:{icon:{}}}], device as unknown as Record<string,unknown>, data => this.editConsumer(index,data))}
        <div class="actions"><button ?disabled=${index === 0} @click=${() => {
          const consumers = [...(this.config.consumers ?? [])];
          [consumers[index-1],consumers[index]] = [consumers[index],consumers[index-1]];
          this.updateConfig({consumers});
        }}>Move up</button><button @click=${() => this.updateConfig({consumers:this.config.consumers?.filter((_,i) => i !== index)})}>Remove</button></div>
      </div>`)}
      <ha-entity-picker .hass=${this.hass} .includeDomains=${['sensor']} label="Add a consumer" .value=${''}
        @value-changed=${(e:CustomEvent) => {
          e.stopPropagation();
          if (e.detail.value && !(this.config.consumers ?? []).some(c => c.entity === e.detail.value)) this.updateConfig({consumers:[...(this.config.consumers ?? []),{entity:e.detail.value}]});
        }}></ha-entity-picker>
      <p>Power sensors must report W or kW. A combined sensor uses positive values for grid import or battery discharge; use invert direction if necessary. Unconfigured sources count as zero.</p>
    </div>`;
  }
  static styles = css`
    .editor { display:grid;gap:16px; } details { border:1px solid var(--divider-color,#555);border-radius:12px;padding:16px; } summary { cursor:pointer;font-weight:600; } p { font-size:12px;color:var(--secondary-text-color);line-height:1.6; } .check { display:flex;align-items:center;gap:8px;margin:14px 0; } .consumer { padding:16px;border:1px solid var(--divider-color,#555);border-radius:12px; }.actions { display:flex;gap:8px;margin-top:10px; } button { font:inherit;color:var(--primary-color);background:transparent;border:1px solid var(--divider-color,#555);border-radius:6px;padding:8px 12px;cursor:pointer; } button:disabled { opacity:.4; } h3 { margin:0; }
  `;
}
customElements.define('energy-flow-card-editor',EnergyFlowEditor);
