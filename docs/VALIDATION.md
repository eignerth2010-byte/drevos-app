# Validation – 2026-11-20

Standalone preview 0.2.0, local gateway patch 0.1.1. The earlier HA-dependent 0.1.0 app prototype is superseded and is not this app.

Completed local checks:

- Mobile TypeScript strict check; direct Pi API mapping, gateway identity/profile checks, protected pairing format, scalar limits, explicit target application and control guards.
- Mobile fault tests for fresh preflight reads, duplicate-tap rejection, no retries after failed commands, aborted requests, remote encrypted requests, missing ovens, background close/foreground reconnect and no accumulated offline sockets.
- AES-GCM tests reject modified ciphertext, wrong keys, reflected directions and wrong rooms. A fixed vector checks compatibility with the actual Python agent codec.
- Pi-agent tests cover one-use/expired/session-bound command tickets, replay rejection, exact command binding, busy rejection and fake-gateway dispatch.
- Local pairing-page tests cover QR/copy content, closure, no-store headers and foreign Host/Origin rejection.
- Local relay tests run the real compiled Worker in Miniflare with SQLite Durable Objects: authentication, both-direction opaque forwarding, offline status and no retained offline commands.
- Local gateway/controller tests use an isolated fake PLC and loopback HTTP server, including rejection of busy writes without touching the PLC.
- A real read-only request to the existing Pi gateway returned temperatures, smoke and timer values without any Home Assistant request. No physical write was sent during standalone development.

Still required: provision the operator's actual relay, run the live Pi agent through that relay, generate this installation's private pairing code, compile the 0.2.0 native apps, install/sign them, and test the full native lifecycle on real iOS/Android devices. Actual heating, smoke ignition and Pi power-off are not triggered by automated tests.

Browser preview demonstrates layout and simulated interactions. It does not prove camera permission, protected storage, clipboard behavior or networking on physical phones. Record native/compiler/live outcomes here as they complete. A Worker dry run or workflow file alone does not prove a deployed working service.
