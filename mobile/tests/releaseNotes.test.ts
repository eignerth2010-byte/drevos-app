import { describe, expect, it } from "vitest";
import { appPlatformName, releaseNotesFor } from "../src/project";

describe("Release notes for the installed platform", () => {
  it.each(["de", "en"] as const)(
    "keeps Apple changes out of Android and Android changes out of iPhone (%s)",
    (language) => {
      const android = releaseNotesFor("android", language).join(" ");
      const ios = releaseNotesFor("ios", language).join(" ");
      expect(android).toContain("Wear OS");
      expect(android).toContain("Android Auto");
      expect(android).not.toMatch(/Apple|iPhone|iOS|watchOS|CarPlay/);
      expect(ios).toContain("Apple");
      expect(ios).toContain("CarPlay");
      expect(ios).not.toMatch(/Android|Wear OS|Galaxy|Tizen/);
    },
  );
  it.each(["de", "en"] as const)(
    "retains shared changes on web without unrelated native update notes (%s)",
    (language) => {
      const web = releaseNotesFor("web", language);
      expect(web.length).toBeGreaterThan(0);
      expect(web.join(" ")).not.toMatch(
        /Android|Wear OS|Apple|iPhone|iOS|watchOS|CarPlay/,
      );
      for (const platform of ["android", "ios", "windows"])
        for (const note of web)
          expect(releaseNotesFor(platform, language)).toContain(note);
    },
  );
  it("labels the platform clearly and returns an independent notes array", () => {
    expect(appPlatformName("android", "de")).toBe("Android-App");
    expect(appPlatformName("ios", "de")).toBe("iPhone-App");
    expect(appPlatformName("web", "de")).toBe("Web-App");
    const notes = releaseNotesFor("android", "de");
    notes.length = 0;
    expect(releaseNotesFor("android", "de").length).toBeGreaterThan(0);
  });
});
