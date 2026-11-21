# Easy setup – install the Pi software and Drevos app

**Home Assistant already works? [Reuse its Pi and add the app](HA-UND-APP.en.md#a-home-assistant-works-add-the-app).** For either direction: [HA and app – what else is needed?](HA-UND-APP.en.md)

[Deutsch](INSTALLATION.de.md) · [Pi models and exact cable](HARDWARE.md) · [Project home](../README.md)

This guide takes a new Raspberry Pi through to real oven temperatures on your phone. The web app and native mobile app use **the same Pi installation**.

**Already have a working Drevos Pi? Keep it as it is. Do not rewrite its SD card or reinstall everything.** To add a phone, start at [step 7](#7-install-drevos-on-your-phone); to reopen the private QR page, use [step 8](#8-pair-your-phone-with-the-oven).

**What should replace `YOUR-RELAY.YOUR-ACCOUNT`? Nothing for normal installation.** That example was for developers running their own server. The shared service is already configured in this project. End users do not need a Cloudflare account, Home Assistant or VPN.

## 1 What you need

| Item | Details |
|---|---|
| Oven | A Drevos matching the verified `drevos_fx3u_v1` controller profile. The same brand does not guarantee the same controller. |
| Pi | **Pi 3 B+ is the physically verified setup.** Pi 3 B, Pi 4 B and Zero 2 W are software targets; see [model differences and supplies](HARDWARE.md). |
| Power | The correct supply for your Pi: Micro-USB on 3 B/3 B+, USB-C on 4 B. Ratings are in the hardware guide. |
| Storage | microSD card; use 16 GB or larger for this guide, plus a card reader on the setup computer. |
| Oven data cable | Reference setup: **DTECH USB to RS232 DB9, FTDI, 1.2 m** – [exact product](https://www.amazon.de/dp/B08L4ZR5ZX). Connector, interface and pinout must match your oven. |
| Zero 2 W extra | Micro-USB OTG to USB-A female adapter in the data port; power uses the separate power port. |
| Network | Internet at the Pi and phone. Use the same home network for initial pairing. |
| Setup devices | Windows PC or Mac, plus a smartphone with a camera and current browser. |

The owner identified the linked DTECH cable as the installed cable; the live Pi enumerates an FTDI adapter. This identifies the working reference setup, not every Drevos controller. Check uncertain hardware before connecting it. See [hardware and cable details](HARDWARE.md).

## 2 Prepare the SD card for a new Pi only

**On the computer:** install [Raspberry Pi Imager](https://www.raspberrypi.com/software/). Select your Pi, **Raspberry Pi OS Lite (64-bit)** and the correct microSD card. Set these customisation options before writing:

| Setting | Value used in this guide |
|---|---|
| Hostname | `drevos-pi` |
| Username | `ofenadmin` |
| Password | Choose your own private password. |
| Network | Your home Wi-Fi details, or use Ethernet. |
| SSH | Enable it and select password authentication. |

Writing erases the selected card. Insert it into the Pi, connect network/power and allow a few minutes for first boot. Menu wording varies by Imager version. [Official illustrated instructions](https://www.raspberrypi.com/documentation/computers/getting-started.html).

## 3 Sign in to the Pi from your computer

Open **Terminal/PowerShell** on Windows, or **Terminal** on Mac:

```sh
ssh ofenadmin@drevos-pi.local
```

This username matches step 2; use the existing username for an already configured Pi. Verify that the first-time host prompt belongs to your Pi before accepting. Enter your Pi password; invisible password typing is normal.

**Success:** the command prompt now names your Pi. All commands in steps 4–6 run **on the Pi through this signed-in window**, not directly on Windows or macOS. Run them one at a time. Resolve any error before proceeding.

## 4 Download the Pi software

**On the Pi**, run each line in order:

```sh
sudo apt-get update
sudo apt-get install -y git python3 python3-venv python3-pip ca-certificates nano
cd ~
git clone https://github.com/eignerth2010-byte/drevos-app.git
cd ~/drevos-app
```

If the folder already exists, keep it. For a working installation go to step 7; update instructions are below.

## 5 Set up the connection to the oven

Connect the verified cable between Pi and controller. Power the Pi and controller; heating and smoke do not need to be started. Only one gateway may use the serial port. Reuse an existing Drevos gateway rather than starting a competing one.

**On the Pi:**

```sh
sudo sh scripts/install-gateway.sh
ls -l /dev/serial/by-id/
```

The installer does not start serial access yet and defaults to read-only operation. The second command should show the connected USB serial adapter. If none appears, check the cable/USB connection; if several appear, identify the oven's adapter.

Open the private settings locally:

```sh
sudo nano /etc/drevos/gateway.json
```

Keep `id`, `token` and all unrelated settings unchanged. Check:

- `serial_port`: automatically filled when exactly one adapter exists. Replace a `CHOOSE_YOUR_VERIFIED_ADAPTER` placeholder with the correct full adapter path.
- `profile`: `drevos_fx3u_v1` for the verified controller. Typing this name does not verify different hardware.
- `bind`: keep `127.0.0.1` for a new app-only installation. Preserve an existing HA LAN binding and follow the [combined-use guide](HA-UND-APP.en.md).
- `allow_control`: leave `false` initially to read values only.

In nano, **Ctrl+O**, **Enter**, then **Ctrl+X** saves and exits. This file contains a private key; never paste it into chat or GitHub.

```sh
sudo systemctl enable --now drevos-gateway.service drevos-native-poweroff.path
```

## 6 Install the phone connection

**On the Pi, inside `~/drevos-app`:** copy this command exactly, with no server address added:

```sh
sudo sh scripts/install-cloud.sh
```

It uses the included shared service `https://drevos-relay.eigner-th2010.workers.dev`. “Cloud” means the connection your phone uses to reach the Pi when away. Private pairing keys are generated on your Pi.

```sh
systemctl is-active drevos-gateway.service drevos-cloud.service
```

**Expected:** `active` twice. Both services now start automatically with the Pi. Resolve `failed`, `inactive` or an installer error before continuing.

## 7 Install Drevos on your phone

### Web app on iPhone or iPad

Open [Drevos Web App](https://drevos-smoker-control.thankfulchick1.chatgpt.site) in **Safari**. Choose **Share → Add to Home Screen**, enable **Open as Web App** if offered, then open the new **Drevos icon** and pair there. Weekly Apple signing is not required for the web app.

### Web app on Android

Open the same [Drevos Web App](https://drevos-smoker-control.thankfulchick1.chatgpt.site) in Chrome. Choose **Install app / Add to home screen** in its menu, then open the new icon.

### Native Android alternative

[Download the Android APK](https://github.com/eignerth2010-byte/drevos-app/releases/download/v0.3.1-preview.1/Drevos-Android-0.3.1-Vorschau.apk), open it on Android and personally confirm installation of this preview. If Android asks for install-source permission, grant it only to the browser/file manager used for this installation. Open Drevos afterwards. The same Pi steps apply. Node.js and Android Studio are not needed to install the ready-made APK.

### Native iPhone alternative

The published IPA is **unsigned** and cannot simply be opened to install it. Follow the [Xcode preparation guide](../mobile/README.md#local-native-projects), open the generated workspace, select the app project and your team under **Signing & Capabilities**, enable automatic signing, choose the connected iPhone and run the app. Complete required developer/trust prompts on your own device. Free Personal Team builds normally need renewal after seven days. The web app above is the straightforward option without a Mac.

## 8 Pair your phone with the oven

Use the home network initially and keep the Pi terminal open. **On the Pi**, start the private five-minute QR page:

```sh
sudo /opt/drevos-cloud/.venv/bin/drevos-cloud --pair --pair-bind drevos-pi.local
```

The hostname matches step 2; no IP or relay URL replacement is needed. **On the computer**, open [the Pi pairing page](http://drevos-pi.local:8765).

**On the phone:** choose **Pair oven**, then **Start camera** in the web app. Allow camera access, scan the private QR code and press **Connect oven**. Compare live chamber/core temperatures with the display. On the Pi page press **Done** and close its browser tab.

On the same phone, **Copy code** on the Pi page and **Paste code** in Drevos are an alternative. Keep the code private. If the five-minute page expires, run the Pi command again. To add another phone, repeat pairing without reinstalling the Pi.

## 9 Verify readings before enabling controls

A new installation initially reads only. Check temperatures against the display and confirm that the actual controller matches the verified register profile. Plausible temperatures alone do not validate write addresses.

Only after that verification, reopen `/etc/drevos/gateway.json` using `sudo nano`. Change only `"allow_control": false` to `"allow_control": true`, save, then:

```sh
sudo systemctl restart drevos-gateway.service
```

Refresh the app. Connection, automatic mode and other device guards still apply. Enabling controls does not itself start heating or ignition.

## 10 Test remote access

Disable phone Wi-Fi, enable mobile data, fully close Drevos and reopen its icon. Use **Connection → Refresh**. Pairing should remain saved and live values should update. The Pi at home needs power and internet. No router port forwarding is required.

## Troubleshooting

| Problem | What to do |
|---|---|
| `drevos-pi.local` not found | Check that devices share the home network; check the actual Pi hostname in the router. |
| Different existing hostname | Use that name in SSH, `--pair-bind` and the page URL; also add `--pair-hostname` with the same name to the pairing command. |
| Installer file not found | Run `cd ~/drevos-app` on the Pi first. The installer is not a Windows command. |
| Project folder exists | Keep it. Pair the existing installation or follow the update notes. |
| QR page expired | Run the pairing command again; it lasts five minutes. |
| Unavailable readings | Check controller power, cable, adapter path and both services from step 6. |
| Disabled controls | Check step 9, automatic mode and connection status. Do not bypass guards with guessed register changes. |
| Pairing missing in a different browser | Open the installed web app and pair there; Safari and installed-app storage may be separate. |

## Later updates

Keep the existing SD card and private configuration. End oven operation and save private local configuration backups before upgrading. In the existing Pi project folder run `git pull --ff-only`, rerun both installers from steps 5–6, then restart `drevos-gateway.service` and `drevos-cloud.service` and check their status. Ordinary updates preserve existing pairing keys. Do not force an overwrite after local changes or errors.

Running your own relay is a separate developer task described in [cloud/README](../cloud/README.md); ordinary installation does not need it.

From 0.3.1, **Info** shows the creator, optional support button and **Check now** for newer Android versions. Automatic checks can be disabled there. Install updates over the existing app without uninstalling first. The Web App loads new versions automatically on its next opening without an update button; **What’s new?** then explains the changes. [Complete update steps](UPDATES.md).
