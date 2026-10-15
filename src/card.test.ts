// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { LitElement } from 'lit';
import './energy-flow-card';
import type { CardConfig, Hass } from './power';
type Card = LitElement & {setConfig(config:CardConfig):void;hass:Hass};
const hass: Hass = {states:{solar:{state:'2500',attributes:{unit_of_measurement:'W'}},device:{state:'500',attributes:{unit_of_measurement:'W',friendly_name:'Heat pump'}}}};
afterEach(()=>document.body.replaceChildren());
describe('card and editor integration',()=>{
  it('renders calculated home power and consumer labels',async()=>{
    const card = document.createElement('energy-flow-card') as Card;
    card.setConfig({type:'custom:energy-flow-card',solar_entity:'solar',consumers:[{entity:'device'}]});
    card.hass=hass;
    document.body.append(card);
    await card.updateComplete;
    expect(card.shadowRoot!.textContent).toContain('2.50 kW');
    expect(card.shadowRoot!.textContent).toContain('Heat pump');
    expect(card.shadowRoot!.textContent).toContain('2.00 kW');
  });
  it('updates when Home Assistant sends a new state object',async()=>{
    const card=document.createElement('energy-flow-card') as Card;
    card.setConfig({type:'custom:energy-flow-card',solar_entity:'solar'});
    card.hass=hass;
    document.body.append(card);
    await card.updateComplete;
    card.hass={states:{solar:{state:'800',attributes:{unit_of_measurement:'W'}}}};
    await card.updateComplete;
    expect(card.shadowRoot!.textContent).toContain('800 W');
    expect(card.shadowRoot!.textContent).not.toContain('2.50 kW');
  });
  it('keeps configured labels as text rather than markup',async()=>{
    const card=document.createElement('energy-flow-card') as Card;
    card.setConfig({type:'custom:energy-flow-card',title:'<img src=x>',solar_entity:'solar'});
    card.hass=hass;document.body.append(card);await card.updateComplete;
    expect(card.shadowRoot!.querySelector('img')).toBeNull();
    expect(card.shadowRoot!.textContent).toContain('<img src=x>');
  });
  it('emits editor changes and permits choosing combined mode before selecting a sensor',async()=>{
    const editor=document.createElement('energy-flow-card-editor') as Card;
    editor.setConfig({type:'custom:energy-flow-card'});editor.hass=hass;document.body.append(editor);
    await editor.updateComplete;
    let changed: CardConfig | undefined;
    editor.addEventListener('config-changed',(e:Event)=>{changed=(e as CustomEvent).detail.config;});
    const checkbox=editor.shadowRoot!.querySelector('input')!;
    checkbox.checked=true;checkbox.dispatchEvent(new Event('change'));
    await editor.updateComplete;
    expect(changed?.grid).toEqual({entity:''});
    const forms=editor.shadowRoot!.querySelectorAll('details ha-form');
    const schema=(forms[0] as unknown as {schema:{name:string}[]}).schema;
    expect(schema[0].name).toBe('entity');
    forms[0].dispatchEvent(new CustomEvent('value-changed',{detail:{value:{entity:'sensor.grid',invert:true}}}));
    expect(changed?.grid).toEqual({entity:'sensor.grid',invert:true});
  });
});
