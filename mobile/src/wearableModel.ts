import { Device, numeric, formatTimer, commandFor, Command } from "./model";
import { StoredSession, normalizeUrl } from "./gateway";

export const WATCH_STALE_MS = 15000;
export function watchSession(value: unknown): StoredSession {
  const s = value as StoredSession;
  if (
    !s ||
    !s.cloud ||
    !/^[a-f0-9]{64}$/.test(s.token) ||
    !/^[a-f0-9]{32}$/.test(s.cloud.room) ||
    !/^[a-f0-9]{64}$/.test(s.cloud.key) ||
    !/^[-\w]{8,64}$/.test(s.gatewayId) ||
    !["de", "en"].includes(s.language)
  )
    throw Error("watch-pairing");
  const url = normalizeUrl(s.url);
  if (!url.startsWith("https://")) throw Error("watch-pairing");
  return {
    url,
    token: s.token,
    gatewayId: s.gatewayId,
    language: s.language,
    cloud: { room: s.cloud.room, key: s.cloud.key },
  };
}
export function watchFresh(
  connected: boolean,
  readAt: number,
  now = Date.now(),
) {
  return (
    connected && readAt > 0 && now >= readAt && now - readAt <= WATCH_STALE_MS
  );
}
export function watchCommand(
  device: Device,
  command: Command,
  readAt: number,
  now = Date.now(),
) {
  if (!watchFresh(true, readAt, now)) throw Error("watch-stale");
  return commandFor(device, command);
}
export function wearableSnapshot(
  device: Device | undefined,
  connected: boolean,
  readAt: number,
  now = Date.now(),
) {
  const e = device?.entities ?? {};
  const online =
    watchFresh(connected, readAt, now) &&
    e.connection?.state === "on" &&
    !device?.ambiguous;
  const unit = e.kammertemperatur?.attributes.unit_of_measurement;
  return {
    version: 1,
    name: device?.name.slice(0, 80) ?? "Drevos",
    online,
    observedAt: readAt,
    unit: unit === "°F" ? "°F" : "°C",
    chamber: online ? (numeric(e.kammertemperatur) ?? null) : null,
    core: online ? (numeric(e.kerntemperatur) ?? null) : null,
    smoke: online ? (numeric(e.raucheinstellung) ?? null) : null,
    remaining: online ? formatTimer(e.timer_restzeit) : "—",
  };
}
