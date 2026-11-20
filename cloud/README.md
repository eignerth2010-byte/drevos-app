# Shared Drevos relay – operator setup

Only the **project operator** provisions this service. Oven owners use the normal app's pairing flow, with no hosting account or subscription.

The supplied Pi package now includes the project's active endpoint, `https://drevos-relay.eigner-th2010.workers.dev`, in `endpoint.json`. Ordinary users do not run the operator deployment steps below. Deploying a separate relay is optional for a fork or a different operator.

The Worker and one SQLite-backed Durable Object per random oven room provide a live WebSocket relay. Readings, commands and end-to-end keys are not stored. The relay persists only a SHA-256 hash of a random transport credential. TLS plus authenticated end-to-end packets protect the actual oven traffic. See [protocol](../docs/PROTOCOL.md).

## One-time deployment

1. Sign into your own Cloudflare account and select the **Workers Free** plan. No paid subscription is needed for the initial limited deployment. Accept agreements yourself. Do not enable a paid plan without an explicit decision.
2. With Node.js 24:

```sh
cd cloud
npm ci
npm run check
npm run build
npm test
npx wrangler login --scopes account:read user:read workers_scripts:write
npm run deploy
```

3. Review the Wrangler authorization in the provider window yourself. `workers_scripts:write` is needed for scripts, Durable Objects, deployments and the public subdomain; the older generic `workers:write` scope alone is insufficient. Record the actual generated HTTPS `workers.dev` address. Create `cloud/endpoint.json` containing `{"relay":"https://YOUR-ACTUAL-RELAY.YOUR-ACCOUNT.workers.dev"}`. This address is public configuration, not a credential. The example file is not a working service.
4. Publish the endpoint with the installation package. End users then run the Pi installer without choosing a hosting provider; their private code includes this endpoint automatically.
5. Verify `/health`, a full encrypted Pi/app read exchange, disconnection/reconnection and native-device behavior before a public release.

The free plan has hard limits. Hibernating WebSockets reduce idle usage; no periodic temperature messages are sent when nobody is using the app. Exceeding a free quota can interrupt service. Capacity, uptime, abuse handling, privacy information and maintenance are the operator's responsibility. [Official limits and prices](https://developers.cloudflare.com/durable-objects/platform/pricing/).

No per-user fees or advertising are implemented. A free app for users does not guarantee zero operator expenses at unlimited scale. Other hosting systems can implement the same protocol; the current supplied deployment targets Cloudflare.

## Local verification

`npm run build` is a dry run and creates no public resources. `npm test` uses local Miniflare, simulated ovens and temporary storage. Development commands should set `WRANGLER_SEND_METRICS=false`. Production request/body logging is disabled in `wrangler.jsonc`.

Keep the SQLite migration in `wrangler.jsonc`; the free plan supports SQLite Durable Objects. The connection limiter limits new handshakes, each room limits open peers, and oversized/unauthenticated messages are rejected. An offline device receives no retained command after returning online.
