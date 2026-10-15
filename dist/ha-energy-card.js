/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t$1=globalThis,e$2=t$1.ShadowRoot&&(void 0===t$1.ShadyCSS||t$1.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s$2=Symbol(),o$3=new WeakMap;let n$2 = class n{constructor(t,e,o){if(this._$cssResult$=true,o!==s$2)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$2&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=o$3.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o$3.set(s,t));}return t}toString(){return this.cssText}};const r$2=t=>new n$2("string"==typeof t?t:t+"",void 0,s$2),i$3=(t,...e)=>{const o=1===t.length?t[0]:e.reduce((e,s,o)=>e+(t=>{if(true===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[o+1],t[0]);return new n$2(o,t,s$2)},S$1=(s,o)=>{if(e$2)s.adoptedStyleSheets=o.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const e of o){const o=document.createElement("style"),n=t$1.litNonce;void 0!==n&&o.setAttribute("nonce",n),o.textContent=e.cssText,s.appendChild(o);}},c$2=e$2?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$2(e)})(t):t;

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:i$2,defineProperty:e$1,getOwnPropertyDescriptor:h$1,getOwnPropertyNames:r$1,getOwnPropertySymbols:o$2,getPrototypeOf:n$1}=Object,a$1=globalThis,c$1=a$1.trustedTypes,l$1=c$1?c$1.emptyScript:"",p$1=a$1.reactiveElementPolyfillSupport,d$1=(t,s)=>t,u$1={toAttribute(t,s){switch(s){case Boolean:t=t?l$1:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,s){let i=t;switch(s){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t);}catch(t){i=null;}}return i}},f$1=(t,s)=>!i$2(t,s),b$1={attribute:true,type:String,converter:u$1,reflect:false,useDefault:false,hasChanged:f$1};Symbol.metadata??=Symbol("metadata"),a$1.litPropertyMetadata??=new WeakMap;let y$1 = class y extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t);}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=b$1){if(s.state&&(s.attribute=false),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=true),this.elementProperties.set(t,s),!s.noAccessor){const i=Symbol(),h=this.getPropertyDescriptor(t,i,s);void 0!==h&&e$1(this.prototype,t,h);}}static getPropertyDescriptor(t,s,i){const{get:e,set:r}=h$1(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t;}};return {get:e,set(s){const h=e?.call(this);r?.call(this,s),this.requestUpdate(t,h,i);},configurable:true,enumerable:true}}static getPropertyOptions(t){return this.elementProperties.get(t)??b$1}static _$Ei(){if(this.hasOwnProperty(d$1("elementProperties")))return;const t=n$1(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties);}static finalize(){if(this.hasOwnProperty(d$1("finalized")))return;if(this.finalized=true,this._$Ei(),this.hasOwnProperty(d$1("properties"))){const t=this.properties,s=[...r$1(t),...o$2(t)];for(const i of s)this.createProperty(i,t[i]);}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,i]of s)this.elementProperties.set(t,i);}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);void 0!==i&&this._$Eh.set(i,t);}this.elementStyles=this.finalizeStyles(this.styles);}static finalizeStyles(s){const i=[];if(Array.isArray(s)){const e=new Set(s.flat(1/0).reverse());for(const s of e)i.unshift(c$2(s));}else void 0!==s&&i.push(c$2(s));return i}static _$Eu(t,s){const i=s.attribute;return  false===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=false,this.hasUpdated=false,this._$Em=null,this._$Ev();}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this));}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.();}removeController(t){this._$EO?.delete(t);}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const i of s.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t);}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return S$1(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(true),this._$EO?.forEach(t=>t.hostConnected?.());}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.());}attributeChangedCallback(t,s,i){this._$AK(t,i);}_$ET(t,s){const i=this.constructor.elementProperties.get(t),e=this.constructor._$Eu(t,i);if(void 0!==e&&true===i.reflect){const h=(void 0!==i.converter?.toAttribute?i.converter:u$1).toAttribute(s,i.type);this._$Em=t,null==h?this.removeAttribute(e):this.setAttribute(e,h),this._$Em=null;}}_$AK(t,s){const i=this.constructor,e=i._$Eh.get(t);if(void 0!==e&&this._$Em!==e){const t=i.getPropertyOptions(e),h="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:u$1;this._$Em=e;const r=h.fromAttribute(s,t.type);this[e]=r??this._$Ej?.get(e)??r,this._$Em=null;}}requestUpdate(t,s,i,e=false,h){if(void 0!==t){const r=this.constructor;if(false===e&&(h=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??f$1)(h,s)||i.useDefault&&i.reflect&&h===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,s,i);} false===this.isUpdatePending&&(this._$ES=this._$EP());}C(t,s,{useDefault:i,reflect:e,wrapped:h},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??s??this[t]),true!==h||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(s=void 0),this._$AL.set(t,s)),true===e&&this._$Em!==t&&(this._$Eq??=new Set).add(t));}async _$EP(){this.isUpdatePending=true;try{await this._$ES;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0;}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,i]of t){const{wrapped:t}=i,e=this[s];true!==t||this._$AL.has(s)||void 0===e||this.C(s,void 0,i,e);}}let t=false;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(s)):this._$EM();}catch(s){throw t=false,this._$EM(),s}t&&this._$AE(s);}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=true,this.firstUpdated(t)),this.updated(t);}_$EM(){this._$AL=new Map,this.isUpdatePending=false;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return  true}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM();}updated(t){}firstUpdated(t){}};y$1.elementStyles=[],y$1.shadowRootOptions={mode:"open"},y$1[d$1("elementProperties")]=new Map,y$1[d$1("finalized")]=new Map,p$1?.({ReactiveElement:y$1}),(a$1.reactiveElementVersions??=[]).push("2.1.2");

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,i$1=t=>t,s$1=t.trustedTypes,e=s$1?s$1.createPolicy("lit-html",{createHTML:t=>t}):void 0,h="$lit$",o$1=`lit$${Math.random().toFixed(9).slice(2)}$`,n="?"+o$1,r=`<${n}>`,l=document,c=()=>l.createComment(""),a=t=>null===t||"object"!=typeof t&&"function"!=typeof t,u=Array.isArray,d=t=>u(t)||"function"==typeof t?.[Symbol.iterator],f="[ \t\n\f\r]",v=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,_=/-->/g,m=/>/g,p=RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),g=/'/g,$=/"/g,y=/^(?:script|style|textarea|title)$/i,x=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),b=x(1),w=x(2),E=Symbol.for("lit-noChange"),A=Symbol.for("lit-nothing"),C=new WeakMap,P=l.createTreeWalker(l,129);function V(t,i){if(!u(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==e?e.createHTML(i):i}const N=(t,i)=>{const s=t.length-1,e=[];let n,l=2===i?"<svg>":3===i?"<math>":"",c=v;for(let i=0;i<s;i++){const s=t[i];let a,u,d=-1,f=0;for(;f<s.length&&(c.lastIndex=f,u=c.exec(s),null!==u);)f=c.lastIndex,c===v?"!--"===u[1]?c=_:void 0!==u[1]?c=m:void 0!==u[2]?(y.test(u[2])&&(n=RegExp("</"+u[2],"g")),c=p):void 0!==u[3]&&(c=p):c===p?">"===u[0]?(c=n??v,d=-1):void 0===u[1]?d=-2:(d=c.lastIndex-u[2].length,a=u[1],c=void 0===u[3]?p:'"'===u[3]?$:g):c===$||c===g?c=p:c===_||c===m?c=v:(c=p,n=void 0);const x=c===p&&t[i+1].startsWith("/>")?" ":"";l+=c===v?s+r:d>=0?(e.push(a),s.slice(0,d)+h+s.slice(d)+o$1+x):s+o$1+(-2===d?i:x);}return [V(t,l+(t[s]||"<?>")+(2===i?"</svg>":3===i?"</math>":"")),e]};class S{constructor({strings:t,_$litType$:i},e){let r;this.parts=[];let l=0,a=0;const u=t.length-1,d=this.parts,[f,v]=N(t,i);if(this.el=S.createElement(f,e),P.currentNode=this.el.content,2===i||3===i){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes);}for(;null!==(r=P.nextNode())&&d.length<u;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(h)){const i=v[a++],s=r.getAttribute(t).split(o$1),e=/([.?@])?(.*)/.exec(i);d.push({type:1,index:l,name:e[2],strings:s,ctor:"."===e[1]?I:"?"===e[1]?L:"@"===e[1]?z:H}),r.removeAttribute(t);}else t.startsWith(o$1)&&(d.push({type:6,index:l}),r.removeAttribute(t));if(y.test(r.tagName)){const t=r.textContent.split(o$1),i=t.length-1;if(i>0){r.textContent=s$1?s$1.emptyScript:"";for(let s=0;s<i;s++)r.append(t[s],c()),P.nextNode(),d.push({type:2,index:++l});r.append(t[i],c());}}}else if(8===r.nodeType)if(r.data===n)d.push({type:2,index:l});else {let t=-1;for(;-1!==(t=r.data.indexOf(o$1,t+1));)d.push({type:7,index:l}),t+=o$1.length-1;}l++;}}static createElement(t,i){const s=l.createElement("template");return s.innerHTML=t,s}}function M(t,i,s=t,e){if(i===E)return i;let h=void 0!==e?s._$Co?.[e]:s._$Cl;const o=a(i)?void 0:i._$litDirective$;return h?.constructor!==o&&(h?._$AO?.(false),void 0===o?h=void 0:(h=new o(t),h._$AT(t,s,e)),void 0!==e?(s._$Co??=[])[e]=h:s._$Cl=h),void 0!==h&&(i=M(t,h._$AS(t,i.values),h,e)),i}class R{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:s}=this._$AD,e=(t?.creationScope??l).importNode(i,true);P.currentNode=e;let h=P.nextNode(),o=0,n=0,r=s[0];for(;void 0!==r;){if(o===r.index){let i;2===r.type?i=new k(h,h.nextSibling,this,t):1===r.type?i=new r.ctor(h,r.name,r.strings,this,t):6===r.type&&(i=new Z(h,this,t)),this._$AV.push(i),r=s[++n];}o!==r?.index&&(h=P.nextNode(),o++);}return P.currentNode=l,e}p(t){let i=0;for(const s of this._$AV) void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}}class k{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,s,e){this.type=2,this._$AH=A,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cv=e?.isConnected??true;}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=M(this,t,i),a(t)?t===A||null==t||""===t?(this._$AH!==A&&this._$AR(),this._$AH=A):t!==this._$AH&&t!==E&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):d(t)?this.k(t):this._(t);}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t));}_(t){this._$AH!==A&&a(this._$AH)?this._$AA.nextSibling.data=t:this.T(l.createTextNode(t)),this._$AH=t;}$(t){const{values:i,_$litType$:s}=t,e="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=S.createElement(V(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===e)this._$AH.p(i);else {const t=new R(e,this),s=t.u(this.options);t.p(i),this.T(s),this._$AH=t;}}_$AC(t){let i=C.get(t.strings);return void 0===i&&C.set(t.strings,i=new S(t)),i}k(t){u(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const h of t)e===i.length?i.push(s=new k(this.O(c()),this.O(c()),this,this.options)):s=i[e],s._$AI(h),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,s){for(this._$AP?.(false,true,s);t!==this._$AB;){const s=i$1(t).nextSibling;i$1(t).remove(),t=s;}}setConnected(t){ void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t));}}class H{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,s,e,h){this.type=1,this._$AH=A,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=h,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=A;}_$AI(t,i=this,s,e){const h=this.strings;let o=false;if(void 0===h)t=M(this,t,i,0),o=!a(t)||t!==this._$AH&&t!==E,o&&(this._$AH=t);else {const e=t;let n,r;for(t=h[0],n=0;n<h.length-1;n++)r=M(this,e[s+n],i,n),r===E&&(r=this._$AH[n]),o||=!a(r)||r!==this._$AH[n],r===A?t=A:t!==A&&(t+=(r??"")+h[n+1]),this._$AH[n]=r;}o&&!e&&this.j(t);}j(t){t===A?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"");}}class I extends H{constructor(){super(...arguments),this.type=3;}j(t){this.element[this.name]=t===A?void 0:t;}}class L extends H{constructor(){super(...arguments),this.type=4;}j(t){this.element.toggleAttribute(this.name,!!t&&t!==A);}}class z extends H{constructor(t,i,s,e,h){super(t,i,s,e,h),this.type=5;}_$AI(t,i=this){if((t=M(this,t,i,0)??A)===E)return;const s=this._$AH,e=t===A&&s!==A||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,h=t!==A&&(s===A||e);e&&this.element.removeEventListener(this.name,this,s),h&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t);}}class Z{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){M(this,t);}}const B=t.litHtmlPolyfillSupport;B?.(S,k),(t.litHtmlVersions??=[]).push("3.3.3");const D=(t,i,s)=>{const e=s?.renderBefore??i;let h=e._$litPart$;if(void 0===h){const t=s?.renderBefore??null;e._$litPart$=h=new k(i.insertBefore(c(),t),t,void 0,s??{});}return h._$AI(t),h};

/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const s=globalThis;class i extends y$1{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0;}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const r=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=D(r,this.renderRoot,this.renderOptions);}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(true);}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(false);}render(){return E}}i._$litElement$=true,i["finalized"]=true,s.litElementHydrateSupport?.({LitElement:i});const o=s.litElementPolyfillSupport;o?.({LitElement:i});(s.litElementVersions??=[]).push("4.2.2");

// All calculations use watts. Invalid or non-power entities remain unknown, never zero.
function watts(hass, entity) {
    if (!entity)
        return 0;
    const s = hass.states[entity];
    if (!s || !s.state.trim() || !Number.isFinite(Number(s.state)))
        return null;
    const unit = s.attributes.unit_of_measurement;
    if (unit !== 'W' && unit !== 'kW')
        return null;
    return Number(s.state) * (unit === 'kW' ? 1000 : 1);
}
function flow(hass, config) {
    if (config?.entity) {
        const raw = watts(hass, config.entity);
        if (raw === null)
            return null;
        const n = raw * (config.invert ? -1 : 1);
        return { incoming: Math.max(0, n), outgoing: Math.max(0, -n) };
    }
    const incoming = watts(hass, config?.import_entity);
    const outgoing = watts(hass, config?.export_entity);
    if (incoming === null || outgoing === null)
        return null;
    return { incoming: Math.max(0, incoming), outgoing: Math.max(0, outgoing) };
}
function calculate(hass, config) {
    const solarValue = watts(hass, config.solar_entity);
    const solar = solarValue === null ? null : Math.max(0, solarValue);
    const grid = flow(hass, config.grid);
    // Battery incoming means discharge into the home; outgoing means charging.
    const battery = flow(hass, config.battery);
    const balance = solar === null || !grid || !battery ? null : solar + grid.incoming + battery.incoming - grid.outgoing - battery.outgoing;
    const home = balance === null ? null : Math.max(0, balance);
    let consumers = (config.consumers ?? []).map(c => ({ ...c, power: watts(hass, c.entity) }));
    if (config.sort_by_power)
        consumers = [...consumers].sort((a, b) => (b.power ?? -Infinity) - (a.power ?? -Infinity));
    const known = consumers.every(c => c.power !== null);
    const measured = consumers.reduce((sum, c) => sum + Math.max(0, c.power ?? 0), 0);
    const other = home === null || !known ? null : Math.max(0, home - measured);
    const mismatch = balance !== null && (balance < -1 || (known && measured > balance + 1));
    const supply = (solar ?? 0) + (grid?.incoming ?? 0) + (battery?.incoming ?? 0);
    // Proportional allocation: the same source mix feeds home, charging, and export.
    const sources = home === null ? [] : [
        { name: 'Solar', color: 'var(--ef-solar)', power: supply ? home * (solar ?? 0) / supply : 0 },
        { name: 'Grid', color: 'var(--ef-grid)', power: supply ? home * (grid?.incoming ?? 0) / supply : 0 },
        { name: 'Battery', color: 'var(--ef-battery)', power: supply ? home * (battery?.incoming ?? 0) / supply : 0 }
    ];
    return { solar, grid, battery, home, consumers, other, mismatch, sources };
}
function formatPower(n) {
    return n === null ? 'Unavailable' : Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(2)} kW` : `${Math.round(n)} W`;
}

class EnergyFlowEditor extends i {
    static { this.properties = { hass: { attribute: false }, config: { state: true } }; }
    setConfig(config) { this.config = { ...config }; }
    updateConfig(patch) {
        this.config = { ...this.config, ...patch };
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
    }
    form(schema, data, change) {
        return b `<ha-form .hass=${this.hass} .schema=${schema} .data=${data}
      .computeLabel=${(s) => s.label || s.name}
      @value-changed=${(e) => { e.stopPropagation(); change(e.detail.value); }}></ha-form>`;
    }
    entity(name, label, soc = false) {
        return { name, label, selector: { entity: { domain: 'sensor', device_class: soc ? 'battery' : 'power' } } };
    }
    source(key) {
        const v = this.config[key] ?? {};
        const combined = Object.hasOwn(v, 'entity');
        const battery = key === 'battery';
        return b `<details open><summary>${battery ? 'Battery' : 'Grid'}</summary>
      <p>${battery ? 'Discharge supplies the home; charge draws power from it.' : 'Import supplies the home; export sends power to the grid.'}</p>
      <label class="check"><input type="checkbox" .checked=${combined} @change=${(e) => {
            const checked = e.target.checked;
            // Preserve the chosen sensor mode before an entity is selected.
            this.updateConfig({ [key]: checked ? { entity: '' } : {} });
        }}>One signed sensor</label>
      ${this.form(combined ? [this.entity('entity', 'Signed power sensor'), { name: 'invert', label: 'Invert direction (default: positive = import / discharge)', selector: { boolean: {} } }] : [this.entity('import_entity', battery ? 'Discharge power' : 'Grid import'), this.entity('export_entity', battery ? 'Charge power' : 'Grid export')], v, (data) => this.updateConfig({ [key]: data }))}
    </details>`;
    }
    editConsumer(index, patch) {
        const consumers = [...(this.config.consumers ?? [])];
        consumers[index] = { ...consumers[index], ...patch };
        this.updateConfig({ consumers });
    }
    render() {
        if (!this.hass || !this.config)
            return A;
        return b `<div class="editor">
      ${this.form([{ name: 'title', label: 'Title', selector: { text: {} } }, this.entity('solar_entity', 'Solar production'), this.entity('battery_soc_entity', 'Battery state of charge', true), { name: 'animation', label: 'Animate power flows', selector: { boolean: {} } }, { name: 'sort_by_power', label: 'Sort consumers by current power', selector: { boolean: {} } }], { animation: true, ...this.config }, data => this.updateConfig(data))}
      ${this.source('grid')}${this.source('battery')}
      <h3>Consumers</h3><p>Choose individual, non-overlapping power sensors. Home consumption is calculated automatically.</p>
      ${(this.config.consumers ?? []).map((device, index) => b `<div class="consumer">
        ${this.form([this.entity('entity', 'Power sensor'), { name: 'name', label: 'Display name', selector: { text: {} } }, { name: 'icon', label: 'Icon', selector: { icon: {} } }], device, data => this.editConsumer(index, data))}
        <div class="actions"><button ?disabled=${index === 0} @click=${() => {
            const consumers = [...(this.config.consumers ?? [])];
            [consumers[index - 1], consumers[index]] = [consumers[index], consumers[index - 1]];
            this.updateConfig({ consumers });
        }}>Move up</button><button @click=${() => this.updateConfig({ consumers: this.config.consumers?.filter((_, i) => i !== index) })}>Remove</button></div>
      </div>`)}
      <ha-entity-picker .hass=${this.hass} .includeDomains=${['sensor']} label="Add a consumer" .value=${''}
        @value-changed=${(e) => {
            e.stopPropagation();
            if (e.detail.value && !(this.config.consumers ?? []).some(c => c.entity === e.detail.value))
                this.updateConfig({ consumers: [...(this.config.consumers ?? []), { entity: e.detail.value }] });
        }}></ha-entity-picker>
      <p>Power sensors must report W or kW. A combined sensor uses positive values for grid import or battery discharge; use invert direction if necessary. Unconfigured sources count as zero.</p>
    </div>`;
    }
    static { this.styles = i$3 `
    .editor { display:grid;gap:16px; } details { border:1px solid var(--divider-color,#555);border-radius:12px;padding:16px; } summary { cursor:pointer;font-weight:600; } p { font-size:12px;color:var(--secondary-text-color);line-height:1.6; } .check { display:flex;align-items:center;gap:8px;margin:14px 0; } .consumer { padding:16px;border:1px solid var(--divider-color,#555);border-radius:12px; }.actions { display:flex;gap:8px;margin-top:10px; } button { font:inherit;color:var(--primary-color);background:transparent;border:1px solid var(--divider-color,#555);border-radius:6px;padding:8px 12px;cursor:pointer; } button:disabled { opacity:.4; } h3 { margin:0; }
  `; }
}
customElements.define('energy-flow-card-editor', EnergyFlowEditor);

class EnergyFlowCard extends i {
    static { this.properties = { hass: { attribute: false }, config: { state: true } }; }
    static getConfigElement() { return document.createElement('energy-flow-card-editor'); }
    static getStubConfig() { return { type: 'custom:energy-flow-card', title: 'Live energy', consumers: [], animation: true }; }
    setConfig(config) {
        if (!config || typeof config !== 'object')
            throw new Error('A card configuration is required');
        if (config.consumers && (!Array.isArray(config.consumers) || config.consumers.some(c => !c.entity)))
            throw new Error('Each consumer needs an entity');
        this.config = { ...config, consumers: config.consumers ?? [] };
    }
    getCardSize() { return 5 + (this.config?.consumers?.length ?? 0); }
    connection(id, path, power, color) {
        const active = power !== null && Math.abs(power) > 1;
        const reverse = (power ?? 0) < 0;
        const duration = Math.max(1.2, 5 - Math.log10(Math.abs(power ?? 0) + 1));
        return w `<path d=${path} class="wire" stroke=${color}/>
      ${active ? w `<path id=${id} d=${path} class="current" stroke=${color} style=${`animation-duration:${duration}s;animation-direction:${reverse ? 'reverse' : 'normal'};animation-play-state:${this.config.animation === false ? 'paused' : 'running'}`}/>` : A}`;
    }
    node(x, y, icon, label, value, color, sub) {
        return w `<g transform=${`translate(${x},${y})`}>
      <circle r="43" class="node" stroke=${color}/>
      <foreignObject x="-15" y="-32" width="30" height="28"><ha-icon style="--mdc-icon-size:24px" .icon=${icon}></ha-icon></foreignObject>
      <text y="12" class="value">${value}</text>
      <text y="28" class="sub">${sub ?? label}</text>
      <text y="62" class="label">${label}</text>
    </g>`;
    }
    render() {
        if (!this.hass || !this.config)
            return A;
        const c = this.config;
        const m = calculate(this.hass, c);
        const configured = Boolean(c.solar_entity || c.grid?.entity || c.grid?.import_entity || c.grid?.export_entity || c.battery?.entity || c.battery?.import_entity || c.battery?.export_entity);
        if (!configured)
            return b `<ha-card><div class="empty">Select your solar, grid, and battery sensors in the visual editor to get started.</div></ha-card>`;
        const batteryPresent = Boolean(c.battery?.entity || c.battery?.import_entity || c.battery?.export_entity);
        const socState = c.battery_soc_entity ? this.hass.states[c.battery_soc_entity] : undefined;
        const soc = socState && socState.state.trim() && Number.isFinite(Number(socState.state)) && Number(socState.state) >= 0 && Number(socState.state) <= 100 ? `${Math.round(Number(socState.state))}%` : undefined;
        const gridNet = m.grid ? m.grid.incoming - m.grid.outgoing : null;
        const batteryNet = m.battery ? m.battery.incoming - m.battery.outgoing : null;
        return b `<ha-card>
      <header><div><span class="eyebrow">POWER FLOW</span><h2>${c.title || 'Live energy'}</h2></div><span class="live"><i></i> Live</span></header>
      <svg class="diagram" viewBox="0 0 460 365" role="img" aria-label="Live power flow: solar and grid supply the home; battery charges or discharges">
        ${this.connection('solar-flow', 'M230 108 L230 146 Q230 166 253 166 L317 166', m.solar, 'var(--ef-solar)')}
        ${this.connection('grid-flow', 'M105 166 L317 166', gridNet, 'var(--ef-grid)')}
        ${batteryPresent ? this.connection('battery-flow', 'M230 244 L230 190 Q230 166 253 166 L317 166', batteryNet, 'var(--ef-battery)') : A}
        ${this.node(230, 65, 'mdi:solar-power-variant', 'Solar', formatPower(m.solar), 'var(--ef-solar)')}
        ${this.node(62, 166, 'mdi:transmission-tower', 'Grid', formatPower(gridNet === null ? null : Math.abs(gridNet)), 'var(--ef-grid)', gridNet === null ? 'Unavailable' : gridNet < 0 ? 'Exporting' : gridNet > 0 ? 'Importing' : 'Idle')}
        ${this.node(360, 166, 'mdi:home-lightning-bolt-outline', 'Home', formatPower(m.home), 'var(--ef-home)')}
        ${batteryPresent ? this.node(230, 287, 'mdi:battery-outline', 'Battery', formatPower(batteryNet === null ? null : Math.abs(batteryNet)), 'var(--ef-battery)', `${soc ? soc + ' · ' : ''}${batteryNet === null ? 'Unavailable' : batteryNet < 0 ? 'Charging' : batteryNet > 0 ? 'Discharging' : 'Idle'}`) : A}
      </svg>
      <section class="mix" aria-label="Estimated household power sources">
        <div class="section-title">Home power sources <span>Estimated mix</span></div>
        <div class="mix-bar">${m.sources.map(s => b `<div style=${`width:${m.home ? s.power / m.home * 100 : 0}%;background:${s.color}`} title=${`${s.name}: ${formatPower(s.power)}`}></div>`)}</div>
        <div class="legend">${m.sources.map(s => b `<span><i style=${`background:${s.color}`}></i>${s.name} <b>${formatPower(s.power)}</b></span>`)}</div>
        <p class="hint">Sources allocated proportionally after export and battery charging.</p>
      </section>
      <section class="consumers">
        <div class="section-title">Consumers <span>${m.consumers.length} devices</span></div>
        ${m.consumers.map(device => this.consumer(device.name || String(this.hass.states[device.entity]?.attributes.friendly_name || device.entity), device.icon || 'mdi:power-plug-outline', device.power, m.home))}
        ${this.consumer('Other consumption', 'mdi:dots-horizontal', m.other, m.home)}
        ${m.mismatch ? b `<p class="warning" role="status">Measurements do not balance. Check sensor directions, overlapping consumers, and update timing.</p>` : A}
        ${m.home === null || m.consumers.some(d => d.power === null) ? b `<p class="warning" role="status">Some sensors are unavailable or do not report W/kW. Totals that depend on them are unavailable.</p>` : A}
      </section>
    </ha-card>`;
    }
    consumer(name, icon, power, home) {
        const share = power !== null && home !== null && home > 0 ? Math.max(0, power) / home * 100 : null;
        return b `<div class="consumer"><ha-icon .icon=${icon}></ha-icon><div class="device"><div class="row"><span>${name}</span><strong>${formatPower(power)}</strong></div><div class="row"><div class="track"><div style=${`width:${Math.min(100, share ?? 0)}%`}></div></div><small>${share === null ? '—' : `${Math.round(share)}%`}</small></div></div></div>`;
    }
    static { this.styles = i$3 `
    :host { --ef-solar:#f6bd4f;--ef-grid:#a99af7;--ef-battery:#53d4bd;--ef-home:#68b7ff;display:block; }
    ha-card { overflow:hidden;background:var(--ha-card-background,var(--card-background-color,#191c24));color:var(--primary-text-color,#eee);border-radius:24px; }
    header { display:flex;align-items:center;justify-content:space-between;padding:24px 24px 0; }
    .eyebrow { font-size:10px;letter-spacing:2px;color:var(--secondary-text-color); } h2 { margin:5px 0;font-size:22px;font-weight:600; }
    .live { font-size:12px;color:var(--secondary-text-color);display:flex;gap:7px;align-items:center; }.live i { width:6px;height:6px;background:var(--ef-battery);border-radius:50%; }
    .diagram { width:100%;display:block;overflow:visible;margin:0 auto 25px;max-width:540px; }
    .node { fill:var(--ha-card-background,var(--card-background-color,#191c24));stroke-width:2; }
    text { fill:var(--primary-text-color,#eee);text-anchor:middle;font-family:inherit; }.value { font-size:13px;font-weight:600; }.sub { font-size:9px;fill:var(--secondary-text-color,#aaa); }.label { font-size:12px;fill:var(--secondary-text-color,#aaa); }
    foreignObject { color:var(--primary-text-color,#eee); }.wire { fill:none;stroke-width:1.5;opacity:.22; }.current { fill:none;stroke-width:3;stroke-linecap:round;stroke-dasharray:2 20;animation:flow linear infinite; }
    @keyframes flow { to { stroke-dashoffset:-44; } }
    section { padding:0 24px 20px; }.section-title { display:flex;justify-content:space-between;gap:8px;font-size:13px;font-weight:600;margin-bottom:14px; }.section-title span { font-size:11px;font-weight:400;color:var(--secondary-text-color); }
    .mix-bar { height:8px;display:flex;overflow:hidden;border-radius:8px;background:var(--divider-color,#333); }.mix-bar div { transition:width .5s; }
    .legend { display:flex;flex-wrap:wrap;gap:12px;margin-top:12px;font-size:11px; }.legend span { display:flex;align-items:center;gap:5px; }.legend i { width:6px;height:6px;border-radius:50%; }.legend b { font-weight:500; }
    .hint { font-size:10px;color:var(--secondary-text-color);margin:9px 0 0; }.consumers { border-top:1px solid var(--divider-color,#333);padding-top:20px; }
    .consumer { display:flex;gap:12px;align-items:center;margin:17px 0; }.consumer ha-icon { color:var(--secondary-text-color);--mdc-icon-size:22px; }.device { flex:1;min-width:0; }.row { display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px; }.row span { overflow-wrap:anywhere; }.row strong { white-space:nowrap;font-size:13px;font-weight:500; }.row small { width:35px;text-align:right;color:var(--secondary-text-color);font-size:10px; }
    .track { flex:1;height:4px;border-radius:4px;background:var(--divider-color,#333);margin-top:6px;overflow:hidden; }.track div { height:100%;background:var(--ef-home);border-radius:4px;transition:width .5s; }
    .warning { font-size:12px;color:var(--warning-color,#e7ac55);line-height:1.5; }.empty { padding:24px;line-height:1.6; }
    @media (prefers-reduced-motion:reduce) { .current { animation:none!important; } * { transition:none!important; } }
    @media (max-width:360px) { header { padding:18px 16px 0; } section { padding-left:16px;padding-right:16px; }.legend { gap:8px; } }
  `; }
}
customElements.define('energy-flow-card', EnergyFlowCard);
const registry = window;
registry.customCards = registry.customCards || [];
registry.customCards.push({ type: 'energy-flow-card', name: 'Energy Flow Card', description: 'Animated live power flow with a detailed consumer breakdown.', preview: true });
