import { vi } from "vitest";
import {
  PiClient,
  SessionStore,
  StoredSession,
  GatewayInfo,
} from "../src/gateway";
export const INFO: GatewayInfo = {
  id: "gateway-test-123",
  name: "Test oven",
  version: "0.1.0",
  api_version: 1,
  profile: "drevos_fx3u_v1",
  controls_enabled: true,
};
export const STATE = {
  available: true,
  controls_available: true,
  automatik: false,
  fahrenheit: false,
  kammertemperatur: 21.3,
  kerntemperatur: 19.2,
  raucheinstellung: 35,
  kammertemperatur_soll: 75,
  kerntemperatur_ziel: 65,
  rauch_soll: 35,
  timer_dauer: 120,
  timer_restzeit: "01:18:00",
  timer_laufzeit: "00:42:00",
  konvektion: true,
  luefter: false,
  heizung_freigabe: false,
  rauch_freigabe: false,
  timer_laeuft: false,
};
export const SESSION: StoredSession = {
  url: "https://pi.example",
  token: "t".repeat(64),
  gatewayId: INFO.id,
  language: "de",
};
export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
export function setup(
  route?: (url: string, init: RequestInit) => Promise<Response> | Response,
) {
  const store: SessionStore = {
    load: vi.fn(async () => SESSION),
    save: vi.fn(async () => {}),
    clear: vi.fn(async () => {}),
  };
  const fetcher = vi.fn(async (url: any, init: any) =>
    route
      ? route(String(url), init)
      : json(String(url).endsWith("/info") ? INFO : STATE),
  );
  return {
    store,
    fetcher,
    client: new PiClient({ ...SESSION }, store, fetcher as typeof fetch),
  };
}
