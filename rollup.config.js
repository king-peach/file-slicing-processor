import { defineConfig } from 'rollup';
import typescript from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';
import commonjs from '@rollup/plugin-commonjs';

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
      commonjs({
        include: 'node_modules/**'
      }),
      typescript({ 
        compilerOptions: {
          "target": "esnext",
          "outDir": "/lib/types/index.d.ts",
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
    plugins: [
      dts(),
    ]
  }
])