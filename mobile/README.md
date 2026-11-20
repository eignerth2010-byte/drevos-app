# Native Drevos app

Version 0.2.0. **Standalone**: direct Pi access for local use, or end-to-end encrypted relay access at home and away. No Home Assistant, MQTT or VPN dependency.

End-user setup is described in [Deutsch](../README.de.md) / [English](../README.en.md). App users pair by scanning or pasting their Pi's private pairing code. They do not create cloud-provider accounts.

## Development

Use Node.js 24 LTS:

```sh
cd mobile
npm ci
npm run typecheck
npm run format:check
npm test
npm run bundle:check
```

`npm run preview` is an isolated web demo. Native pairing is intentionally disabled in the web preview; secrets are kept in iOS Keychain / Android protected storage by the installed app. Camera permission is requested only when the user starts QR scanning.

## Android/iPhone builds without a local Mac

This repository's **Actions → Drevos App → Run workflow** checks all components and builds:

- A standalone Android preview APK with embedded program and template test signing. It can be installed on an ARM64/ARMv7 Android phone without Metro. Use your own persistent signing key for maintained public releases.
- Optionally an **unsigned iPhone IPA** compiled on a hosted Mac. This is not directly installable. Sign it for your own device or arrange normal Apple distribution separately.

Artifacts are retained for 14 days. These are preview builds; check [validation](../docs/VALIDATION.md) before describing a build as tested on actual devices.

For signed EAS builds, `eas.json` contains internal-preview, simulator and production profiles. Set up your own Expo/Apple account before `npx eas-cli@latest init` and `npx eas-cli@latest build --platform ios --profile preview`. Do not commit account credentials, certificates or provisioning profiles.

## Local native projects

Android: install JDK 17 and Android Studio/SDK, then run `android-vorbereiten.ps1` or `npm ci` and `npx expo prebuild --platform android --no-install`.

iOS: on a compatible Mac, install Xcode 26.4+, Node.js 24 and CocoaPods, then:

```sh
chmod +x macOS-vorbereiten.command
./macOS-vorbereiten.command
```

Choose your team and device in the generated Xcode workspace. macOS 13 Ventura cannot run the required Xcode; use the hosted build route instead. Requirements: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [Apple Xcode](https://developer.apple.com/xcode/system-requirements/).

App source and the original cabinet illustration are MIT. The supplied Drevos logo has [separate terms](BRAND-NOTICE.md). Available dependency license texts accompany packages in `THIRD_PARTY_NOTICES.txt`.
