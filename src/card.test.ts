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
  it('shows an unavailable consumer as zero and recalculates the remainder when it recovers',async()=>{
    const card=document.createElement('energy-flow-card') as Card;
    card.setConfig({type:'custom:energy-flow-card',solar_entity:'solar',consumers:[{entity:'device',name:'Pool'},{entity:'washer',name:'Washing machine'}]});
    const states={solar:{state:'372',attributes:{unit_of_measurement:'W'}},washer:{state:'1',attributes:{unit_of_measurement:'W'}}};
    card.hass={states:{...states,device:{state:'unavailable',attributes:{unit_of_measurement:'W'}}}};
    document.body.append(card);await card.updateComplete;
    const rows=()=>Array.from(card.shadowRoot!.querySelectorAll('.consumer')).map(el=>el.textContent);
    expect(rows()[0]).toContain('0 W');
    expect(rows()[0]).toContain('0%');
    expect(rows()[2]).toContain('371 W');
    expect(card.shadowRoot!.querySelector('[role="status"]')).toBeNull();
    card.hass={states:{...states,device:{state:'100',attributes:{unit_of_measurement:'W'}}}};
    await card.updateComplete;
    expect(rows()[0]).toContain('100 W');
    expect(rows()[2]).toContain('271 W');
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
  it('saves explicit motion preferences and can restore the device default without losing sensors',async()=>{
    const editor=document.createElement('energy-flow-card-editor') as Card;
    editor.setConfig({type:'custom:energy-flow-card',solar_entity:'solar',animation:false});
    editor.hass=hass;document.body.append(editor);await editor.updateComplete;
    let changed: CardConfig | undefined;
    editor.addEventListener('config-changed',(e:Event)=>{changed=(e as CustomEvent).detail.config;});
    const form=editor.shadowRoot!.querySelector('ha-form')!;
    expect((form as unknown as {data:{animation_mode:string}}).data.animation_mode).toBe('off');
    for(const [mode,expected] of [['on',true],['off',false],['auto',undefined]] as const){
      form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{animation_mode:mode}}}));
      await editor.updateComplete;
      expect(changed?.animation).toBe(expected);
      expect(changed?.solar_entity).toBe('solar');
      expect(changed).not.toHaveProperty('animation_mode');
      if(mode==='auto') expect(changed).not.toHaveProperty('animation');
    }
  });
});
