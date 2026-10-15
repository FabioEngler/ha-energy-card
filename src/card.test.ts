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
    expect(rows()[0]).toContain('Offline');
    expect(rows()[2]).toContain('371 W');
    expect(card.shadowRoot!.querySelector('[role="status"]')).toBeNull();
    card.hass={states:{...states,device:{state:'100',attributes:{unit_of_measurement:'W'}}}};
    await card.updateComplete;
    expect(rows()[0]).toContain('100 W');
    expect(rows()[0]).not.toContain('Offline');
    expect(rows()[2]).toContain('271 W');
  });
  it('inherits entity icons, allows overrides, and labels small consumers accurately',async()=>{
    const card=document.createElement('energy-flow-card') as Card;
    card.setConfig({type:'custom:energy-flow-card',solar_entity:'solar',consumers:[{entity:'device'},{entity:'tiny',icon:'mdi:car-electric'}]});
    card.hass={states:{...hass.states,tiny:{state:'1',attributes:{unit_of_measurement:'W'}}}};
    document.body.append(card);await card.updateComplete;
    const rows=card.shadowRoot!.querySelectorAll('.consumer');
    expect((rows[0].querySelector('ha-state-icon') as unknown as {stateObj:unknown}).stateObj).toBe(hass.states.device);
    expect((rows[1].querySelector('ha-icon') as unknown as {icon:string}).icon).toBe('mdi:car-electric');
    expect(rows[1].textContent).toContain('<1%');
  });
  it('opens entity details on consumer and solar taps without actions on calculated values',async()=>{
    const card=document.createElement('energy-flow-card') as Card;
    card.setConfig({type:'custom:energy-flow-card',solar_entity:'solar',consumers:[{entity:'device'}]});
    card.hass=hass;document.body.append(card);await card.updateComplete;
    const entities:string[]=[];
    const events:Event[]=[];
    card.addEventListener('hass-more-info',(e:Event)=>{entities.push((e as CustomEvent).detail.entityId);events.push(e);});
    (card.shadowRoot!.querySelector('button.consumer') as HTMLElement).click();
    card.shadowRoot!.querySelector('[aria-label^="Solar:"]')!.dispatchEvent(new MouseEvent('click'));
    const home=card.shadowRoot!.querySelector('.home-node')!;
    expect(home.getAttribute('role')).toBeNull();
    home.dispatchEvent(new MouseEvent('click'));
    Array.from(card.shadowRoot!.querySelectorAll('.consumer')).at(-1)!.dispatchEvent(new MouseEvent('click'));
    expect(entities).toEqual(['device','solar']);
    expect(events.every(e=>e.bubbles && e.composed)).toBe(true);
  });
  it('opens the active separate source sensor and updates battery charging state',async()=>{
    const card=document.createElement('energy-flow-card') as Card;
    card.setConfig({type:'custom:energy-flow-card',solar_entity:'solar',grid:{import_entity:'import',export_entity:'export'},battery:{import_entity:'discharge',export_entity:'charge'},battery_soc_entity:'soc'});
    const states=Object.fromEntries(Object.entries({solar:2000,import:0,export:100,discharge:0,charge:200,soc:62}).map(([id,n])=>[id,{state:String(n),attributes:{unit_of_measurement:id==='soc'?'%':'W'}}]));
    card.hass={states};document.body.append(card);await card.updateComplete;
    const entities:string[]=[];
    card.addEventListener('hass-more-info',(e:Event)=>entities.push((e as CustomEvent).detail.entityId));
    card.shadowRoot!.querySelector('[aria-label^="Grid:"]')!.dispatchEvent(new MouseEvent('click'));
    let battery=card.shadowRoot!.querySelector('[aria-label^="Battery:"]')!;
    expect(battery.classList.contains('battery-charging')).toBe(true);
    expect((battery.querySelector('ha-icon') as unknown as {icon:string}).icon).toBe('mdi:battery-charging-60');
    battery.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}));
    expect(entities).toEqual(['export','charge']);
    card.hass={states:{...states,discharge:{state:'500',attributes:{unit_of_measurement:'W'}},charge:{state:'0',attributes:{unit_of_measurement:'W'}}}};
    await card.updateComplete;
    battery=card.shadowRoot!.querySelector('[aria-label^="Battery:"]')!;
    expect(battery.classList.contains('battery-discharging')).toBe(true);
    battery.dispatchEvent(new KeyboardEvent('keydown',{key:' '}));
    expect(entities.at(-1)).toBe('discharge');
  });
  it('represents the household source shares around the home total',async()=>{
    const card=document.createElement('energy-flow-card') as Card;
    card.setConfig({type:'custom:energy-flow-card',solar_entity:'solar',grid:{entity:'grid'},battery:{entity:'battery'}});
    card.hass={states:Object.fromEntries(Object.entries({solar:2000,grid:1000,battery:1000}).map(([id,n])=>[id,{state:String(n),attributes:{unit_of_measurement:'W'}}]))};
    document.body.append(card);await card.updateComplete;
    const segments=card.shadowRoot!.querySelectorAll('.home-ring-segment');
    expect(Array.from(segments).map(s=>s.getAttribute('stroke-dasharray'))).toEqual(['50 50','25 75','25 75']);
    expect(card.shadowRoot!.querySelector('.home-node')!.textContent).toContain('4.00 kW');
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
