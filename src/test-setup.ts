import '@testing-library/jest-dom'

// Polyfill ResizeObserver for jsdom — required by Radix UI components (e.g. Separator)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
