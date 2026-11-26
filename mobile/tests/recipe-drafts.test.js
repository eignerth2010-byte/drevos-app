import { describe, it, expect, beforeEach } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import {
  normalizeDraft,
  saveRecipe,
  loadRecipe,
  listRecipes,
  deleteRecipe,
} from "../public/recipe-drafts.js";
const draft = () => ({
  name: "Mein Rezept",
  ingredients: "Zutaten",
  method: "Zubereitung",
  notes: "",
  source: { kind: "drevos_original" },
  token: "not-a-real-secret",
  consent: true,
  phases: [
    {
      name: "Räuchern",
      durationMinutes: "0",
      chamberC: "85",
      coreC: "72",
      smokePercent: "0",
      convection: "unknown",
      fan: "false",
    },
  ],
});
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
});
describe("Isolated personal recipe drafts", () => {
  it("keeps real zero and unknown fan values, never copies identity or consent", () => {
    const r = normalizeDraft(draft());
    expect(r.phases[0]).toMatchObject({
      durationMinutes: "0",
      fan: "false",
      convection: "unknown",
    });
    expect(Object.keys(r)).toEqual([
      "schemaVersion",
      "name",
      "ingredients",
      "method",
      "notes",
      "phases",
    ]);
    const bad = draft();
    bad.phases[0].chamberC = "185";
    expect(() => normalizeDraft(bad)).toThrow("range");
  });
  it("persists drafts independently and rejects concurrent overwrites", async () => {
    const a = await saveRecipe(draft(), null);
    const b = await saveRecipe({ ...draft(), name: "Überarbeitet" }, null, a);
    await expect(saveRecipe(draft(), null, a)).rejects.toThrow("conflict");
    expect((await loadRecipe(b.id)).recipe.name).toBe("Überarbeitet");
    expect(await listRecipes()).toHaveLength(1);
    await expect(deleteRecipe(a)).rejects.toThrow("conflict");
    await deleteRecipe(b);
    expect(await listRecipes()).toEqual([]);
  });
  it("refuses unsupported attachments without replacing saved content", async () => {
    const a = await saveRecipe(draft(), null);
    await expect(
      saveRecipe(
        draft(),
        new File(["x"], "script.svg", { type: "image/svg+xml" }),
        a,
      ),
    ).rejects.toThrow("photo");
    expect((await loadRecipe(a.id)).revision).toBe(1);
  });
});
