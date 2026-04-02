import { build } from 'esbuild'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname, extname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'))
const srcRoot = resolve(__dirname, 'src')

// Packages to bundle (not mark as external) even though they're in dependencies
// Packages to bundle inline (not external) even though in dependencies.
// Reasons: ESM/CJS compat issues, or simply better to inline.
const bundleInlineExact = new Set([
  'jsonc-parser',
  'xss',
  'tree-kill',
  'qrcode',
  'stack-utils',
  'asciichart',
  'https-proxy-agent',
  'react',
  'react-reconciler',
  'usehooks-ts',
])
const bundleInlinePrefixes = [
  '@opentelemetry/',
]
const bundleInline = {
  has(pkg) {
    return bundleInlineExact.has(pkg) ||
      bundleInlinePrefixes.some(p => pkg.startsWith(p))
  }
}

const externalDeps = [
  ...Object.keys(pkg.dependencies || {}).filter(d => !bundleInline.has(d)),
  ...Object.keys(pkg.devDependencies || {}).filter(d => !bundleInline.has(d)),
  // Dynamic npm packages (resolved at runtime)
  '@aws-sdk/client-sts',
  '@withfig/autocomplete',
  '@opentelemetry/exporter-metrics-otlp-grpc',
  '@opentelemetry/exporter-metrics-otlp-http',
  '@opentelemetry/exporter-metrics-otlp-proto',
  '@opentelemetry/exporter-logs-otlp-grpc',
  '@opentelemetry/exporter-logs-otlp-proto',
  '@opentelemetry/exporter-trace-otlp-grpc',
  '@opentelemetry/exporter-trace-otlp-proto',
  '@opentelemetry/exporter-prometheus',
]

/**
 * esbuild plugin: resolves missing internal source files to empty stub modules.
 * This handles the ~200+ files that weren't captured by source map extraction.
 */
function missingModuleStubPlugin() {
  return {
    name: 'missing-module-stub',
    setup(build) {
      const stubbed = new Set()

      // Packages that have alias shims should NOT be stubbed
      const aliasedPackages = [
        '@ant/computer-use-mcp',
        '@ant/claude-for-chrome-mcp',
        '@anthropic-ai/sandbox-runtime',
        'color-diff-napi',
      ]
      const privatePackagePrefixes = [
        '@ant/computer-use-input',
        '@ant/computer-use-swift',
        '@anthropic-ai/mcpb',
        '@anthropic-ai/claude-agent-sdk',
        '@anthropic-ai/bedrock-sdk',
        '@anthropic-ai/vertex-sdk',
        '@anthropic-ai/foundry-sdk',
        'image-processor-napi',
        'audio-capture-napi',
        'url-handler-napi',
        'modifiers-napi',
      ]

      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === 'entry-point') return null

        // Skip packages that have alias shims (let esbuild alias handle them)
        if (aliasedPackages.some(p => args.path.startsWith(p))) return null

        // Handle private/unavailable npm packages
        if (privatePackagePrefixes.some(p => args.path.startsWith(p))) {
          if (!stubbed.has(args.path)) stubbed.add(args.path)
          return { path: args.path, namespace: 'stub-module' }
        }

        // Only handle relative imports or src/ alias imports
        if (!args.path.startsWith('.') && !args.path.startsWith('src/')) return null

        let resolvedPath
        if (args.path.startsWith('src/')) {
          resolvedPath = resolve(srcRoot, args.path.replace(/^src\//, ''))
        } else {
          resolvedPath = resolve(args.resolveDir, args.path)
        }

        // Normalize .js/.jsx -> .ts/.tsx for TypeScript sources
        const basePath = resolvedPath.replace(/\.(js|jsx)$/, '')
        const candidates = [
          resolvedPath,
          basePath + '.ts',
          basePath + '.tsx',
          basePath + '.js',
          basePath + '.jsx',
          join(basePath, 'index.ts'),
          join(basePath, 'index.tsx'),
          join(basePath, 'index.js'),
          resolvedPath.replace(/\.js$/, '.ts'),
          resolvedPath.replace(/\.js$/, '.tsx'),
          resolvedPath.replace(/\.jsx$/, '.tsx'),
          resolvedPath.replace(/\.jsx$/, '.ts'),
        ]

        for (const candidate of candidates) {
          if (existsSync(candidate)) return null
        }

        // Also check for .md files
        if (resolvedPath.endsWith('.md') && existsSync(resolvedPath)) return null

        if (!stubbed.has(args.path)) {
          stubbed.add(args.path)
        }

        return {
          path: args.path,
          namespace: 'stub-module',
        }
      })

      build.onLoad({ filter: /.*/, namespace: 'stub-module' }, (args) => {
        // .md and .txt stubs should export empty strings (not undefined)
        if (args.path.endsWith('.md') || args.path.endsWith('.txt')) {
          return {
            contents: `export default "";`,
            loader: 'js',
          }
        }
        return {
          contents: `
            // Auto-generated stub for missing module: ${args.path}
            export default undefined;
          `,
          loader: 'js',
        }
      })

      build.onEnd(() => {
        if (stubbed.size > 0) {
          console.log(`\n[stub-plugin] Stubbed ${stubbed.size} missing modules:`)
          const sorted = [...stubbed].sort()
          for (const p of sorted) {
            console.log(`  - ${p}`)
          }
          console.log()
        }
      })
    },
  }
}

/**
 * esbuild plugin: handles global.d.ts imports (side-effect only, no content)
 */
function dtsImportPlugin() {
  return {
    name: 'dts-import',
    setup(build) {
      build.onResolve({ filter: /\.d\.ts$/ }, () => ({
        path: 'global.d.ts',
        namespace: 'dts-stub',
      }))
      build.onLoad({ filter: /.*/, namespace: 'dts-stub' }, () => ({
        contents: '',
        loader: 'js',
      }))
    },
  }
}

const start = Date.now()

try {
  const result = await build({
    entryPoints: ['src/entrypoints/cli.tsx'],
    bundle: true,
    outfile: 'dist/cli.js',
    platform: 'node',
    target: 'node18',
    format: 'esm',
    sourcemap: true,
    minify: false,
    keepNames: true,
    banner: {
      js: [
        '#!/usr/bin/env node',
        'import { createRequire } from "module";',
        'const require = createRequire(import.meta.url);',
      ].join('\n'),
    },
    alias: {
      'bun:bundle': resolve(__dirname, 'src/shims/bun-bundle.ts'),
      'bun:ffi': resolve(__dirname, 'src/shims/bun-ffi.ts'),
      '@ant/computer-use-mcp': resolve(__dirname, 'src/shims/ant-computer-use-mcp.ts'),
      '@ant/computer-use-mcp/sentinelApps': resolve(__dirname, 'src/shims/ant-computer-use-mcp.ts'),
      '@ant/computer-use-mcp/types': resolve(__dirname, 'src/shims/ant-computer-use-mcp.ts'),
      '@ant/claude-for-chrome-mcp': resolve(__dirname, 'src/shims/ant-claude-for-chrome-mcp.ts'),
      '@anthropic-ai/sandbox-runtime': resolve(__dirname, 'src/shims/anthropic-sandbox-runtime.ts'),
      'color-diff-napi': resolve(__dirname, 'src/shims/color-diff-napi.ts'),
    },
    external: externalDeps,
    loader: {
      '.txt': 'text',
      '.md': 'text',
    },
    define: {
      'process.env.NODE_ENV': '"production"',
      'MACRO.VERSION': `"${pkg.version}"`,
      'MACRO.VERSION_CHANGELOG': '""',
      'MACRO.PACKAGE_URL': '"@anthropic-ai/claude-code"',
      'MACRO.NATIVE_PACKAGE_URL': '"@anthropic-ai/claude-code"',
      'MACRO.FEEDBACK_CHANNEL': '"https://github.com/anthropics/claude-code/issues"',
      'MACRO.ISSUES_EXPLAINER': '"file an issue at https://github.com/anthropics/claude-code/issues"',
      'MACRO.BUILD_TIME': `"${new Date().toISOString()}"`,
    },
    plugins: [
      dtsImportPlugin(),
      missingModuleStubPlugin(),
    ],
    logLevel: 'warning',
  })

  const elapsed = Date.now() - start
  const warnings = result.warnings.length
  console.log(`Build completed in ${elapsed}ms -> dist/cli.js`)
  if (warnings > 0) {
    console.log(`  ${warnings} warning(s)`)
  }
} catch (err) {
  console.error('Build failed:', err.message || err)
  process.exit(1)
}
