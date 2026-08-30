import "@testing-library/jest-dom";
// IndexedDB for the offline store's Dexie code under jsdom.
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { __resetDbForTests } from "@/infrastructure/offline/db";

// jsdom doesn't expose structuredClone, which Dexie uses to clone stored values.
if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = (value: unknown) =>
    value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

// Each test gets a clean IndexedDB and a fresh Dexie instance.
beforeEach(async () => {
  Object.defineProperty(globalThis, "indexedDB", {
    value: new IDBFactory(),
    configurable: true,
    writable: true,
  });
  await __resetDbForTests();
});
