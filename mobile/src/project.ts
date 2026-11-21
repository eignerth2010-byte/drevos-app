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
    "Neuer Info-Tab mit Projektinformationen und Thomas Eigner als Ersteller.",
    "Freiwillig über den PayPal-Spendenbutton unterstützen.",
    "Android: automatische Updateprüfung einstellbar, mit Downloadhinweis für neue APKs.",
    "Änderungsübersicht nach Updates und sichtbare Versionsnummer in beiden Apps.",
  ],
  en: [
    "New Info tab with project details and creator Thomas Eigner.",
    "Support development with an optional PayPal donation.",
    "Android: configurable update checks and download notices for new APKs.",
    "Release notes after updates and visible version numbers in both apps.",
  ],
};
