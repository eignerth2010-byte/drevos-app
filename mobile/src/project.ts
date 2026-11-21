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
    "Eigener vorläufiger Drevos-Schriftzug statt Herstellerlogo.",
    "Private und betriebsinterne Nutzung bleiben kostenlos.",
    "Verkauf und kommerzielle Weitergabe nur mit vorheriger schriftlicher Freigabe von Thomas Eigner.",
    "Frühere MIT-Fassungen behalten ihre Rechte. Kopplung und Ofensteuerung bleiben unverändert.",
  ],
  en: [
    "Original temporary community wordmark replaces the manufacturer logo.",
    "Private and internal business use remain free.",
    "Resale and commercial redistribution require Thomas Eigner’s prior written permission.",
    "Earlier MIT versions retain their rights. Pairing and oven controls are unchanged.",
  ],
};
