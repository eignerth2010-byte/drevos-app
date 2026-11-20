import { gcm } from "@noble/ciphers/aes.js";
import { fromByteArray, toByteArray } from "base64-js";
export type Direction = "app-to-pi" | "pi-to-app";
export function hexBytes(hex: string): Uint8Array {
  if (!/^[a-f0-9]{64}$/.test(hex)) throw new Error("Invalid key");
  return Uint8Array.from(hex.match(/../g)!, (s) => parseInt(s, 16));
}
export function seal(
  keyHex: string,
  room: string,
  direction: Direction,
  message: unknown,
  nonce: Uint8Array,
): string {
  if (nonce.length !== 12) throw new Error("Invalid nonce");
  const aad = new TextEncoder().encode(`drevos-cloud:1:${room}:${direction}`),
    plain = new TextEncoder().encode(JSON.stringify(message));
  return JSON.stringify({
    v: 1,
    n: fromByteArray(nonce),
    c: fromByteArray(gcm(hexBytes(keyHex), nonce, aad).encrypt(plain)),
  });
}
export function open(
  keyHex: string,
  room: string,
  direction: Direction,
  packet: string,
): any {
  if (packet.length > 30000) throw new Error("Packet too large");
  const data = JSON.parse(packet);
  if (data.v !== 1 || typeof data.n !== "string" || typeof data.c !== "string")
    throw new Error("Invalid packet");
  const nonce = toByteArray(data.n),
    ciphertext = toByteArray(data.c);
  if (nonce.length !== 12 || ciphertext.length > 18000)
    throw new Error("Invalid packet");
  const aad = new TextEncoder().encode(`drevos-cloud:1:${room}:${direction}`);
  return JSON.parse(
    new TextDecoder().decode(
      gcm(hexBytes(keyHex), nonce, aad).decrypt(ciphertext),
    ),
  );
}
