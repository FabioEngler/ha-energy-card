import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
export default {
  input: 'src/energy-flow-card.ts',
  output: { file: 'dist/ha-energy-card.js', format: 'es' },
  plugins: [resolve(), typescript()]
};
