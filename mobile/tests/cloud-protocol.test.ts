import { describe, it, expect } from "vitest";
import { seal, open } from "../src/cloud-protocol";
import { parseCloudPairing } from "../src/cloud";
import { vi } from "vitest";
import vector from "../../testdata/crypto-vector.json";
vi.mock("expo-crypto", () => ({
  getRandomBytes: (n: number) => new Uint8Array(n).fill(1),
}));
describe("end-to-end cloud packets", () => {
  const key = "01".repeat(32),
    room = "02".repeat(16),
    nonce = new Uint8Array(12).fill(3);
  it("matches the Python Pi agent's encrypted packets exactly", () => {
    expect(
      seal(
        vector.key,
        vector.room,
        "app-to-pi",
        vector.message,
        Uint8Array.from(vector.nonce),
      ),
    ).toBe(vector.appPacket);
    expect(open(vector.key, vector.room, "pi-to-app", vector.piPacket)).toEqual(
      vector.message,
    );
  });
  it("authenticates sender direction, device room, key and ciphertext", () => {
    const packet = seal(
      key,
      room,
      "app-to-pi",
      { id: "message", value: 42 },
      nonce,
    );
    expect(open(key, room, "app-to-pi", packet)).toEqual({
      id: "message",
      value: 42,
    });
    expect(() => open(key, room, "pi-to-app", packet)).toThrow();
    expect(() => open("04".repeat(32), room, "app-to-pi", packet)).toThrow();
    expect(() => open(key, "ff".repeat(16), "app-to-pi", packet)).toThrow();
    const altered = JSON.parse(packet);
    altered.c = altered.c.slice(0, -4) + "AAAA";
    expect(() =>
      open(key, room, "app-to-pi", JSON.stringify(altered)),
    ).toThrow();
  });
  it("validates cloud QR codes without contacting a provider or exposing a key in the URL", () => {
    const pair = {
      type: "drevos-cloud",
      version: 1,
      relay: "https://relay.example",
      room,
      key,
      auth: "05".repeat(32),
      gatewayId: "gateway-test-123",
    };
    expect(parseCloudPairing(JSON.stringify(pair))).toEqual(pair);
    for (const invalid of [
      { ...pair, relay: "http://relay.example" },
      { ...pair, room: "guessable" },
      { ...pair, key: "short" },
    ])
      expect(() => parseCloudPairing(JSON.stringify(invalid))).toThrow(
        "invalid",
      );
  });
});
