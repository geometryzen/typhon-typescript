import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import alias from 'rollup-plugin-alias';

const substituteModulePaths = {
}

export default {
    entry: 'build/module/index.js',
    sourceMap: true,
    external: ['code-writer', 'generic-rbtree', 'typhon-lang'],
    plugins: [
        alias(substituteModulePaths),
        nodeResolve({
            browser: true
        }),
        commonjs()
    ]
}
