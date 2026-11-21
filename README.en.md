# Drevos app – English guide

This is a **standalone Android and iPhone/iPad app**. Home Assistant, MQTT, VPN software and router port forwarding are not required. The Raspberry Pi makes an outbound connection to a shared relay service. An existing HA installation can continue independently.

App users can use the app and service free of charge. **The project operator** sets up the shared service once; ordinary users do not need a hosting account, server or subscription. Free hosting plans have capacity limits. Unlimited permanently free operation is not guaranteed.

Version 0.2.0 is a preview. The shared relay is running at `https://drevos-relay.eigner-th2010.workers.dev` and is included in the Pi package. Encrypted reads from a real oven and disconnection/reconnection have passed. The user confirmed QR pairing, real temperature readings and access outside the home Wi-Fi on a physical Android device. Android and iPhone compiler builds passed; iPhone signing and physical iOS validation remain pending. See [validation](docs/VALIDATION.md).

## Download the app

Files are available in the [preview release](https://github.com/eignerth2010-byte/drevos-app/releases/tag/v0.2.0-preview.1). On Android, download and open `Drevos-Android-0.2.0-Vorschau.apk`, then personally confirm installation on the device. Android uses a test signature. The iPhone file is explicitly unsigned and needs separate signing before installation. This preview is intended for device testing.

## Requirements

- A smoker matching the verified **`drevos_fx3u_v1` PLC profile**. A Drevos badge alone does not establish compatibility. Other programs/controllers require register validation before enabling writes.
- Raspberry Pi 3 B, 3 B+, 4 B or Zero 2 W, Raspberry Pi OS, Python 3.11+, power supply, microSD and internet. All use the same program; 64-bit OS is recommended. Zero 2 W requires a USB OTG adapter for the cable. Only the 3 B+ has been physically verified.
- An electrically compatible PLC programming cable. A USB-chip name alone is insufficient; never connect GPIO directly to an RS-232 interface.
- Android 7+ or iOS/iPadOS 16.4+ and an installed app. Android preview APKs include ARM64 and ARMv7.
- The operator-provided relay endpoint, automatically included in the Pi package and private pairing code.

## End-user setup

1. Install the verified Pi software and connect the Pi to the oven and home network.
2. Open the temporary Pi page, normally `http://drevos-pi.local:8765`.
3. In the app choose **Pair oven** and scan its QR code.
4. On the same phone, use **Copy code** on the Pi page, then **Paste code** in the app.
5. Press **Connect oven**, compare readings with the oven display, then close the setup page with **Done**.

The Pi generates the private code automatically. Keep it private: it grants access to this oven. The page is only opened on the home LAN for five minutes. Pair once at home; the saved pairing then works when away. Both Pi and phone need internet, with no HA involvement.

## Pi installation from source

Install Raspberry Pi OS with Python 3.11+ and copy this repository to the Pi. Run:

```sh
sudo sh scripts/install-gateway.sh
```

The installer creates private `/etc/drevos/gateway.json` without starting serial access. It proposes an adapter only when exactly one `/dev/serial/by-id/` device exists. Review the actual adapter, verified profile and bind address locally. New installations default to read-only control. Never publish its token.

Stop any competing serial-port service, then:

```sh
sudo systemctl enable --now drevos-gateway.service drevos-native-poweroff.path
```

Verify readings and the controller profile against the display. Enable `allow_control` deliberately only for the verified profile, then restart the gateway. The app can display readings while controls remain disabled.

The project operator puts the real HTTPS relay address in `cloud/endpoint.json`. Once included in the package:

```sh
sudo sh scripts/install-cloud.sh
```

An operator using their own relay can provide its URL explicitly:

```sh
sudo sh scripts/install-cloud.sh https://YOUR-RELAY.YOUR-ACCOUNT.workers.dev
```

The installer adds the separate `drevos-cloud.service`, with private keys under `/etc/drevos-cloud/`. It upgrades older gateway software to the version that immediately refuses busy writes, preserving existing configuration and PLC values. A gateway upgrade briefly restarts its API.

Open the five-minute LAN pairing page, replacing `YOUR_PI_IP` with the Pi's LAN address:

```sh
sudo /opt/drevos-cloud/.venv/bin/drevos-cloud --pair --pair-bind YOUR_PI_IP
```

Visit `http://drevos-pi.local:8765` on the home network. Add `--pair-hostname YOUR-HOSTNAME.local` if the hostname differs. Never forward this setup page or the local gateway port to the internet.

Check startup:

```sh
systemctl is-active drevos-gateway.service drevos-cloud.service
```

Updates reuse the same scripts and preserve existing pairing keys. Back up private configuration before deliberately rotating keys. Removing pairing in the app only forgets this phone; it does not revoke other paired phones.

## Controls

**Oven:** view chamber/core temperatures and smoke level. Edit targets and press **Apply**. Limits: chamber 0–120 °C, core 0–115 °C, smoke 0–100%. A positive target does not start heating or smoke. Separate heating/smoke starts ask for confirmation; smoke also triggers the PLC's automatic ignition. Zero disables the relevant request; a zero core target disables that completion criterion.

**Timer:** set 1–9999 minutes, start, pause and reset. Elapsed/remaining time comes from the PLC, not a phone clock. Starting the timer does not start heating or smoke. Pause/reset/shutdown require heating and smoke off; reset/shutdown also require a paused timer.

**Connection:** change language, refresh, remove this phone's pairing or shut down the Pi. The app cannot power the Pi back on. Pi shutdown does not disconnect oven mains power.

Loss of connectivity makes readings unavailable and disables controls. Unconfirmed writes are never retried automatically; inspect actual oven state after an error. The PLC continues independently. This app is not an emergency stop. Automatic mode and unsupported temperature units lock manual controls.

The **demo** is isolated synthetic data. Web preview is demo-only; real pairing uses the installed app's protected storage.

## Installing Android/iPhone builds

See [mobile/README](mobile/README.md). Android preview APKs can be installed as files. Use a persistent private signing key for maintained public updates.

An unsigned iPhone IPA cannot be installed directly. Private testing needs personal Apple signing; [Sideloadly](https://sideloadly.io/) is one possible Windows route, with free signing renewed every seven days according to its provider. Enter Apple credentials yourself only in the relevant sign-in window. Convenient App Store distribution needs separate developer registration, signing and review. The app can still be free for end users.

macOS 13 Ventura cannot run the Xcode 26.4+ required for this Expo SDK 58 project. GitHub builds use a hosted current Mac; app users do not need a Mac.

## Service operator

Only the project operator provisions the relay once: [cloud/README](cloud/README.md). Cloudflare's free plan has hard usage limits and does not automatically become a paid subscription; exceeding limits can interrupt connectivity. Plan capacity and maintenance before serving many users. [Official limits](https://developers.cloudflare.com/durable-objects/platform/pricing/).

[Privacy](docs/PRIVACY.md) · [Validation](docs/VALIDATION.md) · [GitHub guide](docs/GITHUB.en.md) · [Deutsch](README.de.md)

## Support this project

If this project helps you, you can support its continued development with a voluntary donation via PayPal. Thank you!

[![Donate via PayPal](https://img.shields.io/badge/Donate-PayPal-0070BA?logo=paypal&logoColor=white)](https://www.paypal.com/donate/?hosted_button_id=GSMP9644VUY8C)

Or scan the QR code:

[![PayPal donation QR code](docs/assets/paypal-donate-qr.png)](https://www.paypal.com/donate/?hosted_button_id=GSMP9644VUY8C)
