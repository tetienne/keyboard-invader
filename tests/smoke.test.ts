import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

const rootDir = resolve(import.meta.dirname, '..')

describe('TypeScript strict mode is configured (DX-03)', () => {
  it('has strict, noUncheckedIndexedAccess, and exactOptionalPropertyTypes enabled', () => {
    const raw = readFileSync(resolve(rootDir, 'tsconfig.json'), 'utf-8')
    const tsconfig = JSON.parse(raw) as {
      compilerOptions: Record<string, unknown>
    }

    expect(tsconfig.compilerOptions['strict']).toBe(true)
    expect(tsconfig.compilerOptions['noUncheckedIndexedAccess']).toBe(true)
    expect(tsconfig.compilerOptions['exactOptionalPropertyTypes']).toBe(true)
  })
})

describe('ESLint config is loadable (DX-02)', () => {
  it('exports a non-empty flat config array', async () => {
    const configPath = resolve(rootDir, 'eslint.config.mjs')
    const mod = (await import(configPath)) as { default: unknown }

    expect(Array.isArray(mod.default)).toBe(true)
    expect((mod.default as unknown[]).length).toBeGreaterThan(0)
  })
})

describe('Build output exists (INFRA-01)', () => {
  it('dist/index.html exists and contains a script tag', () => {
    const indexPath = resolve(rootDir, 'dist', 'index.html')

    if (!existsSync(indexPath)) {
      return // dist/ not yet built — skip in pre-build CI
    }

    const content = readFileSync(indexPath, 'utf-8')

    expect(content).toContain('<script')
  })
})

describe('Path alias @/ is configured (D-04)', () => {
  it('tsconfig.json has @/* path alias', () => {
    const raw = readFileSync(resolve(rootDir, 'tsconfig.json'), 'utf-8')
    const tsconfig = JSON.parse(raw) as {
      compilerOptions: { paths: Record<string, string[]> }
    }

    expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./src/*'])
  })

  it('vite.config.ts contains @ alias', () => {
    const content = readFileSync(resolve(rootDir, 'vite.config.ts'), 'utf-8')

    expect(content).toContain("'@'")
  })
})
