"""Authenticated encryption and one-use, monotonic command tickets."""
import base64
import json
import re
import secrets
import time
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def seal(key, room, direction, message, nonce=None):
    nonce = nonce or secrets.token_bytes(12)
    aad = f"drevos-cloud:1:{room}:{direction}".encode()
    ciphertext = AESGCM(bytes.fromhex(key)).encrypt(nonce, json.dumps(message, separators=(",", ":")).encode(), aad)
    return json.dumps({"v": 1, "n": base64.b64encode(nonce).decode(), "c": base64.b64encode(ciphertext).decode()}, separators=(",", ":"))


def open_packet(key, room, direction, packet):
    if not isinstance(packet, str) or len(packet) > 30000:
        raise ValueError("Invalid packet")
    data = json.loads(packet)
    if data.get("v") != 1:
        raise ValueError("Invalid packet")
    nonce = base64.b64decode(data["n"], validate=True)
    ciphertext = base64.b64decode(data["c"], validate=True)
    if len(nonce) != 12 or len(ciphertext) > 18000:
        raise ValueError("Invalid packet")
    aad = f"drevos-cloud:1:{room}:{direction}".encode()
    return json.loads(AESGCM(bytes.fromhex(key)).decrypt(nonce, ciphertext, aad))


LIMITS = {"kammertemperatur_soll": (0, 120), "kerntemperatur_ziel": (0, 115), "rauch_soll": (0, 100), "timer_dauer": (1, 9999)}
SWITCHES = {"konvektion", "luefter", "heizelement", "rauchbetrieb", "timer_lauf"}


def validate_command(command):
    if not isinstance(command, dict) or set(command) != {"name", "value"}:
        raise ValueError("Invalid command")
    name, value = command["name"], command["value"]
    if not isinstance(name, str) or not isinstance(value, str) or len(value) > 16:
        raise ValueError("Invalid command")
    if name in SWITCHES and value in ("ON", "OFF"):
        return command
    if name in LIMITS and re.fullmatch(r"\d{1,4}", value) and LIMITS[name][0] <= int(value) <= LIMITS[name][1]:
        return command
    if (name, value) in (("timer_reset", "RESET"), ("shutdown", "SHUTDOWN")):
        return command
    raise ValueError("Invalid command")


class Tickets:
    def __init__(self, now=time.monotonic):
        self.boot = secrets.token_hex(16)
        self.now = now
        self.tickets = {}
        self.seen = {}

    def check_request(self, message):
        client, request_id = message.get("client"), message.get("id")
        if not isinstance(client, str) or not isinstance(request_id, str) or not re.fullmatch(r"[a-f0-9]{32}", client) or not re.fullmatch(r"[a-f0-9]{32}", request_id):
            raise ValueError("Invalid request")
        identity = (client, request_id)
        if identity in self.seen:
            raise ValueError("Replayed request")
        self.seen[identity] = True
        if len(self.seen) > 2048:
            self.seen.pop(next(iter(self.seen)))

    def prepare(self, message):
        if message.get("boot") != self.boot:
            raise PermissionError("Expired session")
        command = validate_command(message.get("command"))
        now = self.now()
        self.tickets = {k: v for k, v in self.tickets.items() if v[0] > now}
        if len(self.tickets) >= 16:
            raise PermissionError("Busy")
        ticket = secrets.token_hex(16)
        self.tickets[ticket] = (now + 8, message["client"], command.copy())
        return {"ticket": ticket}

    def consume(self, message):
        if message.get("boot") != self.boot:
            raise PermissionError("Expired session")
        ticket = self.tickets.pop(message.get("ticket"), None)
        command = validate_command(message.get("command"))
        if not ticket or ticket[0] <= self.now() or ticket[1] != message.get("client") or ticket[2] != command:
            raise PermissionError("Invalid or expired command ticket")
        return command
