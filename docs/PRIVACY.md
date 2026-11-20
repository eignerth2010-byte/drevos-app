# Privacy and private configuration

The app stores pairing credentials in native protected storage: iOS Keychain with device-only accessibility, or Android SecureStore with backup exclusions. It contains no built-in advertising or analytics service. Its demo uses synthetic data.

The Pi's gateway token stays in private local configuration. The remote app receives separate pairing keys. The relay authenticates a random room credential and forwards end-to-end encrypted packets; it has no plaintext oven readings, command bodies or AES keys. It retains a credential hash for reconnects, not packet history. Hosting providers still handle network metadata such as source IPs under their own service terms; this document does not claim that no metadata exists.

Private files:

- `/etc/drevos/gateway.json`: local serial gateway identity, token and profile.
- `/etc/drevos-cloud/config.json`: local gateway access and relay/packet keys, mode 600, dedicated service account.
- `/etc/drevos-cloud/pairing.json`: private pairing code, mode 600.

The temporary setup page intentionally reveals pairing to the owner on the home network for five minutes. It must never be exposed through router forwarding. It sends no-store/no-referrer/frame-denial headers and checks the host/origin against DNS rebinding and cross-origin requests. Anyone who obtains the private code can pair a phone; keep screenshots and files containing it private.

Removing pairing from one phone clears that phone only. To revoke all copies after losing a code, stop the agent, preserve a private backup, generate a new room/keys and pair authorized phones again. Do not publish private backups or configuration in GitHub issues.

Only the service operator needs a hosting-provider account. App users do not receive a hosting subscription or provide hosting payment information. Store distribution, host privacy notices and public-service obligations must be completed for the actual operator and deployment before a public production release.
