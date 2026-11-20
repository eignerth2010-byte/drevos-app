import {
  Command,
  Device,
  Reading,
  RuleError,
  NUMBERS,
  discover,
  commandFor,
} from "./model";
export type Language = "de" | "en";
export type StoredSession = {
  url: string;
  token: string;
  gatewayId: string;
  language: Language;
  cloud?: { room: string; key: string };
};
export type SessionStore = {
  load(): Promise<StoredSession | null>;
  save(value: StoredSession): Promise<void>;
  clear(): Promise<void>;
};
export type GatewayInfo = {
  id: string;
  name: string;
  version: string;
  api_version: 1;
  profile: "drevos_fx3u_v1";
  controls_enabled: boolean;
};
export class ConnectionError extends Error {
  constructor(
    public code:
      "network" | "auth" | "permission" | "server" | "profile" | "identity",
  ) {
    super(code);
  }
}
export function normalizeUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new RuleError("url");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !["", "/"].includes(url.pathname)
  )
    throw new RuleError("url");
  const h = url.hostname.toLowerCase(),
    p = h.split(".").map(Number);
  const local =
    h.endsWith(".local") ||
    h === "localhost" ||
    h === "[::1]" ||
    (p.length === 4 &&
      p.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) &&
      (p[0] === 10 ||
        p[0] === 127 ||
        (p[0] === 192 && p[1] === 168) ||
        (p[0] === 172 && p[1] >= 16 && p[1] <= 31)));
  if (url.protocol === "http:" && !local) throw new RuleError("url");
  return url.origin;
}
export function validToken(token: string): boolean {
  return /^[\x21-\x7e]{32,512}$/.test(token);
}
export function validateInfo(data: any): GatewayInfo {
  if (
    data?.api_version !== 1 ||
    data?.profile !== "drevos_fx3u_v1" ||
    !/^[-\w]{8,64}$/.test(data?.id ?? "") ||
    typeof data?.name !== "string" ||
    typeof data?.version !== "string" ||
    typeof data?.controls_enabled !== "boolean"
  )
    throw new ConnectionError("profile");
  return data;
}
const FIELDS: Record<string, [string, string]> = {
  kammertemperatur: ["sensor", "kammertemperatur"],
  kerntemperatur: ["sensor", "kerntemperatur"],
  raucheinstellung: ["sensor", "raucheinstellung"],
  timer_restzeit: ["sensor", "timer_restzeit"],
  timer_laufzeit: ["sensor", "timer_laufzeit"],
  kammertemperatur_soll: ["number", "kammertemperatur_soll"],
  kerntemperatur_ziel: ["number", "kerntemperatur_ziel"],
  rauch_soll: ["number", "rauch_soll"],
  timer_dauer: ["number", "timer_dauer"],
  konvektion: ["switch", "konvektion"],
  luefter: ["switch", "luefter"],
  heizelement: ["switch", "heizung_freigabe"],
  rauchbetrieb: ["switch", "rauch_freigabe"],
  timer_lauf: ["switch", "timer_laeuft"],
  connection: ["binary_sensor", "available"],
  automatik: ["binary_sensor", "automatik"],
  controls_available: ["binary_sensor", "controls_available"],
  timer_reset: ["button", ""],
  shutdown: ["button", ""],
};
export function readingsFromGateway(info: GatewayInfo, state: any): Reading[] {
  if (
    typeof state?.available !== "boolean" ||
    typeof state?.controls_available !== "boolean"
  )
    throw new ConnectionError("server");
  if (state.available) {
    for (const field of [
      "automatik",
      "fahrenheit",
      "konvektion",
      "luefter",
      "heizung_freigabe",
      "rauch_freigabe",
      "timer_laeuft",
    ])
      if (typeof state[field] !== "boolean")
        throw new ConnectionError("server");
    for (const field of [
      "kammertemperatur",
      "kerntemperatur",
      "raucheinstellung",
      ...Object.keys(NUMBERS),
    ])
      if (typeof state[field] !== "number" || !Number.isFinite(state[field]))
        throw new ConnectionError("server");
    for (const field of ["timer_restzeit", "timer_laufzeit"])
      if (
        typeof state[field] !== "string" ||
        !/^\d+:[0-5]\d:[0-5]\d$/.test(state[field])
      )
        throw new ConnectionError("server");
  }
  const canControl =
    state.available &&
    state.controls_available &&
    info.controls_enabled &&
    !state.automatik &&
    !state.fahrenheit;
  return Object.entries(FIELDS).map(([key, [kind, field]]) => {
    const control = ["number", "switch", "button"].includes(kind);
    let value =
      key === "connection"
        ? state.available
          ? "on"
          : "off"
        : key === "controls_available"
          ? canControl
            ? "on"
            : "off"
          : !state.available || (control && !canControl)
            ? "unavailable"
            : kind === "button"
              ? "unknown"
              : typeof state[field] === "boolean"
                ? state[field]
                  ? "on"
                  : "off"
                : String(state[field]);
    if (
      kind === "button" &&
      (state.heizung_freigabe || state.rauch_freigabe || state.timer_laeuft)
    )
      value = "unavailable";
    const limits = NUMBERS[key as keyof typeof NUMBERS];
    // Internal view-model identifiers only; these are not Home Assistant entities.
    return {
      entity_id: `${kind}.${key}`,
      state: value,
      attributes: {
        drevos_key: key,
        drevos_gateway_id: info.id,
        drevos_device_name: info.name,
        ...limits,
      },
    };
  });
}
export type Pairing = {
  type: "drevos-gateway";
  version: 1;
  url: string;
  token: string;
  id?: string;
};
export function parsePairing(text: string): Pairing {
  try {
    if (text.length > 2048) throw new Error();
    const data = JSON.parse(text);
    if (
      data?.type !== "drevos-gateway" ||
      data?.version !== 1 ||
      typeof data.url !== "string" ||
      typeof data.token !== "string" ||
      !validToken(data.token) ||
      (data.id !== undefined &&
        (typeof data.id !== "string" || !/^[-\w]{8,64}$/.test(data.id)))
    )
      throw new Error();
    return { ...data, url: normalizeUrl(data.url) };
  } catch {
    throw new RuleError("invalid");
  }
}
export class PiClient {
  private busy = false;
  private closed = false;
  constructor(
    public session: StoredSession,
    private store: SessionStore,
    private fetcher: typeof fetch = fetch,
    private disconnect?: () => void,
  ) {}
  static async pair(
    url: string,
    token: string,
    store: SessionStore,
    language: Language,
    expectedId?: string,
    fetcher: typeof fetch = fetch,
  ): Promise<PiClient> {
    url = normalizeUrl(url);
    token = token.trim();
    if (!validToken(token)) throw new ConnectionError("auth");
    const client = new PiClient(
      { url, token, gatewayId: expectedId ?? "", language },
      store,
      fetcher,
    );
    const info = validateInfo(await client.request("GET", "info"));
    if (expectedId && expectedId !== info.id)
      throw new ConnectionError("identity");
    client.session.gatewayId = info.id;
    await client.states();
    await store.save(client.session);
    return client;
  }
  private async request(
    method: "GET" | "POST",
    path: "info" | "state" | "command",
    payload?: unknown,
    signal?: AbortSignal,
  ): Promise<any> {
    if (this.closed) throw new ConnectionError("auth");
    const controller = new AbortController(),
      abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timeout = setTimeout(abort, 12000);
    try {
      const response = await this.fetcher(
        this.session.url + "/api/v1/" + path,
        {
          method,
          headers: {
            Authorization: "Bearer " + this.session.token,
            "Content-Type": "application/json",
          },
          body: payload ? JSON.stringify(payload) : undefined,
          signal: controller.signal,
          redirect: "error",
        },
      );
      if (response.status === 401) throw new ConnectionError("auth");
      if (response.status === 403 || response.status === 409)
        throw new ConnectionError("permission");
      if (response.status !== 200) throw new ConnectionError("server");
      const data = await response.json();
      if (!data || typeof data !== "object" || Array.isArray(data))
        throw new ConnectionError("server");
      if (controller.signal.aborted) throw new ConnectionError("network");
      return data;
    } catch (error) {
      if (error instanceof ConnectionError) throw error;
      throw new ConnectionError("network");
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    }
  }
  private async info(signal?: AbortSignal) {
    const info = validateInfo(
      await this.request("GET", "info", undefined, signal),
    );
    if (info.id !== this.session.gatewayId)
      throw new ConnectionError("identity");
    return info;
  }
  async states(signal?: AbortSignal): Promise<Reading[]> {
    const info = await this.info(signal),
      state = await this.request("GET", "state", undefined, signal);
    return readingsFromGateway(info, state);
  }
  async select(gatewayId: string | undefined, language: Language) {
    if (gatewayId && gatewayId !== this.session.gatewayId)
      throw new ConnectionError("identity");
    this.session = { ...this.session, language };
    await this.store.save(this.session);
  }
  async command(
    gatewayId: string,
    command: Command,
    signal?: AbortSignal,
  ): Promise<Device[]> {
    if (this.busy) throw new RuleError("busy");
    this.busy = true;
    try {
      if (gatewayId !== this.session.gatewayId)
        throw new ConnectionError("identity");
      const info = await this.info(signal),
        before = await this.request("GET", "state", undefined, signal);
      const device = discover(readingsFromGateway(info, before))[0];
      const payload = commandFor(device, command);
      if (signal?.aborted || this.closed) throw new RuleError("offline");
      // Exactly one POST. The gateway serializes PLC access and returns actual readback.
      const after = await this.request("POST", "command", payload, signal);
      return discover(readingsFromGateway(info, after));
    } finally {
      this.busy = false;
    }
  }
  suspend() {
    this.disconnect?.();
  }
  async logout() {
    this.closed = true;
    this.disconnect?.();
    this.session.token = "";
    if (this.session.cloud) this.session.cloud.key = "";
    await this.store.clear();
  }
}
