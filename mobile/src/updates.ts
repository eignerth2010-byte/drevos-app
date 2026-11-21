export type AndroidRelease = {
  schema: 1;
  version: string;
  versionCode: number;
  downloadUrl: string;
  sha256: string;
};
export type UpdatePreferences = { automatic: boolean; lastChecked: number };
export type UpdateStatus =
  "idle" | "current" | "available" | "network" | "settings";
export type AndroidUpdates = {
  automatic: boolean;
  ready: boolean;
  checking: boolean;
  lastChecked: number;
  status: UpdateStatus;
  available: AndroidRelease | null;
  check: () => void;
  setAutomatic: (enabled: boolean) => void;
};
export const UPDATE_INTERVAL = 24 * 60 * 60 * 1000;

/** Public release data may name only an APK in this project's GitHub releases. */
export function parseAndroidRelease(text: string): AndroidRelease {
  if (text.length > 8192) throw new Error("invalid-update");
  const value = JSON.parse(text) as AndroidRelease;
  if (
    !value ||
    value.schema !== 1 ||
    !/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(value.version ?? "") ||
    !Number.isSafeInteger(value.versionCode) ||
    value.versionCode < 1 ||
    value.versionCode > 2100000000 ||
    !/^[a-f0-9]{64}$/.test(value.sha256 ?? "") ||
    typeof value.downloadUrl !== "string"
  )
    throw new Error("invalid-update");
  const url = new URL(value.downloadUrl);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/eignerth2010-byte\/drevos-app\/releases\/download\/[A-Za-z0-9._-]+\/Drevos-Android-[A-Za-z0-9._-]+\.apk$/.test(
      url.pathname,
    )
  )
    throw new Error("invalid-update");
  return {
    schema: 1,
    version: value.version,
    versionCode: value.versionCode,
    downloadUrl: url.href,
    sha256: value.sha256,
  };
}

export function automaticCheckDue(preferences: UpdatePreferences, now: number) {
  return (
    preferences.automatic &&
    (!preferences.lastChecked ||
      now < preferences.lastChecked ||
      now - preferences.lastChecked >= UPDATE_INTERVAL)
  );
}

export function parseUpdatePreferences(text: string | null): UpdatePreferences {
  if (!text) return { automatic: true, lastChecked: 0 };
  const value = JSON.parse(text) as UpdatePreferences;
  if (
    typeof value.automatic !== "boolean" ||
    !Number.isFinite(value.lastChecked) ||
    value.lastChecked < 0
  )
    throw new Error("invalid-settings");
  return { automatic: value.automatic, lastChecked: value.lastChecked };
}
