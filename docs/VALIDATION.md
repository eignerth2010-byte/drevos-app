# Validation – 2026-11-20

Standalone preview 0.2.0, local gateway patch 0.1.1. The earlier HA-dependent 0.1.0 app prototype is superseded and is not this app.

Completed locally and in GitHub Actions (70 tests: 31 gateway, 7 Pi agent, 3 relay, 29 mobile):

- Mobile TypeScript strict check; direct Pi API mapping, gateway identity/profile checks, protected pairing format, scalar limits, explicit target application and control guards.
- Mobile fault tests for fresh preflight reads, duplicate-tap rejection, no retries after failed commands, aborted requests, remote encrypted requests, missing ovens, background close/foreground reconnect and no accumulated offline sockets.
- AES-GCM tests reject modified ciphertext, wrong keys, reflected directions and wrong rooms. A fixed vector checks compatibility with the actual Python agent codec.
- Pi-agent tests cover one-use/expired/session-bound command tickets, replay rejection, exact command binding, busy rejection and fake-gateway dispatch.
- Local pairing-page tests cover QR/copy content, closure, no-store headers and foreign Host/Origin rejection.
- Local relay tests run the real compiled Worker in Miniflare with SQLite Durable Objects: authentication, both-direction opaque forwarding, offline status and no retained offline commands.
- Local gateway/controller tests use an isolated fake PLC and loopback HTTP server, including rejection of busy writes without touching the PLC.
- A real read-only request to the existing Pi gateway returned temperatures, smoke and timer values without any Home Assistant request. No physical write was sent during standalone development.

Native compilation completed successfully in [GitHub Actions run 44784098711](https://github.com/eignerth2010-byte/drevos-app/actions/runs/44784098711), from app source commit `6aebe5c4ebcf69473d7afa66c79e17bb15a508b2`:

- Android release preview APK, ARM64 and ARMv7, template test signature; SHA-256 `91d4b5a8a25640d486b0928bcd68f01e343d124704fb2038c87bb554e75264a3`.
- Unsigned iPhone IPA, version 0.2.0/build 2, minimum iOS 16.4; SHA-256 `76a7b000036f5275a5a4fa7a04883f8dff4070501b2e4d62e8cc9435ee5eb654`. Personal or normal Apple signing is still needed before installation.
- Artifact ZIP hashes were checked against GitHub's recorded digests before extracting the files. The public source files were compared against the local source, byte for byte.
- Browser demo: explicit target application, timer display, German/English labels and corrected temperature symbols were checked. The preview never connected to or controlled a physical oven.

Still required: provision the operator's actual relay, run the live Pi agent through that relay, generate this installation's private pairing code, install/sign the apps, and test the full native lifecycle on real iOS/Android devices. Actual heating, smoke ignition and Pi power-off are not triggered by automated tests.

Browser preview demonstrates layout and simulated interactions. It does not prove camera permission, protected storage, clipboard behavior or networking on physical phones. Record native/compiler/live outcomes here as they complete. A Worker dry run or workflow file alone does not prove a deployed working service.
