import { describe, expect, it } from "vitest";
import {
  available,
  discover,
  formatTimer,
  parseNumber,
  commandFor,
} from "../src/model";
import { demoStates } from "../src/demo";
function device() {
  return discover(demoStates())[0];
}
describe("Drevos function routing", () => {
  it("discovers renamed entities through stable metadata, without mixing gateways", () => {
    const a = demoStates(),
      b = demoStates().map((s) => ({
        ...s,
        entity_id: s.entity_id.replace("demo_", "other_"),
        attributes: { ...s.attributes, drevos_gateway_id: "second" },
      }));
    const groups = discover([...a, ...b]);
    expect(groups).toHaveLength(2);
    expect(groups[1].entities.konvektion.entity_id).toBe(
      "switch.other_konvektion",
    );
  });
  it("rejects ambiguous duplicate keys and wrong domains", () => {
    const states = demoStates(),
      duplicate = { ...states[0], entity_id: "sensor.renamed" };
    expect(() =>
      commandFor(discover([...states, duplicate])[0], {
        key: "konvektion",
        value: true,
      }),
    ).toThrow("missing");
    expect(discover([{ ...states[0], entity_id: "switch.bad" }])).toHaveLength(
      0,
    );
  });
  it("treats a never-pressed button as available and unavailable buttons as blocked", () => {
    const d = device();
    expect(available(d.entities.shutdown)).toBe(true);
    expect(commandFor(d, { key: "shutdown" }).value).toBe("SHUTDOWN");
    d.entities.shutdown.state = "unavailable";
    expect(() => commandFor(d, { key: "shutdown" })).toThrow("missing");
  });
});
describe("PLC command guards", () => {
  it.each([
    ["kammertemperatur_soll", 120],
    ["kerntemperatur_ziel", 115],
    ["rauch_soll", 100],
    ["timer_dauer", 9999],
  ] as const)(
    "enforces %s bounds independently of reported limits",
    (key, max) => {
      expect(parseNumber(String(max), key)).toBe(max);
      expect(() => parseNumber(String(max + 1), key)).toThrow("invalid");
      for (const text of ["1.2", "-1", "NaN", "Infinity", "1e2", ""])
        expect(() => parseNumber(text, key)).toThrow("invalid");
      const d = device();
      d.entities[key].attributes.max = 999999;
      expect(() => commandFor(d, { key, value: max + 1 })).toThrow("invalid");
    },
  );
  it("uses explicit on/off services, never a toggle", () => {
    expect(commandFor(device(), { key: "konvektion", value: true }).value).toBe(
      "ON",
    );
    expect(
      commandFor(device(), { key: "konvektion", value: false }).value,
    ).toBe("OFF");
  });
  it("blocks offline and automatic mode", () => {
    const d = device();
    d.entities.connection.state = "off";
    expect(() => commandFor(d, { key: "luefter", value: true })).toThrow(
      "offline",
    );
    d.entities.connection.state = "on";
    d.entities.automatik.state = "on";
    expect(() => commandFor(d, { key: "luefter", value: true })).toThrow(
      "locked",
    );
    d.entities.automatik.state = "off";
    d.entities.controls_available.state = "off";
    expect(() => commandFor(d, { key: "luefter", value: true })).toThrow(
      "locked",
    );
  });
  it("requires a positive current target for heating or smoke", () => {
    const d = device();
    d.entities.kammertemperatur_soll.state = "0";
    d.entities.rauch_soll.state = "unknown";
    expect(() => commandFor(d, { key: "heizelement", value: true })).toThrow(
      "heatTarget",
    );
    expect(() => commandFor(d, { key: "rauchbetrieb", value: true })).toThrow(
      "smokeTarget",
    );
    expect(commandFor(d, { key: "heizelement", value: false }).value).toBe(
      "OFF",
    );
  });
  it("blocks pause, reset and shutdown while heating; requires stopped timer", () => {
    const d = device();
    d.entities.heizelement.state = "on";
    for (const c of [
      { key: "timer_lauf", value: false },
      { key: "timer_reset" },
      { key: "shutdown" },
    ] as const)
      expect(() => commandFor(d, c)).toThrow("heatSmokeOff");
    d.entities.heizelement.state = "off";
    d.entities.timer_lauf.state = "on";
    expect(() => commandFor(d, { key: "shutdown" })).toThrow("timerOff");
  });
  it("formats the real integration duration strings including durations over 99h", () => {
    const d = device(),
      e = d.entities.timer_restzeit;
    e.state = "150:00:00";
    expect(formatTimer(e)).toBe("150:00");
    e.state = "01:18:59";
    expect(formatTimer(e)).toBe("1:18");
    e.state = "unknown";
    expect(formatTimer(e)).toBe("—");
  });
});
