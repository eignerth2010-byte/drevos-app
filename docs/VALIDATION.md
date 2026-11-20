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
- The cloud installer passed `sh -n` on the actual Raspberry Pi after its Unix line endings were corrected. Git attributes now preserve Unix line endings for shell scripts and systemd units, and CI checks both installer scripts. The installer also restarts an existing cloud service after an update. These checks did not execute the installation or change PLC values.

Live backend checks completed on 2026-11-20:

- Deployed the real Worker with SQLite Durable Objects on the operator's verified Workers Free account. HTTPS health and a real WebSocket exchange passed.
- Installed gateway 0.1.1 and cloud agent 0.2.0 on the actual Pi 3 B+. Both services are active and configured to start automatically. The existing gateway configuration is byte-for-byte unchanged; a private pre-installation backup remains on the Pi.
- Generated this installation's private pairing on the Pi. No pairing key is included in this repository or release.
- Used the app's actual `PiClient`/`CloudTransport` and AES-GCM implementation to read real chamber/core temperature, smoke setting and remaining timer values through the public relay. The verification ran under Node with only Expo's random-byte provider replaced by Node's cryptographic random-byte provider. This verifies the actual connection/encryption code, not a physical phone's storage, camera or networking stack.
- Stopped only the cloud agent: the app transport rejected reads with a network/unavailable error. Restarted it and successfully read fresh values through the same private pairing. The local gateway and PLC kept running. No PLC control command was sent.

Physical Android checks confirmed by the user on 2026-11-20:

- Installed and opened the published Android preview, scanned the private Pi pairing QR code and connected the oven. The user confirmed that real chamber and core temperatures were displayed.
- After being asked to leave the home Wi-Fi and use mobile data (or a mobile-data hotspot), the user confirmed that refreshing still displayed real temperatures. This confirms remote reading on the user's Android device; the exact device model and Android version were not recorded.
- The private pairing page was closed after setup; its QR code was no longer visible.
- A read-only Home Assistant check after the Pi update returned chamber/core temperatures, smoke setting and timer values through the existing native integration. The app's own remote path does not use Home Assistant.

Still required: iPhone signing and physical iOS validation, plus broader Android lifecycle, protected-storage persistence and control testing. The confirmed Android checks cover pairing and local/remote readings, not every native function. Actual heating, smoke ignition and Pi power-off were not triggered by these checks. The downloadable builds remain previews for device testing.

Browser preview demonstrates layout and simulated interactions. It does not prove camera permission, protected storage, clipboard behavior or networking on physical phones. Record native/compiler/live outcomes here as they complete. A Worker dry run or workflow file alone does not prove a deployed working service.

Mac preparation helper follow-up on 2026-11-20:

- The user installed Node.js 24 LTS and reported Xcode 26.5, build 17F42, in a macOS Tahoe VM. The original helper stopped after its heading; the exact exit status on that Mac was not captured.
- Removed the `xcodebuild | head` pipeline, which could terminate the helper through `pipefail`/SIGPIPE. Xcode output is now captured in full, version parsing is validated, Xcode failures are shown with setup guidance, and later failed steps report their line and status.
- An isolated Bash harness reproduced the old early-exit behavior using synthetic verbose Xcode output. The revised helper passed synthetic 26.4, 26.5, 27 and verbose-output cases; rejected 26.3, failed and malformed Xcode output before dependency installation; and reported a synthetic npm failure with status 42. Bash syntax also passed.
- These helper checks used stubs on Linux, not real Xcode, npm installation or oven access. They do not establish a successful native build in the user's VM. Local Mac preparation, iPhone signing and physical iOS validation remain pending until confirmed.
