/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    target: 'es2022',
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
