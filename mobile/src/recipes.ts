import catalog from "../public/recipes/catalog.json";
import { Command, Device, commandFor, numeric } from "./model";
import { normalizeCatalog } from "./catalogClient";
export { phaseStamp } from "./catalogClient";

export type RecipePhase = {
  name: string;
  durationMinutes: number;
  chamberC: number;
  coreC: number;
  smokePercent: number;
  smokeFromProgram: boolean;
  convection: boolean | null;
  fan: boolean | null;
};
export type Recipe = {
  id: string;
  name: string;
  category: string;
  ingredients: string;
  method: string;
  notes: string;
  image: string;
  imageRevision: string;
  imageNote: string;
  source: {
    kind: string;
    author: string;
    reference: string;
    foodSafetyReviewed: false;
  };
  phases: RecipePhase[];
};
export const recipes: Recipe[] = [...normalizeCatalog(catalog).recipes];
export function replaceRecipes(value: unknown) {
  const next = normalizeCatalog(value);
  recipes.splice(0, recipes.length, ...next.recipes);
}
export const RECIPE_FORM =
  "https://drevos-smoker-control.thankfulchick1.chatgpt.site/recipe-submit.html";
export function recipePhase(id: string, index: number): RecipePhase {
  const recipe = recipes.find((recipe) => recipe.id === id);
  if (
    !recipe ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= recipe.phases.length
  )
    throw Error("recipe");
  const p = recipe.phases[index];
  for (const [value, max] of [
    [p.durationMinutes, 9999],
    [p.chamberC, 120],
    [p.coreC, 115],
    [p.smokePercent, 100],
  ])
    if (!Number.isInteger(value) || value < 0 || value > max)
      throw Error("recipe-range");
  if (
    p.chamberC === 0 &&
    p.coreC === 0 &&
    p.durationMinutes === 0 &&
    p.smokePercent === 0
  )
    throw Error("recipe-empty");
  return { ...p };
}
export function phaseCommands(p: RecipePhase): Command[] {
  for (const [value, max] of [
    [p.durationMinutes, 9999],
    [p.chamberC, 120],
    [p.coreC, 115],
    [p.smokePercent, 100],
  ])
    if (!Number.isInteger(value) || value < 0 || value > max)
      throw Error("recipe-range");
  // No switch command is produced. Preparing values can never start energy,
  // ignition, a timer, another phase or a delayed job.
  const list: Command[] = [
    { key: "kammertemperatur_soll", value: p.chamberC },
    { key: "kerntemperatur_ziel", value: p.coreC },
    { key: "rauch_soll", value: p.smokePercent },
  ];
  if (p.durationMinutes > 0)
    list.push({ key: "timer_dauer", value: p.durationMinutes });
  return list;
}
export function requireIdle(device: Device) {
  const e = device.entities;
  if (
    ["heizelement", "rauchbetrieb", "timer_lauf"].some(
      (key) => e[key]?.state !== "off",
    )
  )
    throw Error("recipe-idle");
}
export function verifyPrepared(device: Device, commands: Command[]) {
  requireIdle(device);
  verifyTargets(device, commands);
}
export function verifyTargets(device: Device, commands: Command[]) {
  for (const c of commands) {
    commandFor(device, c);
    if (!("value" in c) || numeric(device.entities[c.key]) !== c.value)
      throw Error("recipe-readback");
  }
}
