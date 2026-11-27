import React, { useState, useEffect, useRef } from "react";
import {
  AppState,
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
} from "react-native";
import { restoreClient } from "./cloud";
import { PiClient, StoredSession, SessionStore } from "./gateway";
import {
  Device,
  Command,
  NumberKey,
  SwitchKey,
  NUMBERS,
  discover,
  numeric,
  formatTimer,
  available,
  parseNumber,
} from "./model";
import { watchSession, watchFresh, watchCommand } from "./wearableModel";
import { wearableBridge } from "./wearableBridge";
const labels = {
  de: {
    title: "Drevos",
    pair: "Drevos auf dem Handy öffnen → Info → Uhr & Autoanzeige. Diese Uhr dort koppeln.",
    reload: "Aktualisieren",
    offline: "Nicht verfügbar",
    stale: "Keine aktuellen Werte",
    chamber: "Kammer",
    core: "Kern",
    smoke: "Rauch",
    timer: "Timer",
    settings: "Sollwerte",
    confirm: "Befehl wirklich senden?",
    send: "Bestätigen",
    cancel: "Abbrechen",
    error:
      "Befehl nicht bestätigt. Zustand aktualisieren; nicht blind wiederholen.",
    unlink: "Kopplung löschen",
    unlinkAsk: "Kopplung auf dieser Uhr löschen?",
    busy: "Bitte warten …",
    settingsKeys: {
      kammertemperatur_soll: "Kammer °C",
      kerntemperatur_ziel: "Kern °C",
      rauch_soll: "Rauch %",
      timer_dauer: "Timer min",
    },
    switches: {
      heizelement: "Heizung",
      rauchbetrieb: "Rauch/Zündung",
      konvektion: "Konvektion",
      luefter: "Lüfter",
      timer_lauf: "Timer",
    },
  },
  en: {
    title: "Drevos",
    pair: "Open Drevos on your phone → Info → Watch & car display and pair this watch.",
    reload: "Refresh",
    offline: "Unavailable",
    stale: "No current readings",
    chamber: "Chamber",
    core: "Core",
    smoke: "Smoke",
    timer: "Timer",
    settings: "Targets",
    confirm: "Send this command?",
    send: "Confirm",
    cancel: "Cancel",
    error: "Command not confirmed. Refresh the state; do not retry blindly.",
    unlink: "Remove pairing",
    unlinkAsk: "Remove this watch's pairing?",
    busy: "Please wait …",
    settingsKeys: {
      kammertemperatur_soll: "Chamber °C",
      kerntemperatur_ziel: "Core °C",
      rauch_soll: "Smoke %",
      timer_dauer: "Timer min",
    },
    switches: {
      heizelement: "Heating",
      rauchbetrieb: "Smoke/ignition",
      konvektion: "Convection",
      luefter: "Fan",
      timer_lauf: "Timer",
    },
  },
};
export default function WatchApp() {
  const [client, setClient] = useState<PiClient | null>(null),
    [device, setDevice] = useState<Device>(),
    [connected, setConnected] = useState(false),
    [readAt, setReadAt] = useState(0),
    [now, setNow] = useState(Date.now()),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [lang, setLang] = useState<"de" | "en">("de"),
    [drafts, setDrafts] = useState<Record<string, string>>({}),
    [confirm, setConfirm] = useState<{
      command?: Command;
      label: string;
      unlink?: boolean;
    } | null>(null),
    [revision, setRevision] = useState(0);
  const active = useRef(AppState.currentState === "active"),
    abort = useRef<AbortController | null>(null),
    writing = useRef(false),
    seenSession = useRef("");
  const t = labels[lang],
    e = device?.entities ?? {};
  const fresh =
    watchFresh(connected, readAt, now) && e.connection?.state === "on";
  const controls =
    fresh &&
    !busy &&
    !device?.ambiguous &&
    e.controls_available?.state === "on" &&
    e.automatik?.state === "off";
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const json = await wearableBridge?.loadWatchSession();
        if (!alive || !json || json === seenSession.current) return;
        const session = watchSession(JSON.parse(json));
        seenSession.current = json;
        const store: SessionStore = {
          load: async () => session,
          save: async () => {},
          clear: async () => {
            await wearableBridge?.clearWatchSession();
          },
        };
        setClient((old) => {
          old?.suspend();
          return restoreClient(session, store);
        });
        setLang(session.language);
        setDevice(undefined);
        setConnected(false);
        setConfirm(null);
      } catch {
        if (alive) setError(t.stale);
      }
    }
    void load();
    const id = setInterval(() => {
      if (active.current) void load();
    }, 2500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  useEffect(() => {
    const l = AppState.addEventListener("change", (state) => {
      active.current = state === "active";
      setConnected(false);
      setConfirm(null);
      abort.current?.abort();
      if (!active.current) client?.suspend();
      setRevision((v) => v + 1);
    });
    return () => l.remove();
  }, [client]);
  useEffect(() => {
    if (!client || !active.current) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      if (!alive) return;
      if (!writing.current) {
        const c = new AbortController();
        abort.current = c;
        try {
          const ds = discover(await client!.states(c.signal));
          if (alive && !c.signal.aborted) {
            setDevice(ds.find((d) => d.id === client!.session.gatewayId));
            setConnected(true);
            setReadAt(Date.now());
            setNow(Date.now());
          }
        } catch {
          if (alive) setConnected(false);
        }
      }
      if (alive) timer = setTimeout(poll, 5000);
    }
    void poll();
    return () => {
      alive = false;
      clearTimeout(timer);
      abort.current?.abort();
      client.suspend();
    };
  }, [client, revision]);
  async function send() {
    const pending = confirm;
    setConfirm(null);
    if (!pending) return;
    if (pending.unlink) {
      abort.current?.abort();
      client?.suspend();
      await wearableBridge?.clearWatchSession();
      seenSession.current = "";
      setClient(null);
      setDevice(undefined);
      setConnected(false);
      return;
    }
    if (
      !pending.command ||
      !client ||
      !device ||
      !active.current ||
      writing.current
    )
      return;
    try {
      watchCommand(device, pending.command, readAt);
      writing.current = true;
      setBusy(true);
      abort.current?.abort();
      const c = new AbortController();
      abort.current = c;
      const ds = await client.command(
        client.session.gatewayId,
        pending.command,
        c.signal,
      );
      if (!c.signal.aborted && active.current) {
        setDevice(ds.find((d) => d.id === client.session.gatewayId));
        setReadAt(Date.now());
        setNow(Date.now());
        setConnected(true);
        setError("");
      }
    } catch {
      setConnected(false);
      setError(t.error);
    } finally {
      writing.current = false;
      setBusy(false);
      setRevision((v) => v + 1);
    }
  }
  const button = (text: string, action: () => void, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={action}
      style={[s.button, disabled && { opacity: 0.4 }]}
    >
      <Text style={s.buttonText}>{text}</Text>
    </Pressable>
  );
  const number = (key: NumberKey) => {
    try {
      const value = parseNumber(drafts[key] ?? "", key);
      setConfirm({
        command: { key, value },
        label: `${t.settingsKeys[key]}: ${value}`,
      });
    } catch {
      setError(`${NUMBERS[key].min}–${NUMBERS[key].max} ${NUMBERS[key].unit}`);
    }
  };
  const inset = Math.max(22, Math.round(Dimensions.get("window").width * 0.12));
  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingHorizontal: inset }]}
      >
        <Text style={s.title}>{t.title}</Text>
        {!client ? (
          <>
            <Text style={s.text}>{t.pair}</Text>
            {button(t.reload, () => setRevision((v) => v + 1))}
          </>
        ) : (
          <>
            <Text style={s.status}>
              {fresh ? (lang === "de" ? "Verbunden" : "Connected") : t.offline}
            </Text>
            <Text style={s.text}>
              {t.chamber}: {fresh ? (numeric(e.kammertemperatur) ?? "—") : "—"}{" "}
              {(e.kammertemperatur?.attributes.unit_of_measurement as string) ||
                "°C"}
            </Text>
            <Text style={s.text}>
              {t.core}: {fresh ? (numeric(e.kerntemperatur) ?? "—") : "—"}{" "}
              {(e.kerntemperatur?.attributes.unit_of_measurement as string) ||
                "°C"}
            </Text>
            <Text style={s.text}>
              {t.smoke}: {fresh ? (numeric(e.raucheinstellung) ?? "—") : "—"} %
            </Text>
            <Text style={s.text}>
              {t.timer}: {fresh ? formatTimer(e.timer_restzeit) : "—"}
            </Text>
            {button(
              t.reload,
              () => {
                setConnected(false);
                setRevision((v) => v + 1);
              },
              busy,
            )}
            <Text style={s.heading}>{t.settings}</Text>
            {(Object.keys(NUMBERS) as NumberKey[]).map((key) => (
              <View key={key} style={s.group}>
                <Text style={s.small}>
                  {t.settingsKeys[key]} ·{" "}
                  {fresh ? (numeric(e[key]) ?? "—") : "—"}
                </Text>
                <TextInput
                  accessibilityLabel={t.settingsKeys[key]}
                  style={s.input}
                  editable={controls}
                  keyboardType="number-pad"
                  value={drafts[key] ?? ""}
                  onChangeText={(v) =>
                    setDrafts((old) => ({ ...old, [key]: v }))
                  }
                />
                {button(
                  lang === "de" ? "Übernehmen" : "Apply",
                  () => number(key),
                  !controls || !available(e[key]),
                )}
              </View>
            ))}
            {(Object.keys(t.switches) as SwitchKey[]).map((key) => (
              <View key={key}>
                {button(
                  `${t.switches[key]}: ${!fresh || !available(e[key]) ? "—" : e[key]?.state === "on" ? (lang === "de" ? "EIN" : "ON") : lang === "de" ? "AUS" : "OFF"}`,
                  () =>
                    setConfirm({
                      command: { key, value: e[key]?.state !== "on" },
                      label: `${t.switches[key]} ${e[key]?.state === "on" ? (lang === "de" ? "ausschalten" : "off") : lang === "de" ? "einschalten" : "on"}`,
                    }),
                  !controls || !available(e[key]),
                )}
              </View>
            ))}
            {button(
              lang === "de" ? "Timer zurücksetzen" : "Reset timer",
              () =>
                setConfirm({
                  command: { key: "timer_reset" },
                  label: lang === "de" ? "Timer zurücksetzen" : "Reset timer",
                }),
              !controls || !available(e.timer_reset),
            )}
            {button(
              t.unlink,
              () => setConfirm({ unlink: true, label: t.unlinkAsk }),
              busy,
            )}
          </>
        )}
        {!!error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
        <Text style={s.small}>{busy ? t.busy : "Drevos · Watch"}</Text>
      </ScrollView>
      <Modal
        visible={!!confirm}
        transparent
        onRequestClose={() => setConfirm(null)}
      >
        <View style={s.modal}>
          <ScrollView
            contentContainerStyle={[s.content, { paddingHorizontal: inset }]}
          >
            <Text style={s.text}>{confirm?.label}</Text>
            <Text style={s.small}>{confirm?.unlink ? "" : t.confirm}</Text>
            {button(t.send, () => void send(), busy)}
            {button(t.cancel, () => setConfirm(null), busy)}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#101315" },
  content: { paddingVertical: 30, gap: 10 },
  title: {
    fontSize: 24,
    textAlign: "center",
    fontWeight: "700",
    color: "#ffad62",
  },
  heading: {
    fontSize: 18,
    color: "#f5f1ea",
    textAlign: "center",
    marginTop: 12,
  },
  text: { fontSize: 16, color: "#f5f1ea", textAlign: "center" },
  small: { fontSize: 13, color: "#a9b4b9", textAlign: "center" },
  status: { fontSize: 13, color: "#82c9a5", textAlign: "center" },
  button: {
    backgroundColor: "#ffad62",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minHeight: 44,
  },
  buttonText: {
    fontWeight: "700",
    fontSize: 14,
    color: "#101315",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#293238",
    color: "#fff",
    fontSize: 20,
    borderRadius: 12,
    padding: 8,
    textAlign: "center",
  },
  group: { gap: 8, marginVertical: 8 },
  error: { color: "#ffb0a4", fontSize: 13, textAlign: "center" },
  modal: { flex: 1, backgroundColor: "#101315", justifyContent: "center" },
});
