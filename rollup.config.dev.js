import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import serve from 'rollup-plugin-serve';
import typescript from 'rollup-plugin-typescript2';
import htmlTemplate from 'rollup-plugin-generate-html-template';
import copy from 'rollup-plugin-copy-assets';

export default {

    //  Our games entry point (edit as required)
    input: [
        './src/game.ts'
    ],

    //  Where the build file is to be generated.
    //  Most games being built for distribution can use iife as the module type.
    //  You can also use 'umd' if you need to ingest your game into another system.
    //  The 'intro' property can be removed if using Phaser 3.21 or above. Keep it for earlier versions.
    output: {
        file: './dist/game.js',
        name: 'Asteroids',
        format: 'iife',
        sourcemap: true,
        intro: 'var global = window;'
    },

    plugins: [

        //  Toggle the booleans here to enable / disable Phaser 3 features:
        replace({
            'typeof CANVAS_RENDERER': JSON.stringify(true),
            'typeof WEBGL_RENDERER': JSON.stringify(true),
            'typeof EXPERIMENTAL': JSON.stringify(true),
            'typeof PLUGIN_CAMERA3D': JSON.stringify(false),
            'typeof PLUGIN_FBINSTANT': JSON.stringify(false),
            'typeof FEATURE_SOUND': JSON.stringify(true)
        }),

        //  Parse our .ts source files
        resolve({
            extensions: ['.ts', '.tsx']
        }),

        //  We need to convert the Phaser 3 CJS modules into a format Rollup can use:
        commonjs({
            include: [
                'node_modules/eventemitter3/**',
                'node_modules/phaser/**'
            ],
            exclude: [
                'node_modules/phaser/src/polyfills/requestAnimationFrame.js'
            ],
            sourceMap: true,
            ignoreGlobal: true
        }),

        //  See https://www.npmjs.com/package/rollup-plugin-typescript2 for config options
        typescript({ sourceMap: true, inlineSources: true, verbosity: 2 }),

        htmlTemplate({
            template: 'src/template.html',
            target: 'index.html',
        }),

        copy({
            assets: [
                'assets',
            ],
        }),

        //  See https://www.npmjs.com/package/rollup-plugin-serve for config options
        serve({
            open: true,
            contentBase: 'dist',
            host: 'localhost',
            port: 8080,
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        })

    ]
};