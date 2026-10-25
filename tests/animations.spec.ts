import { test, expect, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import type { CardConfig, Hass } from '../src/power';
interface DemoWindow extends Window {
  card: HTMLElement & { hass:Hass; setConfig(config:CardConfig):void; updateComplete:Promise<unknown> };
  config: CardConfig; values:Record<string,number|string>; update():void; opened:string[];
}
let server:Server, url:string;
test.beforeAll(async()=>{
  const bundle=readFileSync('dist/ha-energy-card.js'),fixture=readFileSync('tests/fixture.html');
  server=createServer((req,res)=>{
    res.setHeader('Content-Type',req.url==='/card.js'?'text/javascript':'text/html');
    res.end(req.url==='/card.js'?bundle:fixture);
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  url=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
});
test.afterAll(async()=>{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));});
test.beforeEach(async({page})=>{
  await page.goto(url);
  await expect(page.locator('.diagram[data-motion]')).toBeVisible();
});
async function update(page:Page,patch:Record<string,number|string>) {
  await page.evaluate(async patch=>{
    const w=window as unknown as DemoWindow;Object.assign(w.values,patch);w.update();await w.card.updateComplete;
  },patch);
}
async function configure(page:Page,patch:Partial<CardConfig>) {
  await page.evaluate(async patch=>{
    const w=window as unknown as DemoWindow;Object.assign(w.config,patch);w.card.setConfig(w.config);await w.card.updateComplete;
  },patch);
}
const particles=(page:Page,id='grid-flow')=>page.locator(`[data-flow="${id}"] .flow-particle`);
async function snapshot(page:Page,id='grid-flow') {
  return particles(page,id).evaluateAll(elements=>elements.map(el=>({
    pose:el.getAttribute('transform'),opacity:Number(el.getAttribute('opacity')),
  })));
}

test('keeps particle positions across readings and eases into a power increase',async({page})=>{
  await page.waitForTimeout(1000);
  const result=await page.evaluate(async()=>{
    const w=window as unknown as DemoWindow;
    const particles=Array.from(w.card.shadowRoot!.querySelectorAll('[data-flow="grid-flow"] .flow-particle'));
    const before=particles.map(p=>p.getAttribute('transform'));
    w.values.grid=10000;w.update();await w.card.updateComplete;
    return {before,after:particles.map(p=>p.getAttribute('transform')),same:particles.every(p=>p.isConnected)};
  });
  expect(result.same).toBe(true);expect(result.after).toEqual(result.before);
  const first=await snapshot(page);
  await expect.poll(()=>snapshot(page),{timeout:5000}).not.toEqual(first);
  // Updates remain immediate; only the decorative motion is eased.
  await expect(page.getByRole('button',{name:/Grid:/})).toHaveAttribute('aria-label',/10.00 kW/);
  await page.evaluate(()=>{const w=window as unknown as DemoWindow;(window as unknown as {interval:number}).interval=setInterval(w.update,40)});
  const duringUpdates=await snapshot(page);
  await expect.poll(()=>snapshot(page),{timeout:5000}).not.toEqual(duringUpdates);
  await page.evaluate(()=>clearInterval((window as unknown as {interval:number}).interval));
});

test('bounds particle density and brightness while showing uncapped power values',async({page})=>{
  await update(page,{grid:10});await page.waitForTimeout(1800);
  const low=await snapshot(page);
  expect(low.filter(p=>p.opacity>.05).length).toBeLessThanOrEqual(3);
  await update(page,{grid:10000});await page.waitForTimeout(1800);
  const high=await snapshot(page);
  expect(high.filter(p=>p.opacity>.05).length).toBeGreaterThanOrEqual(4);
  expect(high.every(p=>p.opacity<=.95)).toBe(true);
  await update(page,{grid:20000});await page.waitForTimeout(500);
  await expect(particles(page)).toHaveCount(6);
  expect((await snapshot(page)).every(p=>p.opacity<=.95)).toBe(true);
  await expect(page.getByRole('button',{name:/Grid:/})).toHaveAttribute('aria-label',/20.00 kW/);
  await configure(page,{animation_power_max:1000});
  await update(page,{grid:1000});await page.waitForTimeout(1200);
  expect((await snapshot(page)).filter(p=>p.opacity>.05).length).toBeGreaterThanOrEqual(4);
});

test('fades before reversing and then stops gracefully at zero',async({page})=>{
  await page.waitForTimeout(1200);
  const before=await snapshot(page);
  await update(page,{solar:10000,grid:-3000});
  const immediate=await snapshot(page);
  expect(immediate.every(p=>p.pose?.includes('rotate(0)'))).toBe(true);
  expect(immediate.some(p=>p.opacity>.05)).toBe(true);
  const atReversal=await page.evaluate(()=>new Promise<number[]>(resolve=>{
    const root=(window as unknown as DemoWindow).card.shadowRoot!;
    const read=()=>{
      const elements=Array.from(root.querySelectorAll('[data-flow="grid-flow"] .flow-particle'));
      if(elements[0].getAttribute('transform')?.includes('rotate(180)')) resolve(elements.map(p=>Number(p.getAttribute('opacity'))));
      else requestAnimationFrame(read);
    };read();
  }));
  expect(Math.max(...atReversal)).toBeLessThan(.08);
  await page.waitForTimeout(900);
  expect((await snapshot(page)).some(p=>p.opacity>.2)).toBe(true);
  expect(await snapshot(page)).not.toEqual(before);
  await update(page,{grid:0});
  expect((await snapshot(page)).some(p=>p.opacity>0)).toBe(true);
  await expect.poll(async()=>Math.max(...(await snapshot(page)).map(p=>p.opacity))).toBe(0);
});

test('blends particle endpoints into a gently changing junction halo',async({page})=>{
  await page.waitForTimeout(1000);
  const halo=page.locator('.junction-glow');
  expect(Number(await halo.getAttribute('opacity'))).toBeGreaterThan(0);
  const first=await halo.getAttribute('r');await page.waitForTimeout(200);
  expect(await halo.getAttribute('r')).not.toBe(first);
  await update(page,{solar:0,grid:0,battery:0,consumer:0,pump:0});
  await expect.poll(async()=>Number(await halo.getAttribute('opacity'))).toBe(0);
});

test('smooths consumer bars for 400 ms while updating numbers immediately',async({page})=>{
  await page.waitForTimeout(500);
  const row=page.getByRole('button',{name:/Washing machine/});
  const bar=row.locator('.track > span');
  const scale=()=>bar.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);
  const before=await scale();await update(page,{consumer:2000});
  await expect(row.locator('strong')).toHaveText('2.00 kW');
  await page.waitForTimeout(100);const during=await scale();
  expect(during).toBeGreaterThan(before);expect(during).toBeLessThan(2000/4500);
  await page.waitForTimeout(400);expect(await scale()).toBeCloseTo(2000/4500,4);
});

test('follows reduced motion, supports Always animate, and pauses when off screen',async({page})=>{
  await configure(page,{animation:undefined});await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.diagram')).not.toHaveAttribute('data-motion');
  await expect(page.locator('[data-flow="grid-flow"] .flow-particles')).toBeHidden();
  await expect(page.locator('[data-flow="grid-flow"] .flow-static')).toBeVisible();
  const stopped=await snapshot(page);await page.waitForTimeout(150);expect(await snapshot(page)).toEqual(stopped);
  await configure(page,{animation:true});await expect(page.locator('.diagram')).toHaveAttribute('data-motion');
  await page.waitForTimeout(150);expect(await snapshot(page)).not.toEqual(stopped);
  await configure(page,{animation:false});
  await expect(page.locator('.diagram')).not.toHaveAttribute('data-motion');
  const off=await snapshot(page);await page.waitForTimeout(150);expect(await snapshot(page)).toEqual(off);
  await configure(page,{animation:true});
  await page.evaluate(()=>{document.body.style.paddingTop='1500px'});await page.waitForTimeout(200);
  const hidden=await snapshot(page);await page.waitForTimeout(200);expect(await snapshot(page)).toEqual(hidden);
  await page.evaluate(()=>{document.body.style.paddingTop='0'});await page.waitForTimeout(200);
  expect(await snapshot(page)).not.toEqual(hidden);
  await page.evaluate(()=>{const w=window as unknown as DemoWindow;w.card.remove()});
  const detached=await page.evaluate(()=>(window as unknown as DemoWindow).card.shadowRoot!.querySelector('.flow-particle')!.getAttribute('transform'));
  await page.waitForTimeout(150);
  expect(await page.evaluate(()=>(window as unknown as DemoWindow).card.shadowRoot!.querySelector('.flow-particle')!.getAttribute('transform'))).toBe(detached);
});

test('preserves balance grace, offline indicators, tap actions, and responsive layout',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.getByRole('button',{name:/Washing machine/}).click();
  await page.getByRole('button',{name:/Solar:/}).focus();await page.keyboard.press('Enter');
  expect(await page.evaluate(()=>(window as unknown as DemoWindow).opened)).toEqual(['consumer','solar']);
  await update(page,{consumer:'unavailable'});await expect(page.locator('.offline-badge')).toHaveText('Offline');
  await expect(page.getByRole('button',{name:/Washing machine/}).locator('strong')).toHaveText('0 W');
  await update(page,{solar:5400,grid:-5590,battery:0});
  await expect(page.locator('.home-node .value')).toHaveText('4.50 kW');
  await expect(page.locator('.home-node .sub')).toHaveText('Updating');
  await page.waitForTimeout(3200);await expect(page.locator('.warning')).toContainText('Measurements do not balance');
  await update(page,{solar:5900});await expect(page.locator('.warning')).toHaveCount(0);
  for(const width of [320,425,900]) {
    await page.setViewportSize({width,height:1000});
    const layout=await page.locator('energy-flow-card').evaluate(el=>{
      const diagram=el.shadowRoot!.querySelector('.diagram')!.getBoundingClientRect();
      const circles=Array.from(el.shadowRoot!.querySelectorAll('.node')).map(el=>{const r=el.getBoundingClientRect();return r.x+r.width/2});
      return {center:diagram.x+diagram.width/2,circles,overflow:document.documentElement.scrollWidth>innerWidth};
    });
    expect(Math.abs((layout.circles[1]+layout.circles[2])/2-layout.center)).toBeLessThan(1);
    expect(layout.overflow).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('keeps icons centered and text readable on narrow iPhone cards and after rotation',async({page})=>{
  await configure(page,{animation:false});
  await page.locator('energy-flow-card').evaluate(el=>{el.style.width='calc(100% - 16px)';el.style.margin='8px'});
  await expect(page.locator('.diagram foreignObject')).toHaveCount(0);
  for(const width of [320,390,430,844,390]) {
    await page.setViewportSize({width,height:1000});
    await expect.poll(async()=>page.locator('energy-flow-card').evaluate(el=>{
      const root=el.shadowRoot!,diagram=root.querySelector('.diagram') as SVGSVGElement;
      return Math.abs(Number(el.style.getPropertyValue('--ef-diagram-text-scale') || 1)-Math.max(1,460/diagram.getBoundingClientRect().width));
    })).toBeLessThan(.002);
    const geometry=await page.locator('energy-flow-card').evaluate(el=>{
      const root=el.shadowRoot!,diagram=root.querySelector('.diagram')!.getBoundingClientRect();
      const nodes=Array.from(root.querySelectorAll('.flow-node')).map(node=>{
        const circle=node.querySelector('.node')!.getBoundingClientRect();
        const iconElement=node.querySelector('.node-icon') as SVGSVGElement;
        const icon=iconElement.getBoundingClientRect();
        const parentMatrix=(node as SVGGraphicsElement).getScreenCTM()!;
        const iconSize=iconElement.width.baseVal.value*Math.hypot(parentMatrix.a,parentMatrix.b);
        const path=node.querySelector('.node-icon path')!.getBoundingClientRect();
        const fonts=Array.from(node.querySelectorAll<SVGTextElement>('text')).map(text=>{
          const matrix=text.getScreenCTM()!;
          const bounds=text.getBoundingClientRect();
          return {className:text.getAttribute('class'),size:parseFloat(getComputedStyle(text).fontSize)*Math.hypot(matrix.a,matrix.b),top:bounds.top,bottom:bounds.bottom};
        });
        return {circle:circle.toJSON(),icon:icon.toJSON(),iconSize,path:path.toJSON(),fonts,centerError:Math.abs(icon.x+icon.width/2-circle.x-circle.width/2)};
      });
      return {nodes,diagram:diagram.toJSON(),overflow:document.documentElement.scrollWidth>innerWidth};
    });
    expect(geometry.nodes).toHaveLength(4);
    for(const node of geometry.nodes) {
      expect(node.centerError).toBeLessThan(1);
      expect(node.iconSize).toBeGreaterThanOrEqual(23.9);
      expect(node.path.width).toBeGreaterThan(5);expect(node.path.height).toBeGreaterThan(5);
      expect(node.icon.top).toBeGreaterThanOrEqual(node.circle.top-1);
      expect(node.icon.bottom).toBeLessThan(node.circle.bottom);
      for(const font of node.fonts) {
        expect(font.size).toBeGreaterThanOrEqual(font.className?.includes('value')?14.9:11.9);
        expect(font.top).toBeGreaterThanOrEqual(geometry.diagram.top-1);
        expect(font.bottom).toBeLessThanOrEqual(geometry.diagram.bottom+1);
      }
    }
    expect(geometry.overflow).toBe(false);
    const bodyFonts=await page.locator('.legend,.hint,.row small').evaluateAll(elements=>elements.map(el=>parseFloat(getComputedStyle(el).fontSize)));
    expect(bodyFonts.every(size=>size>=12)).toBe(true);
  }
  await update(page,{battery:-300,soc:80});
  await expect(page.locator('[aria-label^="Battery:"] .node-icon')).toHaveAttribute('data-icon','mdi:battery-charging-80');
  const battery=page.getByRole('button',{name:/Battery:/});
  if(await page.evaluate(()=>navigator.maxTouchPoints>0)) await battery.tap();
  else await battery.click();
  expect(await page.evaluate(()=>(window as unknown as DemoWindow).opened.at(-1))).toBe('battery');
});
