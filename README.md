# Energy Flow Card

An animated, responsive Home Assistant Lovelace card for **live power**. See solar, grid, battery, and calculated home consumption alongside a list of individual consumers. Follows your Home Assistant theme and, by default, your device's reduced motion preference.

## Features

- Glowing directional particles with short trails, smooth speed changes, and power-driven density and brightness. Streams fade into the junction, and slow down and fade before stopping or reversing.
- Automatic home consumption: **solar + grid import + battery discharge − grid export − battery charge**.
- Separate import/export and charge/discharge sensors, or signed sensors with configurable direction.
- Larger home total with a segmented ring showing the estimated solar/grid/battery mix.
- iPhone/Safari-compatible native SVG diagram icons and readable text sizes that stay consistent on narrow cards and after rotation.
- Battery state of charge and a charge-level icon, glowing green when charging and red when discharging.
- Consumer list with power, percentage, optional automatic sorting, and untracked “Other consumption”. Designed for 5–10 consumers; no hard limit.
- Estimated household solar/grid/battery source mix. Sources are allocated proportionally across the home, export, and charging loads. This is an estimate, not measured physical routing or battery provenance.
- Visual editor for sensor selection, labels, icons, ordering, animation, and sorting.
- Consumer entity icons, clearer power values, small shares displayed as `<1%`, and offline badges. Offline consumers still count as 0 W.
- Tap a consumer or source to open Home Assistant's entity details. Source nodes also support Enter and Space for keyboard access.
- W and kW sensors supported. Energy sensors in kWh are not supported.

## Install with HACS

Install the latest versioned release for normal HACS update notifications. Each release includes the built `ha-energy-card.js` asset. The repository also includes `dist/ha-energy-card.js` for development installs from `main`.

1. Open **HACS** in Home Assistant.
2. Open the three-dot menu → **Custom repositories**.
3. Add `https://github.com/FabioEngler/ha-energy-card` and choose **Dashboard** (called **Lovelace** or **Plugin** in some HACS versions).
4. Find **Energy Flow Card**, download the latest release, and reload your browser.
5. Check **Settings → Dashboards → Resources**. HACS normally registers `/hacsfiles/ha-energy-card/ha-energy-card.js` as a **JavaScript module**. If it does not, add that resource manually. You may need Advanced Mode enabled in your Home Assistant profile to see Resources.
6. Edit a dashboard → **Add card** → search for **Energy Flow Card**. Select your sensors in the visual editor.

If the card is not listed, refresh the browser cache and confirm the resource URL loads. You can also add a Manual card with `type: custom:energy-flow-card` and switch to the visual editor.

### Updating and animation settings

HACS offers updates when a newer release is available. If you previously installed `main`, open Energy Flow Card in HACS, choose **Redownload**, and select the latest version (starting with **v0.2.0**) to switch to versioned releases. Refresh the Home Assistant browser or companion app afterward. If an older version remains visible, clear the frontend cache and reload. Development changes can still be installed by selecting `main` instead of a release.

In the visual editor, **Flow animation** offers **Follow device preference**, **Always animate**, and **Off**. The default follows your device's reduced motion preference. Choose **Always animate** to enable moving dots even on devices with reduced motion enabled. Particles move continuously without waiting for sensor updates; their direction follows import/export and charge/discharge. Speed eases toward new readings over roughly 1–2 seconds. Zero or unavailable flows slow down and fade out. With motion disabled, static arrows indicate direction instead. Consumer bars ease to new proportions over 400 ms while numeric readings update immediately.

In YAML, `animation: true` always animates, `animation: false` disables motion, and omitting `animation` follows the device preference.

**Full animation at (W)** sets the power ceiling for visual intensity, defaulting to **10,000 W per connection**. A logarithmic scale makes low and medium loads distinguishable, then caps at **six particles per connection**, **48 SVG units/second**, and **95% particle opacity**, with a fixed glow size. Above the ceiling, the visuals remain at those limits while actual power readings continue to display normally. Lower the setting for a smaller installation or raise it for larger loads. YAML uses `animation_power_max: 10000`.

Each card uses one animation loop and pauses it when the card is off screen, the browser tab is hidden, motion is disabled, or all streams have stopped. Particle positions survive sensor updates and power-ceiling changes. Consumer rows retain their bars when sorting changes.

### Publishing releases (repository owner)

Update the package version, run tests, rebuild, and commit the source and bundle together. Then push a matching tag. For example, to publish v0.2.0:

```sh
git tag v0.2.0
git push origin v0.2.0
```

The **Build and release** GitHub Actions workflow checks the version against the tag, runs tests, rebuilds the card, and checks the committed bundle before attaching `ha-energy-card.js` to a published GitHub release. Confirm that the release and asset exist before selecting that release in HACS. Release creation requires GitHub Actions to be enabled with the workflow's contents-write permission.

## Interactions and status

Tap a consumer to open its entity's native Home Assistant more-info dialog, including when it is offline. Consumer icons follow the entity's Home Assistant icon unless overridden in the visual editor.

Solar opens its production entity. Grid and battery open the combined sensor, or the sensor for the current direction when separate sensors are configured: import/export for grid and discharge/charge for battery. At idle, the first configured power sensor is used. Home and Other consumption are calculated values and do not open an entity dialog.

Battery icons follow state of charge when configured. Charging above 1 W glows green; discharging above 1 W glows red. Idle or unavailable batteries have no glow. Offline consumer badges indicate that no usable reading is available; the row and totals continue to use 0 W until readings recover.

## Sensor setup

Configure only sources you have; absent sources count as zero. A configured but unavailable, nonnumeric, or unsupported-unit source sensor makes dependent totals unavailable. Consumer readings that are unavailable, unknown, missing, or invalid are treated as 0 W.

- **Solar:** positive generation power.
- **Grid, separate:** positive import and export values.
- **Grid, combined:** positive means import, negative means export. Enable **Invert direction** if your sensor uses the opposite convention.
- **Battery, separate:** positive discharge and charge values. Discharge supplies the home; charge draws power from it.
- **Battery, combined:** positive means discharge, negative means charge. Inversion is supported.
- **Battery state of charge:** optional numeric percentage, 0–100.
- **Consumers:** positive consumption power. Choose non-overlapping sensors; do not include both a room total and all its devices unless you intend to double count.

Use solar and battery readings on the same electrical measurement boundary, ideally AC-side power. Hybrid inverter totals that already include battery discharge should not be combined with that discharge a second time. Inverter losses and unsynchronized updates can create temporary measurement mismatches.

The home total does not require a dedicated sensor. Other consumption is calculated home power minus the configured consumers. Negative balances are clamped to zero and flagged. Unavailable consumers display 0 W and contribute zero to the calculation, so Other consumption stays available while the home total is known. Normal readings resume automatically when a consumer comes back online. Source percentages for individual consumers are deliberately omitted.

Solar, grid, and battery sensors can update at different times. When their readings temporarily do not balance, the card allows a **three-second grace period**: the last balanced home total and source mix stay visible with an **Updating** label. Source and consumer readings continue updating, and Other consumption uses the held home total with the current consumer readings. A recovered balance displays immediately. If readings remain inconsistent, the hold ends and the measurement warning appears, even if no new sensor update arrives. At startup, there is no held value until a balanced reading is available. Unavailable source sensors still show an immediate warning.


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
animation_power_max: 10000
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

Browser regression tests run against the built bundle with lightweight Home Assistant element stand-ins. To install Chromium and run them:

```sh
npx playwright install --with-deps chromium webkit
npm run test:browser
```

The suite runs desktop Chromium and an iPhone profile in WebKit (Safari's browser engine). If only system Chromium is available locally, use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser -- --project=chromium`; CI and releases still run both projects. The tests cover continuous motion, reversals, stopping, the visual caps, consumer bar transitions, reduced motion, off-screen pausing, balance-grace recovery, mobile icon positioning, minimum text sizes, and rotation. CI and release workflows run them before publishing.

`npm run dev` rebuilds the bundle on changes; copy the rebuilt bundle to your test Home Assistant instance and refresh the dashboard. No backend service, credentials, or separate runtime is required for the card. Home Assistant supplies entity updates through its `hass` property.

The build produces one self-contained ES module at `dist/ha-energy-card.js`. Commit the rebuilt bundle whenever the card changes; CI checks that the committed bundle matches the source. Tests cover power balance, units, signed sensors, missing readings, source allocation, and consumer sorting. A real Home Assistant installation is still needed to validate integration and entity selection against your sensors.

Diagram icon paths are bundled from Material Design Icons by Pictogrammers. See [third-party notices](licenses/README.md).
