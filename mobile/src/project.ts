import configuration from "../app.json";

export const APP_VERSION = configuration.expo.version;
export const ANDROID_VERSION_CODE = configuration.expo.android.versionCode;
export const PROJECT_AUTHOR = "Thomas Eigner";
export const DONATION_URL =
  "https://www.paypal.com/donate/?hosted_button_id=GSMP9644VUY8C";
export const PROJECT_URL = "https://github.com/eignerth2010-byte/drevos-app";
export const UPDATE_MANIFEST_URL =
  "https://raw.githubusercontent.com/eignerth2010-byte/drevos-app/main/mobile/public/android-update.json";

type Language = "de" | "en";
const RELEASE_NOTES = {
  common: {
    de: [
      "Die Neuerungenübersicht zeigt nur die Hinweise für deine App-Plattform und gemeinsame Änderungen.",
      "Vorhandene Rezepte und manuelle Phasenstarts bleiben erhalten. Kein Pi-Update erforderlich.",
    ],
    en: [
      "Release notes show only changes for your app platform and shared changes.",
      "Existing recipes and manual phase starts are retained. No Pi update is needed.",
    ],
  },
  android: {
    de: [
      "Eigene Wear-OS-App: Temperaturen und Timer ansehen, Sollwerte ändern und Funktionen einzeln bestätigen. Geschützte Kopplung über die Handy-App.",
      "Wear OS 3 oder neuer ist die Zielbasis, etwa auf Galaxy Watch4 und neueren Modellen. Alte Tizen-Uhren werden nicht unterstützt.",
      "Android Auto zeigt Temperaturen, Rauchwert und Restzeit. Im Info-Tab freischalten; die Autoanzeige liest aktuelle Werte selbst und bietet keine Ofenschaltbefehle.",
    ],
    en: [
      "Dedicated Wear OS app: view temperatures and timer, change targets and confirm each control action. Protected pairing transfer from the phone app.",
      "Targets Wear OS 3 or later, including Galaxy Watch4 and newer models. Legacy Tizen watches are not supported.",
      "Android Auto shows temperatures, smoke and remaining time. Enable it in Info; the car display reads current values itself and offers no oven controls.",
    ],
  },
  ios: {
    de: [
      "Apple-Watch-App mit geschützter Kopplung über das iPhone und eigenem verschlüsselten Fernzugriff. Temperaturen und Timer ansehen, Sollwerte ändern und Funktionen einzeln bestätigen.",
      "watchOS 8 oder neuer ist die Zielbasis. Die Watch-App wird mit der iPhone-App ausgeliefert.",
      "Live-Aktivität für Temperaturen und Restzeit, mit kleiner Darstellung für CarPlay ab iOS 26. Updates bei aktiver iPhone-App; ältere Werte werden gekennzeichnet. Keine Ofenschaltbefehle im Auto.",
    ],
    en: [
      "Apple Watch app with protected iPhone pairing transfer and its own encrypted remote connection. View temperatures and timer, change targets and confirm each control action.",
      "Targets watchOS 8 or later. The Watch app is included in the iPhone app package.",
      "Live Activity for temperatures and remaining time, with a small presentation for CarPlay on iOS 26. Updates while the iPhone app is active; older values are labelled. No oven controls in the car.",
    ],
  },
};

export function releaseNotesFor(
  platform: string,
  language: Language,
): string[] {
  const native =
    platform === "android" || platform === "ios"
      ? RELEASE_NOTES[platform][language]
      : [];
  return [...native, ...RELEASE_NOTES.common[language]];
}

export function appPlatformName(platform: string, language: Language): string {
  if (platform === "android")
    return language === "de" ? "Android-App" : "Android app";
  if (platform === "ios")
    return language === "de" ? "iPhone-App" : "iPhone app";
  if (platform === "web") return "Web-App";
  return language === "de" ? "Eigenständige App" : "Standalone app";
}
