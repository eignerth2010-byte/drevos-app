import { afterEach, describe, it, expect, vi } from "vitest";
import fallback from "../public/recipes/catalog.json";
import {
  CATALOG_KEY,
  CATALOG_URL,
  MAX_CATALOG_CHARS,
  createCatalogClient,
  normalizeCatalog,
  phaseStamp,
  recipeImageUrl,
} from "../src/catalogClient";
import {
  recipes,
  replaceRecipes,
  recipePhase,
  phaseCommands,
} from "../src/recipes";

const BASE_COUNT = fallback.recipes.length;
const online = () => ({
  ...structuredClone(fallback),
  revision: "2026-11-26.2",
  recipes: [
    ...structuredClone(fallback.recipes),
    {
      ...structuredClone(fallback.recipes[0]),
      id: "community-test",
      name: "Community test",
      image: "community-test",
      source: {
        kind: "community",
        author: "Test author",
        reference: "Owner-reviewed submission",
      },
      imageNote: "Recipe photo",
    },
  ],
});
function memory(initial: string | null = null) {
  let saved = initial;
  return {
    getItem: vi.fn(async () => saved),
    setItem: vi.fn(async (key: string, value: string) => {
      expect(key).toBe(CATALOG_KEY);
      saved = value;
    }),
    value: () => saved,
  };
}
const response = (value: unknown) =>
  new Response(JSON.stringify(value), { status: 200 });
const failed = vi.fn(async () => {
  throw Error("offline");
});
afterEach(() => {
  vi.useRealTimers();
  replaceRecipes(fallback);
});
describe("public recipe updates without application updates", () => {
  it("loads a new community recipe anonymously and persists only normalized public data", async () => {
    const store = memory(),
      fetcher = vi.fn(async () =>
        response({
          ...online(),
          token: "not-cacheable",
          commands: ["do-not-run"],
        }),
      );
    const client = createCatalogClient({ fallback, store, fetcher });
    const result = await client.refresh();
    expect(result.status).toBe("online");
    expect(result.catalog.recipes).toHaveLength(BASE_COUNT + 1);
    expect(result.catalog.recipes.at(-1)?.source).toMatchObject({
      kind: "community",
      author: "Test author",
    });
    expect(fetcher.mock.calls).toHaveLength(1);
    expect((fetcher.mock.calls as unknown[][])[0]).toEqual([
      CATALOG_URL,
      expect.objectContaining({
        method: "GET",
        credentials: "omit",
        redirect: "error",
        cache: "no-store",
        signal: expect.any(AbortSignal),
      }),
    ]);
    expect(store.value()).not.toContain("not-cacheable");
    expect(store.value()).not.toContain("do-not-run");
    expect(JSON.parse(store.value()!).recipes).toHaveLength(BASE_COUNT + 1);
  });
  it("retains the newly downloaded catalog after restart without network access", async () => {
    const store = memory();
    await createCatalogClient({
      fallback,
      store,
      fetcher: async () => response(online()),
    }).refresh();
    const restarted = createCatalogClient({ fallback, store, fetcher: failed });
    const states: string[] = [];
    restarted.subscribe((s) => states.push(s.status));
    const result = await restarted.refresh();
    expect(states).toContain("cached");
    expect(result.status).toBe("offline");
    expect(result.catalog.recipes).toHaveLength(BASE_COUNT + 1);
  });
  it("rejects an entire malformed remote catalog while preserving the last good cache", async () => {
    const store = memory(JSON.stringify(normalizeCatalog(online()))),
      bad = online();
    bad.recipes[0].phases[0].chamberC = 121;
    const result = await createCatalogClient({
      fallback,
      store,
      fetcher: async () => response(bad),
    }).refresh();
    expect(result.status).toBe("offline");
    expect(result.catalog.recipes).toHaveLength(BASE_COUNT + 1);
    expect(store.setItem).not.toHaveBeenCalled();
  });
  it("never changes a selected phase when a remote update changes the same recipe", async () => {
    const chosen = recipePhase("rippen-methode-2", 1),
      stamp = phaseStamp(chosen),
      commands = phaseCommands(chosen),
      next = online();
    next.recipes.find((r) => r.id === "rippen-methode-2")!.phases[1].chamberC =
      90;
    replaceRecipes(next);
    expect(phaseStamp(recipePhase("rippen-methode-2", 1))).not.toBe(stamp);
    expect(phaseCommands(chosen)).toEqual(commands);
    expect(chosen.chamberC).toBe(85);
    expect(recipes).toHaveLength(BASE_COUNT + 1);
  });
  it("coalesces simultaneous refreshes and throttles automatic checks but permits manual refresh", async () => {
    let time = 0;
    const fetcher = vi.fn(async () => response(online()));
    const client = createCatalogClient({ fallback, fetcher, now: () => time });
    const a = client.refresh(),
      b = client.refresh(true);
    expect(a).toBe(b);
    await Promise.all([a, b]);
    await client.refresh();
    expect(fetcher).toHaveBeenCalledTimes(1);
    await client.refresh(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
    time = 31 * 60 * 1000;
    await client.refresh();
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("ignores late responses after timeout and releases the refresh button", async () => {
    vi.useFakeTimers();
    let release!: (value: Response) => void;
    const store = memory();
    const client = createCatalogClient({
      fallback,
      store,
      timeoutMs: 10,
      fetcher: () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    });
    const result = client.refresh();
    await vi.advanceTimersByTimeAsync(11);
    expect((await result).status).toBe("offline");
    expect(client.snapshot().busy).toBe(false);
    release(response(online()));
    await Promise.resolve();
    await Promise.resolve();
    expect(client.snapshot().catalog.recipes).toHaveLength(BASE_COUNT);
    expect(store.setItem).not.toHaveBeenCalled();
  });
  it("continues online when storage fails and does not claim persistence", async () => {
    const store = {
      getItem: async () => {
        throw Error("denied");
      },
      setItem: async () => {
        throw Error("full");
      },
    };
    const result = await createCatalogClient({
      fallback,
      store,
      fetcher: async () => response(online()),
    }).refresh();
    expect(result.status).toBe("online");
    expect(result.catalog.recipes).toHaveLength(BASE_COUNT + 1);
    expect(result.persistent).toBe(false);
  });
  it("bounds stalled storage so it cannot block catalog availability indefinitely", async () => {
    vi.useFakeTimers();
    const never = () => new Promise<null>(() => {});
    const client = createCatalogClient({
      fallback,
      store: { getItem: never, setItem: never },
      storageTimeoutMs: 5,
      fetcher: async () => response(online()),
    });
    const pending = client.refresh();
    await vi.advanceTimersByTimeAsync(12);
    expect((await pending).catalog.recipes).toHaveLength(BASE_COUNT + 1);
    expect(client.snapshot().busy).toBe(false);
    expect(client.snapshot().persistent).toBe(false);
  });
  it("uses bundled recipes if both cache and network are broken", async () => {
    const result = await createCatalogClient({
      fallback,
      store: memory("{bad json"),
      fetcher: failed,
    }).refresh();
    expect(result.catalog.recipes).toHaveLength(BASE_COUNT);
    expect(result.status).toBe("offline");
  });
  it("rejects unexpected schemas, duplicate IDs, broken sources and non-numeric controls", () => {
    for (const mutate of [
      (c: any) => (c.schemaVersion = 2),
      (c: any) => c.recipes.push(c.recipes[0]),
      (c: any) => (c.recipes[0].source.kind = "official-approved"),
      (c: any) => (c.recipes[0].phases[0].durationMinutes = -1),
      (c: any) => (c.recipes[0].phases[0].coreC = 116),
      (c: any) => (c.recipes[0].phases[0].smokePercent = "100"),
      (c: any) => (c.recipes[0].phases[0].fan = "on"),
      (c: any) => (c.updated = "2026-02-30"),
    ]) {
      const c = online();
      mutate(c);
      expect(() => normalizeCatalog(c)).toThrow();
    }
  });
  it("accepts only a fixed public image path and never an injected external URL", () => {
    const recipe = normalizeCatalog(online()).recipes.at(-1)!;
    expect(recipeImageUrl(recipe)).toBe(
      CATALOG_URL.replace("catalog.json", "images/community-test.jpg"),
    );
    expect(() =>
      recipeImageUrl({ ...recipe, image: "https://elsewhere.example/private" }),
    ).toThrow();
    expect(() =>
      recipeImageUrl({ ...recipe, imageRevision: "&token=private" }),
    ).toThrow();
  });
  it("rejects oversized bodies and HTTP failures without changing the active catalog", async () => {
    for (const makeResponse of [
      () => new Response("{}", { status: 503 }),
      () => new Response("x".repeat(MAX_CATALOG_CHARS + 1)),
      () =>
        new Response("{}", {
          headers: { "content-length": String(MAX_CATALOG_CHARS + 1) },
        }),
    ]) {
      const store = memory();
      const result = await createCatalogClient({
        fallback,
        store,
        fetcher: async () => makeResponse(),
      }).refresh();
      expect(result.catalog.recipes).toHaveLength(BASE_COUNT);
      expect(result.status).toBe("offline");
      expect(store.setItem).not.toHaveBeenCalled();
    }
  });
});
