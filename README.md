# Energy Flow Card

An animated, responsive Home Assistant Lovelace card for **live power**. See solar, grid, battery, and calculated home consumption alongside a list of individual consumers. Follows your Home Assistant theme and respects reduced motion preferences.

## Features

- Animated directional flows with speed reflecting current power.
- Automatic home consumption: **solar + grid import + battery discharge − grid export − battery charge**.
- Separate import/export and charge/discharge sensors, or signed sensors with configurable direction.
- Optional battery state of charge.
- Consumer list with power, percentage, optional automatic sorting, and untracked “Other consumption”. Designed for 5–10 consumers; no hard limit.
- Estimated household solar/grid/battery source mix. Sources are allocated proportionally across the home, export, and charging loads. This is an estimate, not measured physical routing or battery provenance.
- Visual editor for sensor selection, labels, icons, ordering, animation, and sorting.
- W and kW sensors supported. Energy sensors in kWh are not supported.

## Install with HACS

The repository includes the built `dist/ha-energy-card.js` file, so HACS can install directly from the default branch without a tagged release. Tagged releases also provide the same file as a downloadable asset.

1. Open **HACS** in Home Assistant.
2. Open the three-dot menu → **Custom repositories**.
3. Add `https://github.com/FabioEngler/ha-energy-card` and choose **Dashboard** (called **Lovelace** or **Plugin** in some HACS versions).
4. Find **Energy Flow Card**, download it, and reload your browser.
5. Check **Settings → Dashboards → Resources**. HACS normally registers `/hacsfiles/ha-energy-card/ha-energy-card.js` as a **JavaScript module**. If it does not, add that resource manually. You may need Advanced Mode enabled in your Home Assistant profile to see Resources.
6. Edit a dashboard → **Add card** → search for **Energy Flow Card**. Select your sensors in the visual editor.

If the card is not listed, refresh the browser cache and confirm the resource URL loads. You can also add a Manual card with `type: custom:energy-flow-card` and switch to the visual editor.

### Publishing the first release (repository owner)

Commit and push the project to GitHub. Then create and push a tag, for example:

```sh
git tag v0.1.0
git push origin v0.1.0
```

The **Build and release** GitHub Actions workflow runs tests and builds the card, then attaches `ha-energy-card.js` to the tag's GitHub release. Confirm that the release and asset exist before selecting that release in HACS. Release creation requires GitHub Actions to be enabled with the workflow's contents-write permission.

## Sensor setup

Configure only sources you have; absent sources count as zero. A configured but unavailable, nonnumeric, or unsupported-unit sensor makes dependent totals unavailable.

- **Solar:** positive generation power.
- **Grid, separate:** positive import and export values.
- **Grid, combined:** positive means import, negative means export. Enable **Invert direction** if your sensor uses the opposite convention.
- **Battery, separate:** positive discharge and charge values. Discharge supplies the home; charge draws power from it.
- **Battery, combined:** positive means discharge, negative means charge. Inversion is supported.
- **Battery state of charge:** optional numeric percentage, 0–100.
- **Consumers:** positive consumption power. Choose non-overlapping sensors; do not include both a room total and all its devices unless you intend to double count.

Use solar and battery readings on the same electrical measurement boundary, ideally AC-side power. Hybrid inverter totals that already include battery discharge should not be combined with that discharge a second time. Inverter losses and unsynchronized updates can create temporary measurement mismatches.

The home total does not require a dedicated sensor. Other consumption is calculated home power minus the configured consumers. Negative balances are clamped to zero and flagged. Unknown consumer readings leave Other consumption unavailable. Source percentages for individual consumers are deliberately omitted.

## YAML example

All these settings are also available in the visual editor. Replace the example entity IDs with your own:

```yaml
type: custom:energy-flow-card
title: Live energy
solar_entity: sensor.solar_power
grid:
  import_entity: sensor.grid_import_power
  export_entity: sensor.grid_export_power
battery:
  import_entity: sensor.battery_discharge_power
  export_entity: sensor.battery_charge_power
battery_soc_entity: sensor.battery_soc
animation: true
sort_by_power: false
consumers:
  - entity: sensor.heat_pump_power
    name: Heat pump
    icon: mdi:heat-pump-outline
  - entity: sensor.ev_charger_power
    name: EV charger
    icon: mdi:car-electric-outline
```

For a signed grid sensor, replace the grid section with:

```yaml
grid:
  entity: sensor.grid_power
  invert: false
```

The same `entity` and `invert` options apply to `battery`. Use either combined or separate mode for each source. If both are present in YAML, the combined entity takes precedence.

## Manual installation

Run the build below, copy `dist/ha-energy-card.js` into Home Assistant's `/config/www/ha-energy-card.js`, and register `/local/ha-energy-card.js` as a JavaScript module in dashboard Resources. Do not register both manual and HACS copies simultaneously.

## Development

Use Node.js 22 or newer and npm:

```sh
npm ci
npm test
npm run build
```

`npm run dev` rebuilds the bundle on changes; copy the rebuilt bundle to your test Home Assistant instance and refresh the dashboard. No backend service, credentials, or separate runtime is required for the card. Home Assistant supplies entity updates through its `hass` property.

The build produces one self-contained ES module at `dist/ha-energy-card.js`. Commit the rebuilt bundle whenever the card changes; CI checks that the committed bundle matches the source. Tests cover power balance, units, signed sensors, missing readings, source allocation, and consumer sorting. A real Home Assistant installation is still needed to validate integration and entity selection against your sensors.
