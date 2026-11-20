import { describe, it, expect, vi } from "vitest";
import {
  PiClient,
  SessionStore,
  StoredSession,
  GatewayInfo,
  readingsFromGateway,
  normalizeUrl,
  parsePairing,
  validateInfo,
} from "../src/gateway";
import { discover } from "../src/model";
import { INFO, STATE, SESSION, setup, json } from "./fixtures";
describe("standalone gateway access", () => {
  it("reads 19 functions directly from the Pi, without Home Assistant or cloud dependencies", async () => {
    const x = setup(),
      states = await x.client.states();
    expect(states).toHaveLength(19);
    expect(discover(states)[0].entities.kammertemperatur.state).toBe("21.3");
    expect(x.fetcher.mock.calls.map(([u]) => u)).toEqual([
      "https://pi.example/api/v1/info",
      "https://pi.example/api/v1/state",
    ]);
    expect(x.fetcher.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer " + SESSION.token,
    );
    expect(
      x.fetcher.mock.calls.every(([u]) => !u.includes(SESSION.token)),
    ).toBe(true);
  });
  it("accepts only a verified controller profile, API and stable identity", async () => {
    expect(() => validateInfo({ ...INFO, api_version: 2 })).toThrow("profile");
    expect(() => validateInfo({ ...INFO, profile: "unknown" })).toThrow(
      "profile",
    );
    const x = setup(() => json({ ...INFO, id: "other-gateway" }));
    await expect(x.client.states()).rejects.toThrow("identity");
  });
  it("marks offline states unavailable and applies automatic/Fahrenheit/disabled guards", () => {
    const offline = discover(
      readingsFromGateway(INFO, {
        available: false,
        controls_available: false,
      }),
    )[0];
    expect(offline.entities.connection.state).toBe("off");
    expect(offline.entities.heizelement.state).toBe("unavailable");
    for (const state of [
      { ...STATE, automatik: true },
      { ...STATE, fahrenheit: true },
    ])
      expect(
        discover(readingsFromGateway(INFO, state))[0].entities
          .controls_available.state,
      ).toBe("off");
    expect(
      discover(
        readingsFromGateway({ ...INFO, controls_enabled: false }, STATE),
      )[0].entities.heizelement.state,
    ).toBe("unavailable");
  });
  it("rejects malformed readings instead of showing them as current", () => {
    expect(() =>
      readingsFromGateway(INFO, { ...STATE, kammertemperatur: "21.3" }),
    ).toThrow("server");
    expect(() =>
      readingsFromGateway(INFO, { ...STATE, heizung_freigabe: "false" }),
    ).toThrow("server");
  });
  it("rechecks fresh state and sends exactly one allowlisted Pi command", async () => {
    const x = setup();
    await x.client.command(INFO.id, { key: "luefter", value: true });
    const posts = x.fetcher.mock.calls.filter(([, i]) => i.method === "POST");
    expect(posts).toHaveLength(1);
    expect(JSON.parse(posts[0][1].body)).toEqual({
      name: "luefter",
      value: "ON",
    });
    const locked = setup((u) =>
      json(u.endsWith("/info") ? INFO : { ...STATE, automatik: true }),
    );
    await expect(
      locked.client.command(INFO.id, { key: "heizelement", value: true }),
    ).rejects.toThrow("locked");
    expect(locked.fetcher.mock.calls.some(([, i]) => i.method === "POST")).toBe(
      false,
    );
  });
  it("does not retry 401, 409, 503 or lost-command responses", async () => {
    for (const failure of [401, 409, 503, "timeout"]) {
      const x = setup((u, i) => {
        if (i.method === "POST") {
          if (failure === "timeout") throw Error("network");
          return json({}, failure as number);
        }
        return json(u.endsWith("/info") ? INFO : STATE);
      });
      await expect(
        x.client.command(INFO.id, { key: "luefter", value: true }),
      ).rejects.toThrow();
      expect(
        x.fetcher.mock.calls.filter(([, i]) => i.method === "POST"),
      ).toHaveLength(1);
    }
  });
  it("rejects duplicate taps without queuing them", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const x = setup(async (u) => {
      await gate;
      return json(u.endsWith("/info") ? INFO : STATE);
    });
    const first = x.client.command(INFO.id, {
      key: "konvektion",
      value: false,
    });
    await expect(
      x.client.command(INFO.id, { key: "konvektion", value: false }),
    ).rejects.toThrow("busy");
    release();
    await first;
    expect(
      x.fetcher.mock.calls.filter(([, i]) => i.method === "POST"),
    ).toHaveLength(1);
  });
  it("rejects an aborted command before any gateway write", async () => {
    const controller = new AbortController();
    const x = setup((u) => {
      if (u.endsWith("/state")) controller.abort();
      return json(u.endsWith("/info") ? INFO : STATE);
    });
    await expect(
      x.client.command(
        INFO.id,
        { key: "luefter", value: true },
        controller.signal,
      ),
    ).rejects.toThrow();
    expect(x.fetcher.mock.calls.some(([, i]) => i.method === "POST")).toBe(
      false,
    );
  });
  it("removes local pairing without changing the Pi or other phones", async () => {
    const x = setup();
    await x.client.logout();
    expect(x.store.clear).toHaveBeenCalledOnce();
    expect(x.fetcher).not.toHaveBeenCalled();
    await expect(x.client.states()).rejects.toThrow("auth");
  });
  it("validates URLs and private QR data before making any connection", () => {
    expect(normalizeUrl("http://drevos-pi.local:8756/")).toBe(
      "http://drevos-pi.local:8756",
    );
    for (const u of [
      "http://public.example",
      "https://name:secret@pi.example",
      "https://pi.example/?token=x",
      "https://pi.example/api",
    ])
      expect(() => normalizeUrl(u)).toThrow("url");
    expect(
      parsePairing(
        JSON.stringify({
          type: "drevos-gateway",
          version: 1,
          url: SESSION.url,
          token: SESSION.token,
          id: INFO.id,
        }),
      ).id,
    ).toBe(INFO.id);
    expect(() => parsePairing('{"type":"other"}')).toThrow("invalid");
  });
});
