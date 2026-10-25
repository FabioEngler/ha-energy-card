import {
  mdiSolarPowerVariant, mdiTransmissionTower, mdiHomeLightningBoltOutline,
  mdiBattery, mdiBatteryOutline, mdiBatteryUnknown,
  mdiBattery10, mdiBattery20, mdiBattery30, mdiBattery40, mdiBattery50,
  mdiBattery60, mdiBattery70, mdiBattery80, mdiBattery90,
  mdiBatteryChargingOutline, mdiBatteryCharging10, mdiBatteryCharging20,
  mdiBatteryCharging30, mdiBatteryCharging40, mdiBatteryCharging50,
  mdiBatteryCharging60, mdiBatteryCharging70, mdiBatteryCharging80,
  mdiBatteryCharging90, mdiBatteryCharging100, mdiHelpCircleOutline,
} from '@mdi/js';

// Diagram icons are native SVG paths. HTML/shadow DOM inside foreignObject
// can be painted at the wrong origin by iOS WebKit.
const paths: Record<string, string> = {
  'mdi:solar-power-variant': mdiSolarPowerVariant,
  'mdi:transmission-tower': mdiTransmissionTower,
  'mdi:home-lightning-bolt-outline': mdiHomeLightningBoltOutline,
  'mdi:battery': mdiBattery,
  'mdi:battery-outline': mdiBatteryOutline,
  'mdi:battery-unknown': mdiBatteryUnknown,
  'mdi:battery-10': mdiBattery10, 'mdi:battery-20': mdiBattery20,
  'mdi:battery-30': mdiBattery30, 'mdi:battery-40': mdiBattery40,
  'mdi:battery-50': mdiBattery50, 'mdi:battery-60': mdiBattery60,
  'mdi:battery-70': mdiBattery70, 'mdi:battery-80': mdiBattery80,
  'mdi:battery-90': mdiBattery90,
  'mdi:battery-charging-outline': mdiBatteryChargingOutline,
  'mdi:battery-charging-10': mdiBatteryCharging10, 'mdi:battery-charging-20': mdiBatteryCharging20,
  'mdi:battery-charging-30': mdiBatteryCharging30, 'mdi:battery-charging-40': mdiBatteryCharging40,
  'mdi:battery-charging-50': mdiBatteryCharging50, 'mdi:battery-charging-60': mdiBatteryCharging60,
  'mdi:battery-charging-70': mdiBatteryCharging70, 'mdi:battery-charging-80': mdiBatteryCharging80,
  'mdi:battery-charging-90': mdiBatteryCharging90, 'mdi:battery-charging-100': mdiBatteryCharging100,
};
export function nodeIconPath(icon: string): string { return paths[icon] ?? mdiHelpCircleOutline; }
