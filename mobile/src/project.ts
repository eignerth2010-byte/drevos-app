import configuration from "../app.json";

export const APP_VERSION = configuration.expo.version;
export const ANDROID_VERSION_CODE = configuration.expo.android.versionCode;
export const PROJECT_AUTHOR = "Thomas Eigner";
export const DONATION_URL =
  "https://www.paypal.com/donate/?hosted_button_id=GSMP9644VUY8C";
export const PROJECT_URL = "https://github.com/eignerth2010-byte/drevos-app";
export const UPDATE_MANIFEST_URL =
  "https://raw.githubusercontent.com/eignerth2010-byte/drevos-app/main/mobile/public/android-update.json";

export const RELEASE_NOTES = {
  de: [
    "Eigene Bedienoberfläche für Wear OS: Temperaturen und Timer ansehen, Sollwerte ändern und Funktionen einzeln bestätigen.",
    "Apple-Watch-App mit geschützter Kopplung über das iPhone und eigenem verschlüsselten Fernzugriff.",
    "Uhren ab Wear OS 3 bzw. watchOS 8 sind die Zielbasis. Alte Tizen-Uhren verwenden eine andere Plattform.",
    "iOS-Live-Aktivität für Temperaturen und Restzeit, mit kleiner Darstellung für CarPlay ab iOS 26. Updates bei aktiver Handy-App; ältere Werte werden gekennzeichnet.",
    "Vorhandene Rezepte und manuelle Phasenstarts bleiben erhalten. Kein Pi-Update erforderlich.",
  ],
  en: [
    "Dedicated Wear OS interface: view temperatures and timer, change targets and confirm each control action.",
    "Apple Watch app with protected iPhone pairing transfer and its own encrypted remote connection.",
    "Targets Wear OS 3 and watchOS 8 or later. Legacy Tizen watches use a different platform.",
    "iOS Live Activity for temperatures and remaining time, with a small presentation for CarPlay on iOS 26. Updates while the phone app is active; older values are labelled.",
    "Existing recipes and manual phase starts are retained. No Pi update is needed.",
  ],
};
