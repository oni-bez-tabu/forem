import * as esbuild from 'esbuild'
import glob from 'glob'
import path from 'path'
import { fileURLToPath } from 'url'
import svgr from 'esbuild-plugin-svgr'
import { stimulusPlugin } from 'esbuild-plugin-stimulus'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const preactRoot = path.join(__dirname, 'node_modules', 'preact')

let ctx = {
  loader: {
    '.js': 'jsx',
    '.jsx': 'jsx',
    '.png': 'file',
  },
  target: ['es2019'],
  entryPoints: glob.sync("app/javascript/packs/**/*.*"),
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  bundle: true,
  minify: true,
  sourcemap: false,
  outdir: 'app/assets/builds',
  logLevel: 'info',
  define: {
    'global': 'window',
  },
  alias: {
    'react': path.join(preactRoot, 'compat'),
    'react-dom': path.join(preactRoot, 'compat'),
    // Force a single Preact instance across all bundles. Vendored SDKs (e.g. @org/chat-ui-preact)
    // ship their own nested preact copy; without this alias esbuild bundles two Preacts and hooks
    // explode with "Cannot read properties of undefined (reading '__H')".
    'preact': preactRoot,
    'preact/hooks': path.join(preactRoot, 'hooks'),
    'preact/compat': path.join(preactRoot, 'compat'),
    'preact/jsx-runtime': path.join(preactRoot, 'jsx-runtime'),
    'preact/debug': path.join(preactRoot, 'debug'),
    'preact/devtools': path.join(preactRoot, 'devtools'),
  },
  plugins: [
    svgr({jsxRuntime: 'classic-preact' }),
    stimulusPlugin(),
  ],
}

if (process.argv.includes('--watch')) {
  ctx = await esbuild.context(ctx)
  await ctx.watch()
} else {
  await esbuild.build(ctx)
}
