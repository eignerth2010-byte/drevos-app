import React from "react";
import { Pressable, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Language } from "./gateway";
import { de, en } from "./strings";

export type ScannerProps = {
  language: Language;
  onResult: (text: string) => void;
};
export function PairingScanner({ language, onResult }: ScannerProps) {
  const [permission, request] = useCameraPermissions();
  const t = language === "de" ? de : en;
  return permission?.granted ? (
    <CameraView
      style={{ flex: 1 }}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      onBarcodeScanned={(r) => onResult(r.data)}
    />
  ) : (
    <View style={{ padding: 24, gap: 20 }}>
      <Text style={{ color: "#f5f1ea", fontSize: 17 }}>{t.cameraNeeded}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void request()}
        style={{ backgroundColor: "#ffad62", padding: 16, borderRadius: 12 }}
      >
        <Text style={{ fontSize: 17, color: "#172026" }}>{t.allowCamera}</Text>
      </Pressable>
    </View>
  );
}
