import type { UserConfig } from 'tsdown'

/**
 * Two targets (mirrors the verified DSH client-plugin mechanics):
 *   host   → lib/index.js  ESM (node; deps stay external — cordis etc. resolve from node_modules)
 *   client → lib/client.js LAZY-CJS factory registered via window.__ModuleLoader__.load
 *          — the ONLY shape the DSH client-module system accepts; react is the
 *          sole runtime external.
 */
const host: UserConfig = {
  name: 'mulqi-getfable',
  entry: { index: 'src/host/index.ts' },
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2022',
  fixedExtension: false,
  dts: false,
  clean: true,
  deps: { neverBundle: true },
}

const CLIENT_EXTERNALS = [
  /^react(?:\/.*)?$/,
  /^react-dom(?:\/.*)?$/,
]

const client: UserConfig = {
  name: 'mulqi-getfable/client',
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  fixedExtension: false,
  outExtensions: () => ({ js: '.js' }),
  platform: 'browser',
  target: 'es2022',
  dts: false,
  sourcemap: false,
  clean: false,
  deps: { neverBundle: CLIENT_EXTERNALS },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  outputOptions: {
    banner: 'window.__ModuleLoader__.load({ id: "mulqi-getfable", factory: (require) => {',
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default [host, client]
