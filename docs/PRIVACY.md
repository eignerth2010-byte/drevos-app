# Privacy and private configuration

The Info tab identifies project creator Thomas Eigner and offers an optional PayPal link. Opening it hands off to the device browser and PayPal; no oven or pairing data is included in that URL. No payment form is embedded in the app.

On Android, configurable update checks fetch only public version metadata from this repository's raw GitHub file, normally at most once daily for automatic checks. They do not send pairing credentials, device-room identifiers or oven readings. GitHub sees normal network metadata such as the requesting IP address. Downloading a selected APK opens this project's GitHub release asset in the browser. Installation requires Android confirmation.

The acknowledged release-notes version and Android update preferences are independent of oven pairing. Android uses protected storage for them. The browser uses localStorage only for the acknowledged public app version; its pairing credentials remain in the separate encrypted IndexedDB vault.

The app stores pairing credentials in native protected storage: iOS Keychain with device-only accessibility, or Android SecureStore with backup exclusions. It contains no built-in advertising or analytics service. Its demo uses synthetic data.

The installable web app instead encrypts pairing with AES-GCM in origin-local IndexedDB using a non-exportable Web Crypto key. Each save uses a fresh nonce. It never writes pairing to URLs, localStorage or service-worker caches. Only the public app shell is cached for offline startup, not readings or commands. QR-image decoding happens locally in the browser, without an upload. Camera access begins only after an explicit request.

Browser storage is not an OS keychain. Malicious code on the same origin, a compromised device or someone using the unlocked browser profile can still access pairing. Remove pairing before sharing the profile. Clearing website data requires pairing again. Safari and an installed iOS web app may use separate storage; install first and pair inside the installed app. The public web host serves app files and sees ordinary request metadata; the separate relay handles encrypted oven traffic. See [PWA installation and self-hosting](WEB-APP.md).

The Pi's gateway token stays in private local configuration. The remote app receives separate pairing keys. The relay authenticates a random room credential and forwards end-to-end encrypted packets; it has no plaintext oven readings, command bodies or AES keys. It retains a credential hash for reconnects, not packet history. Hosting providers still handle network metadata such as source IPs under their own service terms; this document does not claim that no metadata exists.

Private files:

- `/etc/drevos/gateway.json`: local serial gateway identity, token and profile.
- `/etc/drevos-cloud/config.json`: local gateway access and relay/packet keys, mode 600, dedicated service account.
- `/etc/drevos-cloud/pairing.json`: private pairing code, mode 600.

The temporary setup page intentionally reveals pairing to the owner on the home network for five minutes. It must never be exposed through router forwarding. It sends no-store/no-referrer/frame-denial headers and checks the host/origin against DNS rebinding and cross-origin requests. Anyone who obtains the private code can pair a phone; keep screenshots and files containing it private.

Removing pairing from one phone clears that phone only. To revoke all copies after losing a code, stop the agent, preserve a private backup, generate a new room/keys and pair authorized phones again. Do not publish private backups or configuration in GitHub issues.

Only the service operator needs a hosting-provider account. App users do not receive a hosting subscription or provide hosting payment information. Store distribution, host privacy notices and public-service obligations must be completed for the actual operator and deployment before a public production release.
