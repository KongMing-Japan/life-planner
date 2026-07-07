import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock

const memory = new Map<string, string>()
const storageMock: Storage = {
  get length() { return memory.size },
  clear: () => memory.clear(),
  getItem: (key) => memory.get(key) ?? null,
  key: (index) => [...memory.keys()][index] ?? null,
  removeItem: (key) => { memory.delete(key) },
  setItem: (key, value) => { memory.set(key, String(value)) },
}

Object.defineProperty(globalThis, 'localStorage', { value: storageMock, configurable: true })
Object.defineProperty(window, 'localStorage', { value: storageMock, configurable: true })

const originalWarn = console.warn
vi.spyOn(console, 'warn').mockImplementation((...args) => {
  if (String(args[0]).includes('width(0) and height(0)')) return
  originalWarn(...args)
})

afterEach(() => cleanup())
