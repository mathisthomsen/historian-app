import "@testing-library/jest-dom";
import { expect } from "vitest";
import * as vitestAxeMatchers from "vitest-axe/matchers";

// Extend Vitest expect with axe-core accessibility matchers
expect.extend(vitestAxeMatchers);

// Mock ResizeObserver for cmdk and other components that use it
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollIntoView for cmdk which calls it during item selection in jsdom
Element.prototype.scrollIntoView = () => {};

// Node.js 25 ships a built-in localStorage that lacks .clear()/.key() without
// --localstorage-file. Override with a proper in-memory implementation so jsdom
// tests that use localStorage work correctly.
const localStorageStore: Record<string, string> = {};
const localStorageMock: Storage = {
  length: 0,
  getItem: (key: string) => localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => {
    localStorageStore[key] = value;
    (localStorageMock as { length: number }).length = Object.keys(localStorageStore).length;
  },
  removeItem: (key: string) => {
    delete localStorageStore[key];
    (localStorageMock as { length: number }).length = Object.keys(localStorageStore).length;
  },
  clear: () => {
    for (const key of Object.keys(localStorageStore)) delete localStorageStore[key];
    (localStorageMock as { length: number }).length = 0;
  },
  key: (index: number) => Object.keys(localStorageStore)[index] ?? null,
};
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

// Mock window.matchMedia for next-themes and other components that use it
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
