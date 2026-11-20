# Standalone connection protocol v1

The mobile app and Pi agent are independent of Home Assistant. A shared relay forwards opaque packets between an oven's outbound `device` socket and paired `app` sockets.

## Pairing

The Pi generates a random 128-bit room identifier, a random 256-bit AES key and a separate random 256-bit relay credential. A private JSON code declares `type: drevos-cloud`, `version: 1`, the HTTPS relay base, room, AES key, relay credential, stable local gateway ID and an optional display name. The local gateway's own bearer token is **not** in the pairing code.

The Pi setup page displays this code as a QR image and copyable text for five minutes on the home LAN. The app validates shape and HTTPS base URL before making a connection, then verifies the encrypted gateway identity/profile before persisting pairing in protected native storage.

## Relay

`wss://RELAY/v1/rooms/ROOM/socket` accepts a first `hello` with role and transport credential. An initial authenticated `device` establishes that room's credential hash; an app cannot pre-enroll it. Subsequent sockets must match the hash. The credential is transmitted only inside TLS, never in a URL. The relay stores no encryption key or packet history.

Both directions carry `{type: data, payload: ...}`. The payload is a JSON wrapper with version `v: 1`, base64 12-byte nonce `n` and base64 authenticated ciphertext `c`. Encryption is AES-256-GCM with a 16-byte tag. A fresh cryptographically random nonce is used for every packet. AAD is the UTF-8 string `drevos-cloud:1:ROOM:DIRECTION`, where direction is `app-to-pi` or `pi-to-app`; this prevents reflection and cross-room substitution.

The decrypted request includes a random client channel and random request ID, its operation, and the most recently received Pi boot/session ID. Replies echo channel/request ID and contain the current boot ID. Native clients accept only replies matching an outstanding request. Old replies cannot update a later request.

## Reads and writes

`read` permits only the fixed local gateway's `info` or `state` resource. No caller-supplied URL is used by the agent.

Before a write, the app reads fresh gateway identity and PLC state. The encrypted `prepare` request specifies the exact bounded command. The Pi issues a random one-use ticket bound to client, command and current Pi session, valid for eight monotonic seconds. `execute` consumes that ticket before forwarding a single local command. Request replays, used/expired tickets, altered commands and earlier Pi sessions are rejected. A device reconnect creates a new boot/session ID.

The agent and gateway refuse busy writes instead of maintaining a command queue. The gateway applies its own fresh PLC guards and confirmed register/bit allowlist, including manual/Celsius mode, positive targets for starts and safe prerequisites for reset/shutdown. No raw Y-output force is exposed.

Only one POST is sent. A lost acknowledgement is an uncertain outcome; neither app nor agent retries it. The relay never retains a command for an offline oven. The app closes its socket in background and loads fresh values after foregrounding. The PLC continues independently of these connections.

## Local-only mode

Advanced manual pairing can use the existing local `/api/v1/info`, `/state` and `/command` API directly. That requires local reachability and is separate from normal remote QR pairing. Public HTTP destinations and URLs containing credentials, paths, query strings or fragments are rejected. HTTPS certificate validation is not disabled.

See tests for packet authentication, TypeScript/Python interoperability, replay tickets, malformed data, fresh guards, no retries, offline sockets and live-only relay behavior. These checks are not an independent security certification of the complete product.
