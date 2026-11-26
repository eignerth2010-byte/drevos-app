import { describe, it, expect } from "vitest";
import {
  recipes,
  recipePhase,
  phaseCommands,
  requireIdle,
  verifyPrepared,
} from "../src/recipes";
import { discover } from "../src/model";
import { demoStates } from "../src/demo";
import catalog from "../public/recipes/catalog.json";

describe("Recipe preparation without automatic starts", () => {
  it("retains forty original sources and explicitly identifies the user correction", () => {
    expect(
      recipes.filter((r) => r.source.kind === "drevos_original").length,
    ).toBeGreaterThanOrEqual(40);
    expect(new Set(recipes.map((r) => r.id)).size).toBe(recipes.length);
    const r = catalog.recipes.find((r) => r.id === "rippen-methode-2")!;
    expect(r.originalDisplaySettings?.[1]).toEqual([150, 185, 155, 100]);
    expect(r.correction?.status).toBe("user_suggested");
    expect(recipePhase(r.id, 1)).toMatchObject({ chamberC: 85, coreC: 55 });
  });
  it("never turns a zero source time into a one-minute timer or starts equipment", () => {
    const commands = phaseCommands(recipePhase("krakauer-wuerstchen", 1));
    expect(commands).toEqual([
      { key: "kammertemperatur_soll", value: 88 },
      { key: "kerntemperatur_ziel", value: 60 },
      { key: "rauch_soll", value: 100 },
    ]);
    expect(
      commands.some((c) => !("value" in c) || typeof c.value !== "number"),
    ).toBe(false);
  });
  it("refuses unused phases and arbitrary recipe IDs", () => {
    expect(() => recipePhase("haehnchenfilet-rollen", 0)).toThrow(
      "recipe-empty",
    );
    expect(() => recipePhase("not-a-recipe", 0)).toThrow();
    expect(() => recipePhase("lachs-kalt", 99)).toThrow();
  });
  it("requires heat, smoke and timer off and verifies all actual setpoints", () => {
    const d = discover(demoStates())[0];
    for (const key of ["heizelement", "rauchbetrieb", "timer_lauf"])
      d.entities[key].state = "off";
    expect(() => requireIdle(d)).not.toThrow();
    const commands = phaseCommands(recipePhase("lachs-kalt", 0));
    for (const c of commands)
      if ("value" in c) d.entities[c.key].state = String(c.value);
    expect(() => verifyPrepared(d, commands)).not.toThrow();
    d.entities.kammertemperatur_soll.state = "21";
    expect(() => verifyPrepared(d, commands)).toThrow("recipe-readback");
    d.entities.rauchbetrieb.state = "on";
    expect(() => requireIdle(d)).toThrow("recipe-idle");
  });
});
