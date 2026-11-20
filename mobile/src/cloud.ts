import * as Crypto from "expo-crypto";
import {
  ConnectionError,
  Language,
  PiClient,
  SessionStore,
  StoredSession,
  normalizeUrl,
} from "./gateway";
import { open, seal } from "./cloud-protocol";
import { RuleError } from "./model";
export type CloudPairing = {
  type: "drevos-cloud";
  version: 1;
  relay: string;
  room: string;
  key: string;
  auth: string;
  gatewayId: string;
  name?: string;
};
const randomHex = (size: number) =>
  Array.from(Crypto.getRandomBytes(size), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
export function parseCloudPairing(text: string): CloudPairing {
  try {
    if (text.length > 2048) throw new Error();
    const p = JSON.parse(text);
    if (
      p?.type !== "drevos-cloud" ||
      p.version !== 1 ||
      typeof p.relay !== "string" ||
      !/^https:\/\//.test(p.relay) ||
      !/^[a-f0-9]{32}$/.test(p.room ?? "") ||
      !/^[a-f0-9]{64}$/.test(p.key ?? "") ||
      !/^[a-f0-9]{64}$/.test(p.auth ?? "") ||
      !/^[-\w]{8,64}$/.test(p.gatewayId ?? "")
    )
      throw new Error();
    return { ...p, relay: normalizeUrl(p.relay) };
  } catch {
    throw new RuleError("invalid");
  }
}
type Pending = {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  cleanup: () => void;
};
/** End-to-end encrypted live RPC; the relay never receives the gateway's local token. */
export class CloudTransport {
  private socket?: WebSocket;
  private opening?: Promise<void>;
  private pending = new Map<string, Pending>();
  private channel = randomHex(16);
  private boot?: string;
  private online = false;
  constructor(private session: StoredSession) {}
  private rejectAll() {
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.cleanup();
      p.reject(new ConnectionError("network"));
    }
    this.pending.clear();
  }
  suspend = () => {
    this.online = false;
    this.boot = undefined;
    const socket = this.socket;
    this.socket = undefined;
    this.opening = undefined;
    socket?.close();
    this.rejectAll();
  };
  private connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN)
      return this.online
        ? Promise.resolve()
        : Promise.reject(new ConnectionError("network"));
    if (this.opening) return this.opening;
    const url =
      this.session.url.replace(/^https:/, "wss:") +
      "/v1/rooms/" +
      this.session.cloud!.room +
      "/socket";
    const connection = new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url);
      this.socket = socket;
      let ready = false;
      const timeout = setTimeout(() => {
        if (!ready) {
          socket.close();
          reject(new ConnectionError("network"));
        }
      }, 10000);
      socket.onopen = () => {
        if (socket === this.socket)
          socket.send(
            JSON.stringify({
              type: "hello",
              role: "app",
              auth: this.session.token,
            }),
          );
      };
      socket.onmessage = (event) => {
        if (
          socket !== this.socket ||
          typeof event.data !== "string" ||
          event.data.length > 32768
        )
          return;
        let frame: any;
        try {
          frame = JSON.parse(event.data);
        } catch {
          return;
        }
        if (frame.type === "ready") {
          clearTimeout(timeout);
          ready = true;
          this.online = frame.deviceOnline === true;
          if (this.online) resolve();
          else reject(new ConnectionError("network"));
        } else if (frame.type === "online") {
          this.online = true;
        } else if (frame.type === "offline") {
          this.online = false;
          this.boot = undefined;
          this.rejectAll();
        } else if (frame.type === "data" && typeof frame.payload === "string") {
          let response: any;
          try {
            response = open(
              this.session.cloud!.key,
              this.session.cloud!.room,
              "pi-to-app",
              frame.payload,
            );
          } catch {
            return;
          }
          if (
            response?.client !== this.channel ||
            typeof response.id !== "string"
          )
            return;
          const pending = this.pending.get(response.id);
          if (!pending) return;
          this.pending.delete(response.id);
          clearTimeout(pending.timer);
          pending.cleanup();
          if (typeof response.boot === "string") this.boot = response.boot;
          if (response.ok === true) pending.resolve(response.result);
          else
            pending.reject(
              new ConnectionError(
                response.error === "permission"
                  ? "permission"
                  : response.error === "auth"
                    ? "auth"
                    : "server",
              ),
            );
        }
      };
      socket.onerror = () => {
        clearTimeout(timeout);
        if (!ready) reject(new ConnectionError("network"));
      };
      socket.onclose = () => {
        clearTimeout(timeout);
        if (socket === this.socket) {
          this.socket = undefined;
          this.online = false;
          this.boot = undefined;
          this.rejectAll();
        }
        if (!ready) reject(new ConnectionError("network"));
      };
    });
    this.opening = connection;
    return connection.finally(() => {
      if (this.opening === connection) this.opening = undefined;
    });
  }
  private async rpc(
    message: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<any> {
    await this.connect();
    if (
      signal?.aborted ||
      !this.online ||
      this.socket?.readyState !== WebSocket.OPEN
    )
      throw new ConnectionError("network");
    const id = randomHex(16),
      body = { ...message, id, client: this.channel, boot: this.boot };
    return new Promise((resolve, reject) => {
      const abort = () => {
        const pending = this.pending.get(id);
        if (!pending) return;
        this.pending.delete(id);
        clearTimeout(pending.timer);
        pending.cleanup();
        reject(new ConnectionError("network"));
      };
      const timer = setTimeout(abort, 9000);
      const cleanup = () => signal?.removeEventListener("abort", abort);
      signal?.addEventListener("abort", abort, { once: true });
      this.pending.set(id, { resolve, reject, timer, cleanup });
      try {
        this.socket!.send(
          JSON.stringify({
            type: "data",
            payload: seal(
              this.session.cloud!.key,
              this.session.cloud!.room,
              "app-to-pi",
              body,
              Crypto.getRandomBytes(12),
            ),
          }),
        );
      } catch {
        abort();
      }
    });
  }
  fetch: typeof fetch = async (input, init = {}) => {
    const url = new URL(String(input)),
      method = init.method ?? "GET",
      path = url.pathname;
    if (url.origin !== this.session.url) throw new ConnectionError("server");
    let result: any;
    const signal = init.signal ?? undefined;
    if (method === "GET" && ["/api/v1/info", "/api/v1/state"].includes(path))
      result = await this.rpc(
        { type: "read", resource: path.endsWith("info") ? "info" : "state" },
        signal,
      );
    else if (method === "POST" && path === "/api/v1/command") {
      const command = JSON.parse(String(init.body));
      // A fresh, short-lived, one-use Pi ticket authorizes exactly this command.
      const prepared = await this.rpc({ type: "prepare", command }, signal);
      if (typeof prepared?.ticket !== "string")
        throw new ConnectionError("server");
      if (signal?.aborted) throw new ConnectionError("network");
      result = await this.rpc(
        { type: "execute", ticket: prepared.ticket, command },
        signal,
      );
    } else throw new ConnectionError("server");
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
}
export function restoreClient(
  session: StoredSession,
  store: SessionStore,
): PiClient {
  if (!session.cloud) return new PiClient(session, store);
  const transport = new CloudTransport(session);
  return new PiClient(session, store, transport.fetch, transport.suspend);
}
export async function pairCloud(
  pair: CloudPairing,
  store: SessionStore,
  language: Language,
): Promise<PiClient> {
  const session: StoredSession = {
    url: pair.relay,
    token: pair.auth,
    gatewayId: pair.gatewayId,
    language,
    cloud: { room: pair.room, key: pair.key },
  };
  const client = restoreClient(session, store);
  try {
    await client.states();
    await store.save(session);
    return client;
  } catch (error) {
    client.suspend();
    throw error;
  }
}
