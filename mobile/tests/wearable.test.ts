import { describe, it, expect } from "vitest";
import {
  watchSession,
  watchCommand,
  watchFresh,
  wearableSnapshot,
} from "../src/wearableModel";
import { discover } from "../src/model";
import { demoStates } from "../src/demo";
const session = {
  url: "https://example.invalid",
  token: "a".repeat(64),
  gatewayId: "test-gateway",
  language: "de",
  cloud: { room: "b".repeat(32), key: "c".repeat(64) },
};
describe("watch pairing and command boundary", () => {
  it("whitelists pairing fields and rejects insecure or malformed sessions", () => {
    expect(watchSession({ ...session, extra: "ignored" })).toEqual(session);
    expect(() =>
      watchSession({ ...session, url: "http://localhost" }),
    ).toThrow();
    expect(() => watchSession({ ...session, token: "bad" })).toThrow();
    expect(() => watchSession({ ...session, cloud: undefined })).toThrow();
  });
  it("expires readings and rejects future or unobserved timestamps", () => {
    expect(watchFresh(true, 1000, 16000)).toBe(true);
    expect(watchFresh(true, 1000, 16001)).toBe(false);
    expect(watchFresh(true, 0, 1)).toBe(false);
    expect(watchFresh(true, 2000, 1000)).toBe(false);
    expect(watchFresh(false, 1000, 1001)).toBe(false);
  });
  it("uses existing actual-state command guards and refuses stale commands", () => {
    const d = discover(demoStates())[0];
    expect(
      watchCommand(d, { key: "konvektion", value: true }, 1000, 1001),
    ).toEqual({ name: "konvektion", value: "ON" });
    expect(() =>
      watchCommand(d, { key: "konvektion", value: true }, 1000, 16001),
    ).toThrow("watch-stale");
    expect(() =>
      watchCommand(d, { key: "kammertemperatur_soll", value: 121 }, 1000, 1001),
    ).toThrow();
    d.entities.automatik.state = "on";
    expect(() =>
      watchCommand(d, { key: "konvektion", value: true }, 1000, 1001),
    ).toThrow("locked");
  });
  it("exports display values without credentials and blanks offline data", () => {
    const d = discover(demoStates())[0];
    const live = wearableSnapshot(d, true, 1000, 1001);
    expect(live.online).toBe(true);
    expect(JSON.stringify(live)).not.toMatch(/token|gatewayId|cloud|key/);
    expect(wearableSnapshot(d, true, 1000, 20000)).toMatchObject({
      online: false,
      chamber: null,
      core: null,
      smoke: null,
      remaining: "—",
    });
  });
});
