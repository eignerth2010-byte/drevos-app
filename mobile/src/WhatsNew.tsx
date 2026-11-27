import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { APP_VERSION, appPlatformName, releaseNotesFor } from "./project";
import { releaseStorage } from "./releaseStorage";

export function WhatsNew({
  language,
  allowed,
  openKey,
}: {
  language: "de" | "en";
  allowed: boolean;
  openKey: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let alive = true;
    void releaseStorage
      .get("notes.v1")
      .then((last) => {
        if (alive && last !== APP_VERSION) setVisible(true);
      })
      .catch(() => {
        if (alive) setVisible(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (openKey > 0) setVisible(true);
  }, [openKey]);
  function close() {
    setVisible(false);
    void releaseStorage.set("notes.v1", APP_VERSION).catch(() => {});
  }
  return (
    <Modal
      transparent
      visible={allowed && visible}
      animationType="fade"
      onRequestClose={close}
    >
      <View style={s.shade}>
        <View style={s.panel} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={s.content}>
            <Text style={s.eyebrow}>
              DREVOS {APP_VERSION} · {appPlatformName(Platform.OS, language)}
            </Text>
            <Text accessibilityRole="header" style={s.title}>
              {language === "de" ? "Was ist neu?" : "What’s new?"}
            </Text>
            {releaseNotesFor(Platform.OS, language).map((note) => (
              <Text key={note} style={s.body}>
                • {note}
              </Text>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={close}
              style={s.button}
            >
              <Text style={s.buttonText}>
                {language === "de" ? "Alles klar" : "Got it"}
              </Text>
            </Pressable>
            <Text style={s.hint}>
              {language === "de"
                ? "Diese Übersicht findest du später im Info-Tab."
                : "You can reopen these notes from the Info tab."}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  shade: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.82)",
    justifyContent: "center",
    padding: 20,
  },
  panel: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    alignSelf: "center",
    backgroundColor: "#1c2226",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#343f45",
  },
  content: { padding: 24, gap: 18 },
  eyebrow: {
    color: "#ffad62",
    fontSize: 14,
    letterSpacing: 2,
    fontWeight: "600",
  },
  title: { color: "#f5f1ea", fontSize: 28, fontWeight: "600" },
  body: { color: "#f5f1ea", fontSize: 17, lineHeight: 26 },
  hint: { color: "#a9b4b9", fontSize: 14, lineHeight: 21 },
  button: {
    backgroundColor: "#ffad62",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  buttonText: { color: "#172026", fontSize: 17, fontWeight: "600" },
});
