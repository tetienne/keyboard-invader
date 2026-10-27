/// <reference types="vitest/config" />
import { defineConfig, type Plugin, type ResolvedConfig } from 'vite'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const PWA_PLACEHOLDER = /(['"`])__PWA_MANIFEST__\1/

/** Public files the service worker skips: only crawlers fetch them. */
const PWA_SKIP = new Set(['og-image.jpg'])

/**
 * Builds src/sw.ts as /sw.js and injects the list of files to precache
 * (every emitted file plus the public folder) with a version hash.
 */
function pwa(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'pwa',
    apply: 'build',
    // After Vite's HTML plugin, so index.html is in the bundle.
    enforce: 'post',
    configResolved(c) {
      config = c
    },
    buildStart() {
      this.emitFile({
        type: 'chunk',
        id: resolve(import.meta.dirname, 'src/sw.ts'),
        fileName: 'sw.js',
      })
    },
    generateBundle(_, bundle) {
      const sw = bundle['sw.js']
      if (sw?.type !== 'chunk') throw new Error('sw.js was not built')
      const entries: [string, string | Uint8Array][] = []
      for (const [name, out] of Object.entries(bundle)) {
        if (name === 'sw.js' || name.endsWith('.map')) continue
        entries.push([name, out.type === 'chunk' ? out.code : out.source])
      }
      const publicDir = config.publicDir
      if (publicDir) {
        for (const entry of readdirSync(publicDir, { recursive: true, withFileTypes: true })) {
          if (!entry.isFile() || PWA_SKIP.has(entry.name)) continue
          const path = join(entry.parentPath, entry.name)
          entries.push([path.slice(publicDir.length + 1).replaceAll('\\', '/'), readFileSync(path)])
        }
      }
      // Sorted so the version only changes when a file does.
      entries.sort(([a], [b]) => (a < b ? -1 : 1))
      const hash = createHash('sha256').update(sw.code)
      for (const [name, content] of entries) hash.update(name).update(content)
      const files = entries.map(([name]) => (name === 'index.html' ? '/' : `/${name}`))
      const manifest = JSON.stringify({ version: hash.digest('hex').slice(0, 12), files })
      if (!PWA_PLACEHOLDER.test(sw.code)) throw new Error('sw.js lost its manifest placeholder')
      sw.code = sw.code.replace(PWA_PLACEHOLDER, () => JSON.stringify(manifest))
    },
  }
}

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
  plugins: [pwa()],
  build: {
    target: 'es2022',
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
