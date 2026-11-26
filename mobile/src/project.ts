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
    "Rezepte werden aus dem gemeinsamen Online-Katalog geladen. Neue Rezepte benötigen künftig kein App-Update.",
    "Mit „Rezepte aktualisieren“ neue Einträge laden. Der zuletzt gespeicherte Katalog bleibt ohne Internet lesbar; neue Fotos benötigen gegebenenfalls Internet.",
    "Originale und geprüfte Community-Rezepte werden getrennt gekennzeichnet.",
    "Eine bereits ausgewählte Phase behält ihre Werte. Jede Phase weiterhin selbst starten; kein Pi-Update nötig.",
  ],
  en: [
    "Recipes load from the shared online catalog. Future recipe additions do not require an app update.",
    "Use Refresh recipes to check for new entries. Saved catalog text/settings stay available offline; new photos may require a connection.",
    "Originals and reviewed community recipes have separate source labels.",
    "A selected phase keeps its settings. Start every phase yourself; no Pi update needed.",
  ],
};
