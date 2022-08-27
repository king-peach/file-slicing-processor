import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default defineConfig([
  {
    input: './src/index.ts',
    output: [
      {
        file: 'lib/bundle.cjs',
        format: 'umd',
        name: 'FileSlicingProcessor'
      },
      {
        file: 'lib/bundle.mjs',
        format: "esm",
      }
    ],
    plugins: [
      typescript({ 
        compilerOptions: {
          lib: ['es6']
        }
      })
    ],
    watch: 'node_modules/**'
  },
  {
    input: './src/index.ts',
    output: [
      {
        file: 'lib/types/index.d.ts',
        format: 'esm'
      }
    ],
    plugins: [dts()]
  }
])