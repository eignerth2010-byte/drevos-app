import React, { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import {
  APP_VERSION,
  PROJECT_AUTHOR,
  DONATION_URL,
  PROJECT_URL,
} from "./project";
import { AndroidUpdates } from "./updates";

export function About({
  language,
  busy,
  updates,
  onShowChanges,
  onLanguage,
}: {
  language: "de" | "en";
  busy: boolean;
  updates: AndroidUpdates | null;
  onShowChanges: () => void;
  onLanguage: (language: "de" | "en") => void;
}) {
  const german = language === "de",
    [error, setError] = useState("");
  const copy = german
    ? {
        title: "Info & Unterstützen",
        created: "Erstellt von",
        project: "Unabhängiges Community-Projekt",
        support: "Dir hilft die App?",
        thanks:
          "Mit einer freiwilligen Spende unterstützt du die Weiterentwicklung. Vielen Dank!",
        donate: "Über PayPal unterstützen",
        voluntary:
          "Öffnet PayPal im Browser. Die Spende ist freiwillig; Nutzung bleibt kostenlos. Verkauf und kommerzielle Weitergabe nur mit schriftlicher Freigabe von Thomas Eigner.",
        github: "Projekt auf GitHub",
        guide: "Installationsanleitung",
        notes: "Was ist neu?",
        version: "Version",
        updates: "Android-Updates",
        auto: "Automatisch nach Updates suchen",
        frequency:
          "Beim Öffnen der App, höchstens einmal täglich. Übertragen werden keine Ofen- oder Kopplungsdaten.",
        check: "Jetzt prüfen",
        checking: "Wird geprüft …",
        current: "Du verwendest die aktuelle veröffentlichte Android-Version.",
        download: "Update herunterladen",
        available: "Neue Android-Version verfügbar",
        last: "Letzte Prüfung",
        install:
          "Der Download öffnet sich im Browser. Anschließend bestätigst du die APK-Installation am Android-Gerät. Deine bestehende App dabei aktualisieren; nicht vorher deinstallieren.",
        network:
          "Updates konnten nicht geprüft werden. Bitte später erneut versuchen.",
        settings:
          "Die Update-Einstellung konnte nicht gespeichert oder geladen werden.",
      }
    : {
        title: "Info & Support",
        created: "Created by",
        project: "Independent community project",
        support: "Finding the app useful?",
        thanks:
          "An optional donation helps support continued development. Thank you!",
        donate: "Support via PayPal",
        voluntary:
          "Opens PayPal in your browser. Donations are optional; private and internal business use remain free. Resale and commercial distribution require Thomas Eigner’s written permission.",
        github: "Project on GitHub",
        guide: "Installation guide",
        notes: "What’s new?",
        version: "Version",
        updates: "Android updates",
        auto: "Check for updates automatically",
        frequency:
          "When opening the app, at most once a day. No oven data or pairing credentials are sent.",
        check: "Check now",
        checking: "Checking …",
        current: "You have the current published Android version.",
        download: "Download update",
        available: "New Android version available",
        last: "Last check",
        install:
          "The download opens in your browser. Then confirm APK installation on Android. Update the existing app without uninstalling it first.",
        network: "Could not check for updates. Please try again later.",
        settings: "Could not save or load the update preference.",
      };
  async function open(url: string) {
    setError("");
    try {
      await Linking.openURL(url);
    } catch {
      setError(
        german
          ? "Der Link konnte nicht geöffnet werden."
          : "Could not open this link.",
      );
    }
  }
  function button(
    label: string,
    action: () => void,
    primary = false,
    disabled = false,
  ) {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={busy || disabled}
        onPress={action}
        style={({ pressed }) => [
          s.button,
          primary && s.primary,
          (busy || disabled) && s.disabled,
          pressed && { opacity: 0.75 },
        ]}
      >
        <Text style={[s.buttonText, primary && s.primaryText]}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <View style={s.stack}>
      <Text accessibilityRole="header" style={s.title}>
        {copy.title}
      </Text>
      <View style={s.card}>
        <Text style={s.eyebrow}>{copy.created}</Text>
        <Text style={s.name}>{PROJECT_AUTHOR}</Text>
        <Text style={s.body}>{copy.project}</Text>
        <Text style={s.muted}>
          {copy.version} {APP_VERSION} ·{" "}
          {Platform.OS === "web"
            ? "Web-App"
            : german
              ? "Eigenständige App"
              : "Standalone app"}
        </Text>
        {button(copy.notes, onShowChanges)}
      </View>
      <View style={s.card}>
        <Text style={s.heading}>{copy.support}</Text>
        <Text style={s.body}>{copy.thanks}</Text>
        {button(
          copy.donate,
          () => {
            void open(DONATION_URL);
          },
          true,
        )}
        <Text style={s.muted}>{copy.voluntary}</Text>
      </View>
      {!!updates && (
        <View style={s.card}>
          <Text style={s.heading}>{copy.updates}</Text>
          <View style={s.switchRow}>
            <Text style={[s.body, s.switchLabel]}>{copy.auto}</Text>
            <Switch
              accessibilityLabel={copy.auto}
              value={updates.automatic}
              disabled={!updates.ready}
              onValueChange={updates.setAutomatic}
              trackColor={{ false: "#45535b", true: "#96643d" }}
              thumbColor="#ffad62"
            />
          </View>
          <Text style={s.muted}>{copy.frequency}</Text>
          {button(
            updates.checking ? copy.checking : copy.check,
            updates.check,
            false,
            updates.checking || !updates.ready,
          )}
          {updates.available && (
            <>
              <Text accessibilityRole="alert" style={s.notice}>
                {copy.available}: {updates.available.version}
              </Text>
              {button(
                copy.download,
                () => {
                  void open(updates.available!.downloadUrl);
                },
                true,
              )}
              <Text style={s.muted}>{copy.install}</Text>
            </>
          )}
          {updates.status === "current" && (
            <Text style={s.body}>{copy.current}</Text>
          )}
          {(updates.status === "network" || updates.status === "settings") && (
            <Text accessibilityRole="alert" style={s.error}>
              {copy[updates.status]}
            </Text>
          )}
          {updates.lastChecked > 0 && (
            <Text style={s.muted}>
              {copy.last}:{" "}
              {new Date(updates.lastChecked).toLocaleString(language)}
            </Text>
          )}
        </View>
      )}
      <View style={s.card}>
        {button(copy.github, () => {
          void open(PROJECT_URL);
        })}
        {button(copy.guide, () => {
          void open(
            `${PROJECT_URL}/blob/main/docs/INSTALLATION.${language}.md`,
          );
        })}
        <View style={s.switchRow}>
          {button("Deutsch", () => onLanguage("de"))}
          {button("English", () => onLanguage("en"))}
        </View>
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  stack: { gap: 18 },
  card: {
    backgroundColor: "#1c2226",
    borderColor: "#343f45",
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    gap: 15,
  },
  title: { color: "#f5f1ea", fontSize: 26, fontWeight: "600" },
  eyebrow: { color: "#a9b4b9", fontSize: 15 },
  name: { color: "#ffad62", fontSize: 29, fontWeight: "600" },
  heading: { color: "#f5f1ea", fontSize: 21, fontWeight: "600" },
  body: { color: "#f5f1ea", fontSize: 17, lineHeight: 25 },
  muted: { color: "#a9b4b9", fontSize: 14, lineHeight: 21 },
  notice: { color: "#ffad62", fontSize: 17 },
  error: { color: "#ffb0a4", fontSize: 16 },
  button: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: "#26343c",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
  },
  primary: { backgroundColor: "#ffad62" },
  buttonText: {
    color: "#f5f1ea",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryText: { color: "#172026" },
  disabled: { opacity: 0.45 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  switchLabel: { flex: 1 },
});
