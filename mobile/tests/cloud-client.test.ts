import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
vi.mock("expo-crypto", async () => {
  const { randomBytes } = await import("node:crypto");
  return { getRandomBytes: (n: number) => Uint8Array.from(randomBytes(n)) };
});
import { restoreClient } from "../src/cloud";
import { open, seal } from "../src/cloud-protocol";
import { StoredSession } from "../src/gateway";
import { INFO, STATE, setup } from "./fixtures";
const ROOM = "02".repeat(16),
  KEY = "01".repeat(32),
  BOOT = "03".repeat(16);
class Socket {
  static OPEN = 1;
  static CLOSED = 3;
  static instances: Socket[] = [];
  static deviceOnline = true;
  static writes: any[] = [];
  static onWrite: (() => void) | undefined;
  readyState = 0;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  frames: string[] = [];
  constructor(public url: string) {
    Socket.instances.push(this);
    queueMicrotask(() => {
      if (this.readyState === 3) return;
      this.readyState = 1;
      this.onopen?.();
    });
  }
  emit(frame: any) {
    queueMicrotask(() => {
      if (this.readyState === 1)
        this.onmessage?.({ data: JSON.stringify(frame) });
    });
  }
  send(text: string) {
    this.frames.push(text);
    const frame = JSON.parse(text);
    if (frame.type === "hello") {
      this.emit({ type: "ready", deviceOnline: Socket.deviceOnline });
      return;
    }
    const m = open(KEY, ROOM, "app-to-pi", frame.payload);
    let result: any;
    if (m.type === "read") result = m.resource === "info" ? INFO : STATE;
    else if (m.type === "prepare") {
      expect(m.boot).toBe(BOOT);
      result = { ticket: "test-one-use-ticket" };
    } else if (m.type === "execute") {
      expect(m.boot).toBe(BOOT);
      Socket.writes.push(m.command);
      if (Socket.onWrite) {
        Socket.onWrite();
        return;
      }
      result = STATE;
    }
    this.emit({
      type: "data",
      payload: seal(
        KEY,
        ROOM,
        "pi-to-app",
        { id: m.id, client: m.client, boot: BOOT, ok: true, result },
        randomBytes(12),
      ),
    });
  }
  close() {
    if (this.readyState === 3) return;
    this.readyState = 3;
    queueMicrotask(() => this.onclose?.());
  }
}
const session = (): StoredSession => ({
  url: "https://relay.example",
  token: "ab".repeat(32),
  gatewayId: INFO.id,
  language: "de",
  cloud: { room: ROOM, key: KEY },
});
beforeEach(() => {
  Socket.instances = [];
  Socket.writes = [];
  Socket.deviceOnline = true;
  Socket.onWrite = undefined;
  vi.stubGlobal("WebSocket", Socket);
});
afterEach(() => {
  for (const socket of Socket.instances) socket.close();
  vi.unstubAllGlobals();
});
describe("standalone remote app connection", () => {
  it("reads and operates through encrypted RPC without a local address, HA or VPN", async () => {
    const x = setup(),
      client = restoreClient(session(), x.store);
    expect(await client.states()).toHaveLength(19);
    await client.command(INFO.id, { key: "luefter", value: true });
    expect(Socket.writes).toEqual([{ name: "luefter", value: "ON" }]);
    const frames = Socket.instances[0].frames.join("");
    expect(frames).not.toContain(KEY);
    expect(frames).not.toContain("kammertemperatur");
    expect(frames).not.toContain("luefter");
    expect(Socket.instances[0].url).toBe(
      "wss://relay.example/v1/rooms/" + ROOM + "/socket",
    );
    client.suspend();
  });
  it("does not retry an unconfirmed remote command", async () => {
    const x = setup(),
      client = restoreClient(session(), x.store),
      controller = new AbortController();
    Socket.onWrite = () => controller.abort();
    await expect(
      client.command(
        INFO.id,
        { key: "luefter", value: true },
        controller.signal,
      ),
    ).rejects.toThrow("network");
    expect(Socket.writes).toHaveLength(1);
    client.suspend();
  });
  it("recovers from an offline oven without accumulating sockets or commands", async () => {
    Socket.deviceOnline = false;
    const x = setup(),
      client = restoreClient(session(), x.store);
    await expect(client.states()).rejects.toThrow("network");
    await expect(client.states()).rejects.toThrow("network");
    expect(Socket.instances).toHaveLength(1);
    Socket.deviceOnline = true;
    Socket.instances[0].emit({ type: "online" });
    await Promise.resolve();
    expect(await client.states()).toHaveLength(19);
    expect(Socket.writes).toHaveLength(0);
    client.suspend();
  });
  it("closes background connections and reconnects using fresh state", async () => {
    const x = setup(),
      client = restoreClient(session(), x.store);
    await client.states();
    client.suspend();
    expect(Socket.instances[0].readyState).toBe(3);
    await client.states();
    expect(Socket.instances).toHaveLength(2);
    expect(Socket.writes).toHaveLength(0);
    await client.logout();
    expect(x.store.clear).toHaveBeenCalledOnce();
  });
});
