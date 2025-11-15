import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/svelte";

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
  takeRecords: () => [],
}));

// Mock matchMedia for embla-carousel and other components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scroll methods for embla-carousel
Element.prototype.scroll = vi.fn();
Element.prototype.scrollTo = vi.fn();
Element.prototype.scrollBy = vi.fn();

// Mock getBoundingClientRect for layout calculations
Element.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
  width: 1000,
  height: 600,
  top: 0,
  left: 0,
  bottom: 600,
  right: 1000,
  x: 0,
  y: 0,
  toJSON: () => {},
});

// Mock requestAnimationFrame if not available
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = (cb: FrameRequestCallback) => {
    return setTimeout(cb, 16) as unknown as number;
  };
}

if (!global.cancelAnimationFrame) {
  global.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

// Replace global localStorage with our mock
Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
