import { describe, expect, it } from "vitest";
import {
  automaticCheckDue,
  parseAndroidRelease,
  parseUpdatePreferences,
  UPDATE_INTERVAL,
} from "../src/updates";
const release = {
  schema: 1,
  version: "0.3.0",
  versionCode: 3,
  downloadUrl:
    "https://github.com/eignerth2010-byte/drevos-app/releases/download/v0.3.0-preview.1/Drevos-Android-0.3.0-Vorschau.apk",
  sha256: "a".repeat(64),
};
describe("Android update data", () => {
  it("accepts an APK release in the owned GitHub repository", () => {
    expect(parseAndroidRelease(JSON.stringify(release))).toEqual(release);
  });
  it.each([
    "http://github.com/eignerth2010-byte/drevos-app/releases/download/v1/Drevos-Android-1.apk",
    "https://github.com.evil.test/eignerth2010-byte/drevos-app/releases/download/v1/Drevos-Android-1.apk",
    "https://github.com/another-owner/app/releases/download/v1/Drevos-Android-1.apk",
    release.downloadUrl + "?credential=value",
    release.downloadUrl.replace(".apk", ".js"),
  ])("rejects an untrusted or non-APK destination: %s", (downloadUrl) => {
    expect(() =>
      parseAndroidRelease(JSON.stringify({ ...release, downloadUrl })),
    ).toThrow();
  });
  it("rejects malformed release data and oversized responses", () => {
    expect(() =>
      parseAndroidRelease(JSON.stringify({ ...release, versionCode: -1 })),
    ).toThrow();
    expect(() =>
      parseAndroidRelease(JSON.stringify({ ...release, sha256: "bad" })),
    ).toThrow();
    expect(() => parseAndroidRelease(" ".repeat(8193))).toThrow();
  });
  it("respects opt-out, daily throttling and a corrected device clock", () => {
    expect(automaticCheckDue({ automatic: false, lastChecked: 0 }, 1000)).toBe(
      false,
    );
    expect(
      automaticCheckDue({ automatic: true, lastChecked: 1000 }, 1001),
    ).toBe(false);
    expect(
      automaticCheckDue(
        { automatic: true, lastChecked: 1000 },
        1000 + UPDATE_INTERVAL,
      ),
    ).toBe(true);
    expect(automaticCheckDue({ automatic: true, lastChecked: 1000 }, 999)).toBe(
      true,
    );
  });
  it("does not enable automatic checks from corrupted preferences", () => {
    expect(
      parseUpdatePreferences('{"automatic":false,"lastChecked":12}'),
    ).toEqual({ automatic: false, lastChecked: 12 });
    expect(() =>
      parseUpdatePreferences('{"automatic":"yes","lastChecked":0}'),
    ).toThrow();
  });
});
