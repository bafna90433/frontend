// --- SAFE STORAGE POLYFILL FOR SANDBOXED WEBVIEWS (INSTAGRAM, FACEBOOK, ETC.) ---
(() => {
  const testStorage = (type: "localStorage" | "sessionStorage") => {
    try {
      const storage = window[type];
      const key = "__storage_test__";
      storage.setItem(key, key);
      storage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  };

  const createMockStorage = (): Storage => {
    const store: Record<string, string> = {};
    return {
      getItem: (key: string): string | null => {
        return key in store ? store[key] : null;
      },
      setItem: (key: string, value: string): void => {
        store[key] = String(value);
      },
      removeItem: (key: string): void => {
        delete store[key];
      },
      clear: (): void => {
        for (const key in store) {
          delete store[key];
        }
      },
      key: (index: number): string | null => {
        const keys = Object.keys(store);
        return keys[index] || null;
      },
      get length(): number {
        return Object.keys(store).length;
      }
    } as Storage;
  };

  if (!testStorage("localStorage")) {
    Object.defineProperty(window, "localStorage", {
      value: createMockStorage(),
      writable: true,
      configurable: true,
    });
    console.warn("localStorage is sandboxed/disabled; using fallback in-memory storage.");
  }

  if (!testStorage("sessionStorage")) {
    Object.defineProperty(window, "sessionStorage", {
      value: createMockStorage(),
      writable: true,
      configurable: true,
    });
    console.warn("sessionStorage is sandboxed/disabled; using fallback in-memory storage.");
  }
})();

import React from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </React.StrictMode>
  );

  container.classList.add("app-loaded");
}