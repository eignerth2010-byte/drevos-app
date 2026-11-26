import type { Recipe, RecipePhase } from "./recipes";
export type RecipeCatalog = {
  schemaVersion: 1;
  updated: string;
  revision: string;
  recipes: Recipe[];
};
export type CatalogState = {
  catalog: RecipeCatalog;
  status: "bundled" | "cached" | "online" | "offline";
  busy: boolean;
  checkedAt: number | null;
  persistent: boolean;
};
export const CATALOG_URL: string;
export const CATALOG_KEY: string;
export const MAX_CATALOG_CHARS: number;
export function normalizeCatalog(value: unknown): RecipeCatalog;
export function phaseStamp(phase: RecipePhase): string;
export function recipeImageUrl(recipe: Recipe): string;
export function createCatalogClient(options: {
  fallback: unknown;
  store?: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<unknown>;
  };
  fetcher?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
  storageTimeoutMs?: number;
}): {
  snapshot(): CatalogState;
  subscribe(listener: (state: CatalogState) => void): () => void;
  refresh(force?: boolean): Promise<CatalogState>;
};
