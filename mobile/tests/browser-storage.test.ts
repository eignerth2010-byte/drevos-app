import { describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { createBrowserStore } from "../src/storage.web";
import { StoredSession } from "../src/gateway";

const SESSION: StoredSession = {
  url: "https://relay.example",
  token: "ab".repeat(32),
  gatewayId: "test-oven-123",
  language: "de",
  cloud: { room: "02".repeat(16), key: "01".repeat(32) },
};
function setup() {
  const indexedDB = new IDBFactory();
  return {
    indexedDB,
    store: createBrowserStore({ indexedDB, crypto, secure: true }),
  };
}
async function inspect(
  factory: IDBFactory,
  modify?: (store: IDBObjectStore) => void,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const opened = factory.open("drevos-pairing-v1", 1);
    opened.onerror = () => reject(opened.error);
    opened.onsuccess = () => {
      const db = opened.result,
        tx = db.transaction("vault", modify ? "readwrite" : "readonly"),
        vault = tx.objectStore("vault");
      if (modify) modify(vault);
      const key = vault.get("key"),
        session = vault.get("session");
      tx.oncomplete = () => {
        db.close();
        resolve({ key: key.result, session: session.result });
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}
describe("browser pairing vault", () => {
  it("restores pairing after reload with a non-exportable key and encrypted data", async () => {
    const x = setup();
    await x.store.save(SESSION);
    expect(
      await createBrowserStore({
        indexedDB: x.indexedDB,
        crypto,
        secure: true,
      }).load(),
    ).toEqual(SESSION);
    const stored = await inspect(x.indexedDB);
    expect(stored.key.extractable).toBe(false);
    await expect(crypto.subtle.exportKey("raw", stored.key)).rejects.toThrow();
    const encrypted = new TextDecoder().decode(stored.session.encrypted);
    expect(encrypted).not.toContain(SESSION.token);
    expect(encrypted).not.toContain(SESSION.cloud!.key);
  });
  it("uses fresh encryption nonces when updating the language", async () => {
    const x = setup();
    await x.store.save(SESSION);
    const first = await inspect(x.indexedDB);
    await x.store.save({ ...SESSION, language: "en" });
    const next = await inspect(x.indexedDB);
    expect(next.session.iv).not.toEqual(first.session.iv);
    expect((await x.store.load())?.language).toBe("en");
  });
  it("serializes an unfinished save before logout and removes both key and ciphertext", async () => {
    const x = setup();
    await Promise.all([x.store.save(SESSION), x.store.clear()]);
    expect(await x.store.load()).toBeNull();
    expect(await inspect(x.indexedDB)).toEqual({
      key: undefined,
      session: undefined,
    });
  });
  it("snapshots a pending save instead of retaining mutable session objects", async () => {
    const x = setup(),
      session = structuredClone(SESSION),
      saving = x.store.save(session);
    session.token = "";
    session.cloud!.key = "";
    await saving;
    expect(await x.store.load()).toEqual(SESSION);
  });
  it("discards corrupt ciphertext without exposing or restoring partial credentials", async () => {
    const x = setup();
    await x.store.save(SESSION);
    const record = await inspect(x.indexedDB);
    new Uint8Array(record.session.encrypted)[0] ^= 1;
    await inspect(x.indexedDB, (vault) => vault.put(record.session, "session"));
    expect(await x.store.load()).toBeNull();
    expect((await inspect(x.indexedDB)).key).toBeUndefined();
  });
  it("fails closed on insecure origins and refuses local gateway sessions", async () => {
    const x = setup(),
      insecure = createBrowserStore({
        indexedDB: x.indexedDB,
        crypto,
        secure: false,
      });
    await expect(insecure.load()).rejects.toThrow("browser-storage");
    await expect(insecure.save(SESSION)).rejects.toThrow("browser-storage");
    await expect(
      x.store.save({
        ...SESSION,
        url: "http://drevos-pi.local:8756",
        cloud: undefined,
      }),
    ).rejects.toThrow("browser-storage");
  });
});
