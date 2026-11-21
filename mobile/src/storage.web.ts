import { SessionStore, StoredSession, normalizeUrl } from "./gateway";

const DATABASE = "drevos-pairing-v1";
const AAD = new TextEncoder().encode("drevos-browser-pairing:1");
type Vault = { v: 1; iv: Uint8Array; encrypted: ArrayBuffer };
type Options = {
  indexedDB?: IDBFactory;
  crypto?: Crypto;
  secure?: boolean;
  name?: string;
};

function valid(value: unknown): StoredSession {
  const s = value as StoredSession;
  if (
    !s ||
    !s.cloud ||
    !/^https:\/\//.test(s.url ?? "") ||
    !/^[a-f0-9]{64}$/.test(s.token ?? "") ||
    !/^[a-f0-9]{32}$/.test(s.cloud.room ?? "") ||
    !/^[a-f0-9]{64}$/.test(s.cloud.key ?? "") ||
    !/^[-\w]{8,64}$/.test(s.gatewayId ?? "") ||
    !["de", "en"].includes(s.language)
  )
    throw new Error("browser-storage");
  return {
    url: normalizeUrl(s.url),
    token: s.token,
    gatewayId: s.gatewayId,
    language: s.language,
    cloud: { room: s.cloud.room, key: s.cloud.key },
  };
}

/** Origin-local encrypted storage. Never writes pairing secrets to localStorage or caches. */
export function createBrowserStore(options: Options = {}): SessionStore {
  let tail: Promise<unknown> = Promise.resolve();
  function serial<T>(operation: () => Promise<T>): Promise<T> {
    const pending = tail.then(operation);
    tail = pending.catch(() => {});
    return pending;
  }
  function environment() {
    const factory = options.indexedDB ?? globalThis.indexedDB;
    const cryptography = options.crypto ?? globalThis.crypto;
    if (
      !(options.secure ?? globalThis.isSecureContext) ||
      !factory ||
      !cryptography?.subtle
    )
      throw new Error("browser-storage");
    return { factory, cryptography };
  }
  async function database(): Promise<IDBDatabase> {
    const { factory } = environment();
    return new Promise((resolve, reject) => {
      let finished = false;
      const request = factory.open(options.name ?? DATABASE, 1);
      const fail = () => {
        finished = true;
        clearTimeout(timer);
        reject(new Error("browser-storage"));
      };
      const timer = setTimeout(fail, 5000);
      request.onupgradeneeded = () => request.result.createObjectStore("vault");
      request.onerror = fail;
      request.onblocked = fail;
      request.onsuccess = () => {
        clearTimeout(timer);
        if (finished) {
          request.result.close();
          return;
        }
        finished = true;
        resolve(request.result);
      };
    });
  }
  function read(
    db: IDBDatabase,
  ): Promise<{ key?: CryptoKey; session?: Vault }> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("vault", "readonly");
      const store = tx.objectStore("vault"),
        key = store.get("key"),
        session = store.get("session");
      tx.oncomplete = () =>
        resolve({ key: key.result, session: session.result });
      tx.onerror = tx.onabort = () => reject(new Error("browser-storage"));
    });
  }
  function write(
    db: IDBDatabase,
    key?: CryptoKey,
    session?: Vault,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("vault", "readwrite"),
        store = tx.objectStore("vault");
      if (key && session) {
        store.put(key, "key");
        store.put(session, "session");
      } else store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(new Error("browser-storage"));
    });
  }
  return {
    load() {
      return serial(async () => {
        const db = await database();
        try {
          const { key, session } = await read(db);
          if (!session) return null;
          try {
            if (
              !key ||
              key.extractable ||
              key.type !== "secret" ||
              session.v !== 1 ||
              !(session.iv instanceof Uint8Array) ||
              session.iv.length !== 12 ||
              !(session.encrypted instanceof ArrayBuffer) ||
              session.encrypted.byteLength > 8192
            )
              throw new Error("invalid");
            const plain = await environment().cryptography.subtle.decrypt(
              {
                name: "AES-GCM",
                iv: new Uint8Array(session.iv),
                additionalData: AAD,
              },
              key,
              session.encrypted,
            );
            return valid(JSON.parse(new TextDecoder().decode(plain)));
          } catch {
            await write(db);
            return null;
          }
        } finally {
          db.close();
        }
      });
    },
    save(value) {
      // Snapshot before asynchronous work; logout must not mutate a queued save.
      let snapshot: StoredSession;
      try {
        snapshot = valid(value);
      } catch {
        return Promise.reject(new Error("browser-storage"));
      }
      return serial(async () => {
        const db = await database();
        try {
          const cryptography = environment().cryptography;
          let { key } = await read(db);
          if (!key || key.extractable || key.algorithm.name !== "AES-GCM")
            key = await cryptography.subtle.generateKey(
              { name: "AES-GCM", length: 256 },
              false,
              ["encrypt", "decrypt"],
            );
          const iv = cryptography.getRandomValues(new Uint8Array(12));
          const encrypted = await cryptography.subtle.encrypt(
            { name: "AES-GCM", iv, additionalData: AAD },
            key,
            new TextEncoder().encode(JSON.stringify(snapshot)),
          );
          await write(db, key, { v: 1, iv, encrypted });
        } catch {
          throw new Error("browser-storage");
        } finally {
          db.close();
        }
      });
    },
    clear() {
      return serial(async () => {
        const db = await database();
        try {
          await write(db);
        } finally {
          db.close();
        }
      });
    },
  };
}

export const secureStore = createBrowserStore();
