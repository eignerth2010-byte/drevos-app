import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function worker(online = false) {
  const listeners: Record<string, (event: any) => void> = {};
  const match = vi.fn(async () => new Response("offline application shell"));
  const fetch = vi.fn(async () => {
    if (online) return new Response("current published HTML");
    throw Error("offline");
  });
  const code = readFileSync(
    new URL("../public/sw-template.js", import.meta.url),
    "utf8",
  )
    .replace("__CACHE_NAME__", '"drevos-shell-test"')
    .replace("__ASSETS__", '["/index.html","/app.js"]');
  vm.runInNewContext(code, {
    URL,
    Set,
    Error,
    Promise,
    fetch,
    caches: { open: async () => ({ match }) },
    self: {
      location: { origin: "https://app.example" },
      addEventListener: (name: string, fn: any) => (listeners[name] = fn),
    },
  });
  return { listeners, match, fetch };
}
describe("offline shell boundary", () => {
  it("loads the current published app on navigation without cached HTML or forced activation", async () => {
    const x = worker(true);
    const request = {
      method: "GET",
      url: "https://app.example/",
      mode: "navigate",
    };
    let result: Promise<Response> | undefined;
    x.listeners.fetch({
      request,
      respondWith: (r: Promise<Response>) => (result = r),
    });
    expect(await (await result!).text()).toBe("current published HTML");
    expect(x.fetch).toHaveBeenCalledWith(request, { cache: "no-store" });
    expect(x.match).not.toHaveBeenCalled();
    expect(x.listeners.message).toBeUndefined();
  });
  it.each([
    { method: "POST", url: "https://app.example/api/v1/command", mode: "cors" },
    { method: "GET", url: "https://app.example/api/v1/state", mode: "cors" },
    {
      method: "GET",
      url: "https://relay.example/v1/rooms/private/socket",
      mode: "cors",
    },
    {
      method: "GET",
      url: "https://app.example/index.html?pairing=private",
      mode: "navigate",
    },
  ])("never intercepts or queues private/API traffic: $url", (request) => {
    const x = worker(),
      respondWith = vi.fn();
    x.listeners.fetch({ request, respondWith });
    expect(respondWith).not.toHaveBeenCalled();
    expect(x.match).not.toHaveBeenCalled();
    expect(x.fetch).not.toHaveBeenCalled();
  });
  it("opens only the cached public shell during an offline navigation", async () => {
    const x = worker();
    let result: Promise<Response> | undefined;
    x.listeners.fetch({
      request: { method: "GET", url: "https://app.example/", mode: "navigate" },
      respondWith: (r: Promise<Response>) => (result = r),
    });
    expect(await (await result!).text()).toBe("offline application shell");
    expect(x.match).toHaveBeenCalledWith("/index.html");
  });
});
