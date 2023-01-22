import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
// import { terser } from 'rollup-plugin-terser';
import packageJson from './package.json' assert { type: 'json' };


export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: packageJson.browser,
                format: 'umd',
                sourcemap: true,
                name: 'typhon-typescript'
            },
            {
                file: packageJson.main,
                format: 'cjs',
                sourcemap: true,
                name: 'typhon-typescript'
            },
            {
                file: packageJson.module,
                format: 'esm',
                sourcemap: true
            }
        ],
        plugins: [
            resolve(),
            commonjs(),
            typescript({ tsconfig: './tsconfig.json' }),
            // terser()
        ]
    },
    {
        input: 'build/module/types/src/index.d.ts',
        output: [{ file: packageJson.types, format: "esm" }],
        plugins: [dts()],
    }
]