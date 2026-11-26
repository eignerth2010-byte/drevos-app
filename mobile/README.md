# Drevos native and web app

**Existing HA or app installation? [Gemeinsamer Pi und Umstieg – Deutsch](../docs/HA-UND-APP.de.md)** · [Shared Pi and migration – English](../docs/HA-UND-APP.en.md)

**[Einfach starten: Pi und Handy-App auf Deutsch](../docs/INSTALLATION.de.md)** · **[Easy Pi and mobile app setup in English](../docs/INSTALLATION.en.md)** · [Hardware / Kabel](../docs/HARDWARE.md)

These beginner guides include the complete Pi installation for the native app as well as the Web App. Development/build instructions follow below.

Version 0.4.0. **Standalone**: direct Pi access for local use, or end-to-end encrypted relay access at home and away. No Home Assistant or VPN dependency.

**Recipes:** [Deutsch](../docs/RECIPES.de.md) · [English](../docs/RECIPES.en.md). The new Recipes tab includes 40 transcribed oven recipes and a phase-by-phase preparation flow. Preparation only transfers numeric settings; users start heat, smoke and timer themselves. Personal drafts and photo submissions open in the browser form.

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

Build the installable PWA with `npm run build:web` and host only `dist-web` over HTTPS. The [public Web App](https://drevos-smoker-control.thankfulchick1.chatgpt.site) supports encrypted remote pairing, local QR scanning/image decoding and browser-local encrypted persistence. See [German/English PWA instructions](../docs/WEB-APP.md). `npm run preview` is a development server, not the offline-capable deployment artifact. Native apps keep secrets in iOS Keychain / Android protected storage. Camera permission is requested only when the user starts QR scanning.

The browser vault uses AES-GCM and a non-exportable Web Crypto key in IndexedDB. Public shell assets alone are cached offline; commands and pairing keys are never cached by the service worker. A disconnected app cannot send controls, and commands are not queued for reconnection.

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

For an existing checkout, run `git pull --ff-only` before restarting the helper. The helper prints the detected Xcode version and reports a failed step with its line and exit status. If the Xcode check fails, open **Xcode → Settings → Locations → Command Line Tools**, select the installed Xcode app and retry; see [Apple's command-line tools settings](https://developer.apple.com/documentation/xcode/configuring-command-line-tools-settings).

Choose your team and device in the generated Xcode workspace. macOS 13 Ventura cannot run the required Xcode; use the hosted build route instead. Requirements: [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/), [Apple Xcode](https://developer.apple.com/xcode/system-requirements/).

App source and the original cabinet illustration use the [project license](LICENSE): private and internal business use are free; resale and commercial redistribution require Thomas Eigner's prior written permission. Earlier MIT versions retain their terms; see [licensing details](../docs/LICENSING.md). The community wordmark and brand names have [separate notes](BRAND-NOTICE.md). Available dependency license texts accompany packages in `THIRD_PARTY_NOTICES.txt`.

## Info, support and updates

The Info tab shows creator Thomas Eigner, an optional PayPal support link, the app version and release notes in German/English. Android can check this repository for a newer APK automatically (normally at most daily) or manually. Installation still requires Android confirmation. The Web App loads new versions on its next opening without an update prompt or forced session reload. See [the complete update guide](../docs/UPDATES.md). Version 0.3.1 Android is rebuilt; the downloadable unsigned iPhone binary remains 0.2.0.
