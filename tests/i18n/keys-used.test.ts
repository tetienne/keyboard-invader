import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { describe, it, expect } from 'vitest'

const rootDir = resolve(import.meta.dirname, '..', '..')
const srcDir = resolve(rootDir, 'src')
const enPath = resolve(srcDir, 'shared', 'i18n', 'en.json')
const frPath = resolve(srcDir, 'shared', 'i18n', 'fr.json')

const EXCLUDED_FILES = new Set<string>([enPath, frPath])
const SCANNABLE_EXTENSIONS = new Set<string>(['.ts', '.tsx', '.js', '.json'])

function collectFiles(dir: string, acc: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      collectFiles(full, acc)
    } else if (st.isFile()) {
      if (EXCLUDED_FILES.has(full)) continue
      const dot = full.lastIndexOf('.')
      if (dot === -1) continue
      const ext = full.slice(dot)
      if (SCANNABLE_EXTENSIONS.has(ext)) acc.push(full)
    }
  }
}

describe('i18n keys: every key in en.json is referenced somewhere in src/', () => {
  it('finds at least one literal occurrence per key (no orphans)', () => {
    const enRaw = readFileSync(enPath, 'utf-8')
    const enKeys = Object.keys(JSON.parse(enRaw) as Record<string, string>)

    const files: string[] = []
    collectFiles(srcDir, files)

    const fileContents = files.map((f) => readFileSync(f, 'utf-8'))

    const orphans: string[] = []
    for (const key of enKeys) {
      const quoted = [`'${key}'`, `"${key}"`, `\`${key}\``]
      const found = fileContents.some((c) => quoted.some((q) => c.includes(q)))
      if (!found) orphans.push(key)
    }

    expect(
      orphans,
      `Orphan i18n keys (declared in en.json but never referenced in src/): ${orphans.join(', ')}`,
    ).toEqual([])
  })
})
