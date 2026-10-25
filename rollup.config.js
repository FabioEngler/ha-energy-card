import { readFileSync } from 'node:fs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
export default {
  input: 'src/energy-flow-card.ts',
  output: { file: 'dist/ha-energy-card.js', format: 'es', banner: `/*! Material Design Icons — Pictogrammers (https://pictogrammers.com/library/mdi/)\n${readFileSync(new URL('./licenses/MDI-LICENSE.txt', import.meta.url), 'utf8')}\n${readFileSync(new URL('./licenses/APACHE-2.0.txt', import.meta.url), 'utf8')}\n*/` },
  plugins: [resolve(), typescript()]
};
