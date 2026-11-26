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
    "40 Drevos-Originalrezepte mit Zutaten, Anleitung und aufbereiteten Produktbildern.",
    "Jede Phase einzeln auswählen und ihre Werte gemeinsam übertragen. Heizung, Rauch/Zündung und Timer selbst starten; keine automatische Folgephase.",
    "Eigene Rezepte mit Foto im Browser speichern oder per Formular zur Prüfung einreichen.",
    "Quellenhinweise zeigen widersprüchliche Angaben und die vermutete Korrektur 85/55 °C bei Rippen, Methode 2. Kein Pi-Update nötig.",
  ],
  en: [
    "40 Drevos original recipes with ingredients, instructions and restored food photographs.",
    "Select each phase and transfer its settings together. Start heat, smoke/ignition and timer yourself; no automatic next phase.",
    "Save personal recipes and photos in the browser, or submit them for review with the form.",
    "Source notes preserve conflicting values and the suggested 85/55 °C correction for Ribs, method 2. No Pi update required.",
  ],
};
