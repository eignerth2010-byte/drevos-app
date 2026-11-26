# Validation – 2026-11-21

## 2026-11-21 – App/Web 0.3.1 community wordmark and licensing

- 50 mobile tests, TypeScript and the required formatting check pass. The PWA
  production build succeeds with the new temporary wordmark and version 0.3.1.
- The existing public Web App is updated at its unchanged origin. Browser checks
  confirm the new logo, 0.3.1, German Info text, release notes and the revised
  resale terms, with no APK update prompt on the Web App.
- The updated public screenshot is explicitly a demo with synthetic values.
  No real pairing key, live oven data or control command is used for screenshots.
- Android 0.3.1 is built from the same native application source through
  [the dedicated build](https://github.com/eignerth2010-byte/drevos-app/actions/runs/44934237080).
  Compilation and apksigner verification succeeded. The downloaded artifact
  and APK SHA-256 were checked. The APK signing certificate matches the earlier
  previews; ARM64 and ARMv7 are included. The bundled PNG was extracted and
  visually confirmed to be the new community wordmark. APK versionName is
  0.3.1 and versionCode is 4. SHA-256:
  `7667b10e5f6d12fee9eeecfce5dc618ecc3654d0f1d20b2b390e89121a197edd`.
- Existing iPhone IPA 0.2.0 is not replaced; current iOS source uses the new
  wordmark. No physical Android/iPhone test of 0.3.1 is claimed.
- Private and internal business use are free. Resale and commercial bundling
  need Thomas Eigner's prior written permission. Earlier MIT copies retain
  their terms. Third-party licenses are not changed.
- The Pi services, remote protocol and pairing storage are unchanged. No Pi or
  PLC command was sent and no activation-token system was added.


Current Android/Web App preview: 0.3.0; local gateway patch 0.1.1. The earlier 0.2.0 device checks below remain historical evidence for that version. The earlier HA-dependent 0.1.0 app prototype is superseded and is not this app.

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

Physical iPhone checks confirmed by the user on 2026-11-20:

- Built and personally signed on the user's macOS Tahoe VM with Xcode 26.5; installed on the user's iPhone. The user confirmed real chamber/core temperatures after QR pairing.
- After removing USB, disabling Wi-Fi, fully closing and reopening the app, the user confirmed retained pairing and refreshed readings over mobile data. This does not validate every control or native lifecycle case.
- The free Personal Team signature needs renewal; this limitation applies to the native build, not the PWA.

Still required: broader Android/iOS lifecycle and control testing. The confirmed Android checks cover pairing and local/remote readings, not every native function. Actual heating, smoke ignition and Pi power-off were not triggered by these checks. The downloadable builds remain previews for device testing.

The earlier browser demo checks above describe the November 20 state. The November 21 PWA checks below supersede its demo-only limitation. Physical-phone PWA camera and installation checks are not implied by desktop-browser validation. A Worker dry run or workflow file alone does not prove a deployed working service.

Mac preparation helper follow-up on 2026-11-20:

- The user installed Node.js 24 LTS and reported Xcode 26.5, build 17F42, in a macOS Tahoe VM. The original helper stopped after its heading; the exact exit status on that Mac was not captured.
- Removed the `xcodebuild | head` pipeline, which could terminate the helper through `pipefail`/SIGPIPE. Xcode output is now captured in full, version parsing is validated, Xcode failures are shown with setup guidance, and later failed steps report their line and status.
- An isolated Bash harness reproduced the old early-exit behavior using synthetic verbose Xcode output. The revised helper passed synthetic 26.4, 26.5, 27 and verbose-output cases; rejected 26.3, failed and malformed Xcode output before dependency installation; and reported a synthetic npm failure with status 42. Bash syntax also passed.
- These helper checks used stubs on Linux, not real Xcode, npm installation or oven access. They do not establish a successful native build in the user's VM. The later user-confirmed iPhone build and live reading checks are recorded above.

Installable Web App / PWA checks on 2026-11-21:

- Mobile TypeScript check passed; all 40 tests in six files passed. Eleven new tests cover browser-vault encryption, nonce freshness, invalid/corrupt data, serialized save/logout, immutable queued saves, insecure-origin rejection and the service worker's public-only cache boundary. The complete GitHub check job subsequently passed for source commit `7c859d67746f38360d65f54c2751fefaeb12adcc`: [run 44911361315](https://github.com/eignerth2010-byte/drevos-app/actions/runs/44911361315). It reran gateway, agent, relay and mobile tests, formatting/type checks, Android/iOS/web JavaScript exports and the installable PWA build. Native binary compilation was not requested in that run.
- Production web export completed with a standalone manifest, generated 192/512 icons, explicit-update service worker and only public assets in the offline shell. Android/iOS JavaScript bundles were also generated; no new native binary was compiled for this PWA change.
- Desktop-browser demo checks covered explicit setpoint application, heating confirmation/cancel and timer display. Real pairing then displayed live chamber/core temperatures through the existing relay; reloading retained pairing. Language persisted after reload; removing pairing returned to the login screen after reload. No physical control command was issued.
- Local QR-image decoding accepted the actual private oven code and rejected an unrelated QR code. The subsequent iPhone PWA camera check is recorded below.
- Public HTTPS deployment: [Drevos Web App](https://drevos-smoker-control.thankfulchick1.chatgpt.site). Manifest, service-worker JavaScript and icons returned HTTP 200 with correct content types. Deployment source/archive excludes all actual pairing keys and private Pi configuration.
- The actual public deployment also passed real pairing, fresh live readings and restore after reload in the desktop browser. Its explicit update prompt successfully activated the next version. Removing the desktop test pairing cleared that browser only. No physical command was issued.

Physical iPhone PWA checks confirmed by the user on 2026-11-21:

- Opened the published HTTPS URL in Safari, added Drevos to the Home Screen and opened the new icon.
- Used the web app camera scanner to scan the temporary private Pi QR code and confirmed connection. Real chamber/core temperatures were displayed.
- Disabled Wi-Fi, fully closed the installed web app, opened its Home Screen icon again and refreshed over mobile data. The user confirmed that pairing remained saved and live readings worked. Device model and iOS version were not recorded.
- Closed the temporary setup page after pairing; subsequent requests to it were refused. Existing Android/iOS native pairings were retained. No heating, smoke ignition or Pi shutdown was triggered by these PWA checks.
- Android PWA installation and broader physical control/lifecycle cases remain untested; the earlier native Android validation is a separate result.


## Info, release notes, versions and Android updates – 0.3.0

- Complete checks and Android native compilation passed in [run 44918786566](https://github.com/eignerth2010-byte/drevos-app/actions/runs/44918786566), APK source commit `acd59c78f1994a02970eddbf5eeeb0a3d137f81a`. That run passed 49 mobile tests, formatting/type checks, gateway/agent/relay tests, all-platform JavaScript exports and the PWA build. The iOS native job was intentionally skipped.
- After removing the Web App update banner at the user's request, 50 mobile tests, TypeScript and a production Web build passed locally. The added test exercises current-HTML network navigation and confirms that messages cannot force worker activation. Only web-specific source, tests and documentation changed after the Android build; Android app inputs did not change.
- APK identity verified by Android build tools: package `at.eignerth.drevos`, version name `0.3.0`, version code `3`, ARM64 and ARMv7 libraries. `apksigner verify` passed. APK SHA-256: `06a1ea8d109f8e699f805e7d510d008bb86f202aee59f3b3d2473485369dffa9`.
- The artifact ZIP SHA-256 matched GitHub's digest before extraction. The APK signing certificate digest `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c` matches the previous 0.2.0 preview; template test signing remains in use. This establishes package/signature compatibility for an in-place update, not a confirmed physical-phone installation.
- Browser checks covered unpaired Info access, creator Thomas Eigner, visible version, correct PayPal destination, German/English release notes, manual reopening and persisted acknowledgement after reload. Demo oven/timer navigation remained available. The updated web-only code showed no update-available banner after navigation from an older cached app. No actual oven was paired or controlled for this UI update.
- The first 0.3.0 HTTPS deployment passed Info/version/release-note checks and five public runtime assets matched the local build byte for byte. The final deployment removes the Web App's explicit update prompt: new navigations fetch current HTML; already open sessions are not forcibly reloaded. The Android update checker remains Android-only.
- The public Android update metadata is updated only after its referenced APK is published. Parser tests reject foreign repositories, HTTP, credentials/query parameters, malformed versions, malformed hashes and non-APK paths; preference tests exercise automatic-check timing. The checker is not represented as an in-app APK-download verifier; Android confirms installation and checks package signing.
- No Pi service, Home Assistant configuration or PLC value changed for this release. Broader native lifecycle/control checks remain outstanding; this 0.3.0 Android UI has not yet been confirmed on a physical device. No heating, ignition or shutdown was triggered.

## Recipes – app 0.4.0 (2026-11-26)

- Forty recipes were transcribed from 121 owner-supplied oven-display photos. The owner confirmed the Lachs/Forelle heading mismatch and suggested 85/55 °C for Rippen, Methode 2. The original 185/155 °C values and the suggested-correction status remain in the catalog.
- All 40 product images were restored using AI and reviewed as contact sheets. Only stripped JPEG assets are public; the original HEIC photos, private source notes and master PNG files are excluded.
- Local checks passed: 57 app tests, TypeScript, formatting, all-platform JavaScript exports (Android/iOS/web) and the production PWA build. These exports do not establish successful native Xcode/Gradle compilation or physical-device validation of 0.4.0.
- In an isolated browser demo, selecting Rippen phase 2 prefilled 85/55/100 without changing the previous actual values. After an explicit timer reset and transfer, the simulated device reported 85/55/100 and 150 minutes. Heat and smoke stayed off; the existing convection state stayed unchanged. Returning to Recipes retained the opened recipe. The 390 × 844 Chromium view was checked; this is not a physical iPhone/Android test.
- A local synthetic personal recipe with a JPEG photo and zero-valued settings survived save, page reload and reopening. Publication consent remained unchecked. IndexedDB tests cover revision conflicts, bounds, allowed photo types and exclusion of tokens/contact details/consent. No recipe email was sent; FormSubmit activation and an actual test attachment still require the owner's verification.
- No real oven was paired or commanded for this update. No Pi service or live HA installation changed. Source and simulated checks do not verify energized cooking, ignition, phase completion, pause duration or food safety.

### Published recipe packages and web verification – 2026-11-26

- [Native workflow 45879539258](https://github.com/eignerth2010-byte/drevos-app/actions/runs/45879539258) succeeded for checks, Android and iOS on source `846082bdebafd415e45aea7a7b4817cbf418039a`. Downloaded artifact ZIP digests matched GitHub. Both native packages contain all 40 recipe JPEGs, compared by content hashes. Android version 0.4.0/code 5, package `at.eignerth.drevos`, ARM64/ARMv7 and the existing signing certificate were verified; CI `apksigner verify` passed. The iPhone package is unsigned, version 0.4.0/build 5.
- The public [0.4.0 preview release](https://github.com/eignerth2010-byte/drevos-app/releases/tag/v0.4.0-preview.1) assets have GitHub digests matching the reviewed local packages. APK SHA-256: `a20bc5c46cb930841cdcd64109c739f891f2de0c7f9328dcd3c1f92476a47eba`.
- The existing HTTPS web app was updated to 0.4.0. Browser checks confirmed its release notes, all 40 recipe entries, the labelled 85/55 correction and three separate phase sections, plus the working submission-form page with photo/settings fields and unchecked consent. No oven was paired or commanded. A separate command-line byte comparison was blocked by HTTP 403; it is not claimed as passed.
- FormSubmit recipient activation, actual email delivery and physical 0.4.0 phone/oven controls remain unverified. The Android update feed was advanced only after the referenced APK and digest were published.
