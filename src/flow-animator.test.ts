// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { FlowAnimator } from './flow-animator';

afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
it('keeps moving after a stale WebKit intersection and resumes after returning to the foreground',()=>{
  let notify:IntersectionObserverCallback;
  const observe=vi.fn(),unobserve=vi.fn(),disconnect=vi.fn();
  vi.stubGlobal('IntersectionObserver',class {
    constructor(callback:IntersectionObserverCallback){notify=callback;}
    observe=observe;unobserve=unobserve;disconnect=disconnect;
  });
  let nextFrame=0;
  const raf=vi.fn(()=>++nextFrame),cancel=vi.fn();
  vi.stubGlobal('requestAnimationFrame',raf);vi.stubGlobal('cancelAnimationFrame',cancel);
  let hidden=false;
  vi.spyOn(document,'hidden','get').mockImplementation(()=>hidden);
  const root=document.createElementNS('http://www.w3.org/2000/svg','svg');
  root.innerHTML='<g data-flow="grid-flow"><g class="flow-particle"></g></g><circle class="junction"></circle><circle class="junction-glow"></circle>';
  let bounds=new DOMRect(0,0,300,300);
  vi.spyOn(root,'getBoundingClientRect').mockImplementation(()=>bounds);
  const animator=new FlowAnimator();animator.connect();
  try {
    animator.sync(root,{'solar-flow':0,'grid-flow':1000,'battery-flow':0,'home-flow':1000},10000,true);
    expect(observe).toHaveBeenCalledWith(root);
    expect(raf).toHaveBeenCalledTimes(1);
    // An outdated zero-intersection notification must not pause a visible SVG.
    notify!([{target:root,isIntersecting:false} as unknown as IntersectionObserverEntry],{} as IntersectionObserver);
    expect(cancel).not.toHaveBeenCalled();
    bounds=new DOMRect(0,window.innerHeight+100,300,300);
    notify!([{target:root,isIntersecting:false} as unknown as IntersectionObserverEntry],{} as IntersectionObserver);
    expect(cancel).toHaveBeenCalledWith(1);
    // iOS may return to the page before delivering a new intersection event.
    hidden=true;document.dispatchEvent(new Event('visibilitychange'));
    bounds=new DOMRect(0,0,300,300);hidden=false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(raf).toHaveBeenCalledTimes(2);
    bounds=new DOMRect(0,window.innerHeight+100,300,300);
    window.dispatchEvent(new Event('resize'));
    expect(cancel).toHaveBeenCalledWith(2);
    bounds=new DOMRect(0,0,300,300);
    window.dispatchEvent(new Event('pageshow'));
    expect(raf).toHaveBeenCalledTimes(3);
  } finally {animator.disconnect();}
  expect(cancel).toHaveBeenCalledWith(3);
  expect(disconnect).toHaveBeenCalled();
});
