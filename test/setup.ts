import { vi } from 'vitest'
import '@testing-library/jest-dom';

// Mock localStorage with actual storage implementation for jsdom
const createStorageMock = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(key => delete store[key]); }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
};

// Create storage instances that can be used for spying
const localStorageInstance = createStorageMock();
const sessionStorageInstance = createStorageMock();

// Use Object.defineProperty to allow proper spying while maintaining the mock behavior
Object.defineProperty(global, 'localStorage', {
  configurable: true,
  get: () => localStorageInstance,
});

Object.defineProperty(global, 'sessionStorage', {
  configurable: true,
  get: () => sessionStorageInstance,
});

// Mock fetch
global.fetch = vi.fn()

// Mock window.location
delete (window as any).location
window.location = { href: '', origin: 'http://localhost' } as Location

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock Element.prototype.scrollIntoView
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn();
}