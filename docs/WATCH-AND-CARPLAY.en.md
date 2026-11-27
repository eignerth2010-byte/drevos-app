# Drevos on watches and CarPlay

Version 0.6.0 adds watch apps while reusing the configured Pi and cloud pairing. Phone and Wear OS APKs target different device types.

**What's new?** and the version label distinguish Android, iPhone and web apps. Android shows Wear OS and Android Auto changes; iPhone shows Apple Watch and CarPlay changes. Shared changes appear on all platforms. The web app does not show native watch and car app update notes.

## Compatibility

The deployment targets are watchOS 8+ and Wear OS 3+ (Android API 30). These are build targets, not a claim that every old device has been tested. The Apple Watch must also support an architecture contained in the compiled app. Samsung Galaxy Watch4 and later use Wear OS; compatible Pixel Watch, TicWatch and Fossil devices may also run the Wear app. Legacy Tizen, Garmin, Fitbit and other proprietary watch systems cannot install this APK. [Samsung's Tizen distribution notice](https://developer.samsung.com/galaxy-watch-tizen/notice.html), [Xcode deployment ranges](https://developer.apple.com/xcode/system-requirements/).

## Pair once

1. Update the phone app, keeping its existing cloud pairing. A local-only HTTP pairing cannot be transferred to a watch.
2. Install and open the matching watch app. The Apple Watch app is embedded in the iPhone build. Sign the phone, Watch and Live Activity targets with your Apple team in Xcode; existing free-signing expiry rules still apply.
3. On the phone choose **Info → Watch & car display → Find watches**, then select your paired watch. Keep the Apple Watch app reachable during transfer. Wear Data Layer requires matching package names and signing certificates on both devices.
4. Confirm actual readings on the watch before relying on controls. Installation alone does not verify real oven control.

The watch receives a protected copy of the cloud pairing only through this explicit action. Apple uses device-bound Keychain storage; Wear uses Android Keystore encryption and a no-backup file. Pairing uses Watch Connectivity or the authenticated, encrypted [Wear Data Layer](https://developer.android.com/training/wearables/data/overview). No credentials are included in recipe catalogs, display snapshots or logs.

The foreground watch app then connects to the existing encrypted relay itself, over available watch Internet access or the watch system's phone connection. The Drevos phone app need not stay open for watch controls.

## Controls and freshness

View chamber/core temperatures, smoke and remaining time. Edit targets and control heating, smoke/ignition, convection, fan and timer. Every write needs confirmation followed by fresh gateway identity/state checks. Existing limits and automatic/Fahrenheit locks remain: chamber 0–120 °C, core 0–115 °C, smoke 0–100%, timer 1–9999 minutes.

After 15 seconds without a confirmed reading, values are no longer presented as current and controls are blocked. An unconfirmed write is never automatically retried. Refresh and inspect the real oven state after an error. Opening, pairing or reconnecting never starts a function or recipe phase.

This is a foreground watch app, not an always-running background alarm. Removing watch pairing clears its local copy; for a lost device, rotate the shared Pi cloud pairing. A disconnected device cannot reliably be remotely erased.

## Live Activity and CarPlay

On iPhone choose **Info → Watch & car display → Start status display**. The status extension targets iOS 18+; the small CarPlay presentation requires iOS 26. Live Activities must be enabled in system settings. It displays temperatures, remaining time and observation time, with no oven controls in CarPlay.

The active phone app supplies updates. When iOS suspends it, the activity becomes stale after 20 seconds and labels older readings. Continuous background updates are not promised; they would need separately configured Apple push infrastructure, which this change does not provision. The foreground watch app fetches its own state independently.

[Apple supports Live Activities in CarPlay](https://developer.apple.com/carplay/). This is not an approved full CarPlay oven-control launcher; no unrelated entitlement is used.

## Build

From `mobile`, install dependencies and run the normal checks. Set `DREVOS_WEAR_OS=1` for Android prebuild to generate the watch manifest; omit it for the phone build. Hosted builds expose separate Wear OS and emulator options.

On macOS, `macOS-vorbereiten.command` runs `ruby scripts/integrate-apple.rb` after Expo prebuild to add Watch and Live Activity targets reproducibly. Do not commit generated Xcode projects. Native protocol/control tests: `swift test --package-path apple`. Unsigned IPA packages require Apple signing before installation.

## Android Auto

Android Auto is included in the phone APK, with no separate car APK. On the phone choose **Info → Watch & car display → Enable Android Auto**. This explicitly stores an additional Android-Keystore-protected copy of cloud pairing for native car reads. Disable Android Auto or log out to remove that local access.

While its car screen is active, the native service independently fetches chamber/core temperatures, smoke and remaining time over the encrypted relay. The phone UI need not remain open. Values become unavailable after 15 seconds without a confirmed observation. Refresh is available; oven commands and an always-running background service are not included.

The implementation uses Google's [IoT category and Car App templates](https://developer.android.com/training/cars/apps/iot), with validation of known hosts. This does not claim Google Play approval or testing on every car. Sideloading an APK alone does not guarantee launcher visibility on every host. Complete the [official car quality checks](https://developer.android.com/docs/quality-guidelines/car-app-quality) and Desktop Head Unit/vehicle tests before claiming approval.
