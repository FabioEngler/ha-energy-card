import { DEFAULT_COLORS, isHexColor, pickerColor, type ColorKey } from './colors';
import { LitElement, html, css, nothing } from 'lit';
import type { CardConfig, Consumer, Hass, FlowConfig } from './power';
import { DEFAULT_ANIMATION_POWER_MAX } from './motion';

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
  private colorControl(key:ColorKey,label:string) {
    const value=this.config.colors?.[key] || DEFAULT_COLORS[key];
    const save=(input:HTMLInputElement)=>{
      const hex=input.value.trim();
      if(hex && !isHexColor(hex)) {input.setCustomValidity('Use #RGB or #RRGGBB');input.reportValidity();return;}
      input.setCustomValidity('');
      const colors={...this.config.colors};
      if(hex) colors[key]=hex;else delete colors[key];
      this.updateConfig({colors});
    };
    return html`<div class="color-row"><label for=${`hex-${key}`}>${label}</label>
      <input type="color" aria-label=${`${label} picker`} .value=${pickerColor(value)} @input=${(e:Event)=>save(e.target as HTMLInputElement)}>
      <input id=${`hex-${key}`} aria-label=${`${label} hex`} type="text" placeholder=${DEFAULT_COLORS[key]} .value=${this.config.colors?.[key] || ''}
        @input=${(e:Event)=>(e.target as HTMLInputElement).setCustomValidity('')} @change=${(e:Event)=>save(e.target as HTMLInputElement)}></div>`;
  }
  render() {
    if (!this.hass || !this.config) return nothing;
    return html`<div class="editor">
      ${this.form([{name:'title',label:'Title',selector:{text:{}}},this.entity('solar_entity','Solar production'),this.entity('battery_soc_entity','Battery state of charge',true),{name:'animation_mode',label:'Flow animation',selector:{select:{options:[{value:'auto',label:'Follow device preference'},{value:'on',label:'Always animate'},{value:'off',label:'Off'}]}}},{name:'animation_power_max',label:'Full animation at (W)',selector:{number:{min:100,max:1000000,step:100,mode:'box',unit_of_measurement:'W'}}},{name:'sort_by_power',label:'Sort consumers by current power',selector:{boolean:{}}}],{...this.config,animation_power_max:this.config.animation_power_max ?? DEFAULT_ANIMATION_POWER_MAX,animation_mode:this.config.animation === true ? 'on' : this.config.animation === false ? 'off' : 'auto'},data => {
        const { animation_mode, ...config } = data;
        const next = { ...this.config, ...config };
        if (animation_mode === 'auto') delete next.animation;
        else next.animation = animation_mode === 'on';
        this.config = next;
        this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:next},bubbles:true,composed:true}));
      })}
      <p>Follow device preference respects reduced motion. Always animate enables moving flow dots even when reduced motion is enabled on this device. Idle flows fade to a stop. Full animation at sets the power where speed, particle density, and brightness reach their limits (default: 10,000 W). Higher readings still display normally.</p>
      <details><summary>Colors</summary><p>Enter #RGB or #RRGGBB. Clear a hex field to restore its default.</p>
        ${this.colorControl('solar','Solar')}${this.colorControl('grid','Grid')}${this.colorControl('battery','Battery')}${this.colorControl('home','Home')}${this.colorControl('consumers','Consumers')}${this.colorControl('charging','Charging')}${this.colorControl('discharging','Discharging')}
      </details>
      ${this.source('grid')}${this.source('battery')}
      <h3>Consumers</h3><p>Choose individual, non-overlapping power sensors. Home consumption is calculated automatically.</p>
      ${(this.config.consumers ?? []).map((device,index) => html`<div class="consumer">
        ${this.form([this.entity('entity','Power sensor'),{name:'name',label:'Display name',selector:{text:{}}},{name:'icon',label:'Icon',selector:{icon:{}}},{name:'color',label:'Color (#RRGGBB, optional)',selector:{text:{}}}], device as unknown as Record<string,unknown>, data => this.editConsumer(index,data))}
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
    .color-row { display:grid;grid-template-columns:1fr 40px 110px;gap:8px;align-items:center;margin:10px 0; }.color-row input[type=text] { width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--divider-color,#555);border-radius:6px;background:var(--card-background-color);color:var(--primary-text-color);font:inherit; }.color-row input[type=color] { width:36px;height:36px;padding:2px;cursor:pointer; }
    .editor { display:grid;gap:16px; } details { border:1px solid var(--divider-color,#555);border-radius:12px;padding:16px; } summary { cursor:pointer;font-weight:600; } p { font-size:12px;color:var(--secondary-text-color);line-height:1.6; } .check { display:flex;align-items:center;gap:8px;margin:14px 0; } .consumer { padding:16px;border:1px solid var(--divider-color,#555);border-radius:12px; }.actions { display:flex;gap:8px;margin-top:10px; } button { font:inherit;color:var(--primary-color);background:transparent;border:1px solid var(--divider-color,#555);border-radius:6px;padding:8px 12px;cursor:pointer; } button:disabled { opacity:.4; } h3 { margin:0; }
  `;
}
customElements.define('energy-flow-card-editor',EnergyFlowEditor);
