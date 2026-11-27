import React, { useEffect, useState } from "react";
import { Text, View, Pressable, StyleSheet, Platform } from "react-native";
import { PiClient, Language } from "./gateway";
import { wearableBridge, WatchPeer } from "./wearableBridge";
import { watchSession } from "./wearableModel";
export function WearableTools({
  client,
  language,
}: {
  client: PiClient | null;
  language: Language;
}) {
  const [peers, setPeers] = useState<WatchPeer[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const de = language === "de";
  useEffect(() => {
    void wearableBridge
      ?.getPeers()
      .then(setPeers)
      .catch(() => {});
  }, []);
  if (!wearableBridge) return null;
  async function pair(peer: WatchPeer) {
    if (!client || busy) return;
    setBusy(true);
    try {
      const session = watchSession(client.session);
      await wearableBridge!.sendSession(peer.id, JSON.stringify(session));
      setMessage(
        de
          ? "Kopplung gesendet. Öffne Drevos auf der Uhr und prüfe die Verbindung."
          : "Pairing sent. Open Drevos on the watch and check the connection.",
      );
    } catch {
      setMessage(
        de
          ? "Kopplung nicht möglich. Öffne die Uhren-App; verwende die Fernzugriffskopplung in der Handy-App."
          : "Pairing failed. Open the watch app and use cloud pairing in the phone app.",
      );
    } finally {
      setBusy(false);
    }
  }
  const button = (title: string, action: () => void, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || busy}
      style={[s.button, (disabled || busy) && { opacity: 0.4 }]}
      onPress={action}
    >
      <Text style={s.buttonText}>{title}</Text>
    </Pressable>
  );
  return (
    <View style={s.card}>
      <Text style={s.title}>
        {de ? "Uhr & Autoanzeige" : "Watch & car display"}
      </Text>
      <Text style={s.text}>
        {de
          ? "Die Uhren-App einmal installieren und öffnen. Anschließend die gekoppelte Uhr hier auswählen. Die Uhr bekommt eine geschützte Kopie deiner Fernzugriffskopplung und kann danach selbst über WLAN/LTE verbinden."
          : "Install and open the watch app, then choose your paired watch here. It receives a protected copy of your cloud pairing and can then connect over Wi-Fi/LTE itself."}
      </Text>
      {button(
        de ? "Uhren suchen" : "Find watches",
        () =>
          void wearableBridge!
            .getPeers()
            .then(setPeers)
            .catch(() =>
              setMessage(de ? "Keine Uhr erreichbar." : "No watch reachable."),
            ),
      )}
      {peers.map((peer) => (
        <View key={peer.id}>
          {button(
            (de ? "Koppeln: " : "Pair: ") + peer.name,
            () => void pair(peer),
            !client?.session.cloud,
          )}
        </View>
      ))}
      {!peers.length && (
        <Text style={s.text}>
          {de
            ? "Keine erreichbare Uhren-App. Bluetooth-Kopplung und Uhren-App prüfen."
            : "No watch app reachable. Check phone/watch pairing and open the watch app."}
        </Text>
      )}
      {Platform.OS === "android" && (
        <>
          <Text style={s.title}>Android Auto</Text>
          <Text style={s.text}>
            {de
              ? "Temperaturen, Rauchwert und Restzeit im Auto ansehen. Nach der Freischaltung liest Android Auto die Werte selbst über deine geschützte Fernzugriffskopplung, solange die Autoanzeige geöffnet ist. Hier werden keine Ofenbefehle angeboten."
              : "View temperatures, smoke and remaining time in the car. Once enabled, Android Auto reads over your protected cloud pairing while its screen is open. No oven controls are offered here."}
          </Text>
          {button(
            de ? "Android Auto freischalten" : "Enable Android Auto",
            () => {
              if (!client) return;
              try {
                const session = watchSession(client.session);
                void wearableBridge!
                  .configureCarAccess(JSON.stringify(session))
                  .then(() =>
                    setMessage(
                      de
                        ? "Android Auto freigeschaltet. Drevos im Auto öffnen."
                        : "Android Auto enabled. Open Drevos in the car.",
                    ),
                  )
                  .catch(() =>
                    setMessage(
                      de
                        ? "Freischaltung fehlgeschlagen."
                        : "Could not enable Android Auto.",
                    ),
                  );
              } catch {
                setMessage(
                  de
                    ? "Eine Fernzugriffskopplung ist erforderlich."
                    : "Cloud pairing is required.",
                );
              }
            },
            !client?.session.cloud,
          )}
          {button(
            de ? "Android Auto trennen" : "Disable Android Auto",
            () =>
              void wearableBridge!
                .clearCarAccess()
                .then(() =>
                  setMessage(
                    de ? "Android Auto getrennt." : "Android Auto disabled.",
                  ),
                )
                .catch(() =>
                  setMessage(
                    de
                      ? "Trennen fehlgeschlagen."
                      : "Could not disable Android Auto.",
                  ),
                ),
          )}
        </>
      )}
      {Platform.OS === "ios" && (
        <>
          <Text style={s.title}>
            {de ? "Live-Aktivität / CarPlay" : "Live Activity / CarPlay"}
          </Text>
          <Text style={s.text}>
            {de
              ? "Zeigt Temperaturen und Restzeit. Aktualisiert, solange die Handy-App aktiv ist. Im Hintergrund kennzeichnet der Zeitstempel ältere Werte; diese Anzeige ersetzt keinen Alarm. CarPlay unterstützt die kleine Anzeige ab iOS 26."
              : "Shows temperatures and remaining time. Updates while the phone app is active. In the background, timestamps identify older readings; this display is not an alarm. The small CarPlay display requires iOS 26."}
          </Text>
          {button(
            de ? "Statusanzeige starten" : "Start status display",
            () =>
              void wearableBridge!
                .startLiveActivity()
                .then((ok) =>
                  setMessage(
                    ok
                      ? de
                        ? "Statusanzeige gestartet."
                        : "Status display started."
                      : de
                        ? "Nicht verfügbar. Live-Aktivitäten und Verbindung prüfen."
                        : "Unavailable. Check Live Activities and connection.",
                  ),
                )
                .catch(() =>
                  setMessage(
                    de
                      ? "Statusanzeige nicht verfügbar."
                      : "Status display unavailable.",
                  ),
                ),
            !client,
          )}
          {button(
            de ? "Statusanzeige beenden" : "End status display",
            () => void wearableBridge!.stopLiveActivity().catch(() => {}),
          )}
        </>
      )}
      {!!message && (
        <Text accessibilityRole="alert" style={s.text}>
          {message}
        </Text>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    padding: 18,
    gap: 12,
    backgroundColor: "#1c2226",
    borderRadius: 18,
    marginVertical: 14,
  },
  title: { fontSize: 20, fontWeight: "700", color: "#f5f1ea" },
  text: { color: "#a9b4b9", fontSize: 15, lineHeight: 22 },
  button: { backgroundColor: "#ffad62", padding: 14, borderRadius: 12 },
  buttonText: { color: "#101315", textAlign: "center", fontWeight: "700" },
});
