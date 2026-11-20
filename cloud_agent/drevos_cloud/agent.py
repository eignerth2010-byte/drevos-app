"""Outbound-only encrypted bridge to the existing local Drevos gateway."""
import argparse
import asyncio
import json
import logging
import os
from pathlib import Path
import secrets
import urllib.error
import urllib.request
from urllib.parse import urlsplit

from websockets.asyncio.client import connect
from .protocol import Tickets, open_packet, seal

LOG = logging.getLogger(__name__)


class LocalGateway:
    def __init__(self, config):
        parts = urlsplit(config["gateway_url"])
        if parts.scheme not in ("http", "https") or parts.username or parts.password or parts.path not in ("", "/") or parts.query or parts.fragment:
            raise ValueError("Invalid local gateway URL")
        self.url = config["gateway_url"].rstrip("/")
        self.token = config["gateway_token"]

    def request(self, resource, payload=None):
        if resource not in ("info", "state", "command") or (resource == "command") != (payload is not None):
            raise ValueError("Invalid gateway request")
        request = urllib.request.Request(self.url + "/api/v1/" + resource,
            data=json.dumps(payload).encode() if payload is not None else None,
            headers={"Authorization": "Bearer " + self.token, "Content-Type": "application/json"})
        # A fixed local gateway is the only HTTP destination. No URLs come from relay messages.
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, *args):
                return None
        with urllib.request.build_opener(NoRedirect).open(request, timeout=10) as response:
            data = json.load(response)
        if not isinstance(data, dict):
            raise ValueError("Invalid gateway response")
        return data


class Agent:
    def __init__(self, config, gateway=None):
        self.config = config
        self.gateway = gateway or LocalGateway(config)
        self.tickets = Tickets()
        self.lock = asyncio.Lock()

    async def handle(self, message):
        if not isinstance(message, dict):
            return None
        identity = {"id": message.get("id"), "client": message.get("client"), "boot": self.tickets.boot}
        try:
            self.tickets.check_request(message)
            kind = message.get("type")
            if kind == "read" and message.get("resource") in ("info", "state"):
                if self.lock.locked():
                    raise PermissionError("Busy")
                async with self.lock:
                    result = await asyncio.to_thread(self.gateway.request, message["resource"])
                if message["resource"] == "info" and result.get("id") != self.config["gateway_id"]:
                    raise PermissionError("Wrong gateway")
            elif kind == "prepare":
                result = self.tickets.prepare(message)
            elif kind == "execute":
                if self.lock.locked():
                    raise PermissionError("Busy")
                command = self.tickets.consume(message)
                async with self.lock:
                    result = await asyncio.to_thread(self.gateway.request, "command", command)
            else:
                raise ValueError("Invalid request")
            return {**identity, "ok": True, "result": result}
        except PermissionError:
            return {**identity, "ok": False, "error": "permission"}
        except urllib.error.HTTPError as error:
            return {**identity, "ok": False, "error": "permission" if error.code in (403, 409) else "auth" if error.code == 401 else "server"}
        except (OSError, ValueError, TypeError, KeyError):
            return {**identity, "ok": False, "error": "server"}

    async def serve_socket(self, socket):
        pending=set()
        async def respond(message):
            reply=await self.handle(message)
            if reply:
                try:
                    await socket.send(json.dumps({'type':'data','payload':seal(self.config['key'],self.config['room'],'pi-to-app',reply)}))
                except Exception:
                    pass  # Never retry a reply or its command after a broken connection.
        try:
            async for frame in socket:
                try:
                    data=json.loads(frame)
                    if data.get('type')!='data':continue
                    message=open_packet(self.config['key'],self.config['room'],'app-to-pi',data.get('payload'))
                except Exception:
                    continue
                if len(pending)>=32:
                    await socket.close(code=1008)
                    break
                # Incoming commands reach the busy guard immediately instead of waiting behind reads.
                task=asyncio.create_task(respond(message))
                pending.add(task)
                task.add_done_callback(pending.discard)
        finally:
            if pending:
                await asyncio.gather(*pending,return_exceptions=True)

    async def run(self):
        relay = self.config["relay"].rstrip("/")
        parts = urlsplit(relay)
        if parts.scheme != "https" or not parts.netloc or parts.path not in ("", "/") or parts.query or parts.fragment or parts.username or parts.password:
            raise ValueError("A secure relay base URL is required")
        uri = "wss://" + parts.netloc + "/v1/rooms/" + self.config["room"] + "/socket"
        delay = 1
        while True:
            try:
                info = await asyncio.to_thread(self.gateway.request, "info")
                if info.get('id') != self.config['gateway_id'] or info.get('profile') != 'drevos_fx3u_v1' or info.get('api_version') != 1 or tuple(map(int,info.get('version','0.0.0').split('.'))) < (0,1,1):
                    raise ValueError('Local gateway update or profile verification required')
                async with connect(uri, open_timeout=15, close_timeout=3, ping_interval=20, ping_timeout=15, max_size=32768, max_queue=1, proxy=None) as socket:
                    self.tickets = Tickets()  # Reconnect invalidates every earlier command ticket.
                    await socket.send(json.dumps({"type": "hello", "role": "device", "auth": self.config["auth"]}))
                    delay = 1
                    await self.serve_socket(socket)
            except asyncio.CancelledError:
                raise
            except Exception:
                LOG.info("Relay connection unavailable; reconnecting")
                await asyncio.sleep(delay)
                delay = min(30, delay * 2)


def initialize(gateway_config, relay, destination, pairing_file):
    relay_parts=urlsplit(relay)
    if relay_parts.scheme!='https' or not relay_parts.hostname or relay_parts.username or relay_parts.password or relay_parts.path not in ('','/') or relay_parts.query or relay_parts.fragment:
        raise ValueError('A secure relay base URL is required')
    source = json.loads(Path(gateway_config).read_text())
    config = {"relay": relay.rstrip("/"), "room": secrets.token_hex(16), "key": secrets.token_hex(32), "auth": secrets.token_hex(32),
              "gateway_url": "http://" + source.get("bind", "127.0.0.1") + ":" + str(source.get("port", 8756)), "gateway_token": source["token"]}
    info = LocalGateway(config).request("info")
    if info.get("api_version") != 1 or info.get("profile") != "drevos_fx3u_v1":
        raise ValueError("Unsupported gateway profile")
    if tuple(int(n) for n in info.get("version", "0.0.0").split(".")) < (0, 1, 1):
        raise ValueError("Gateway 0.1.1 or newer is required; update the local gateway first")
    config["gateway_id"] = info["id"]
    pair = {"type": "drevos-cloud", "version": 1, "relay": config["relay"], "room": config["room"], "key": config["key"], "auth": config["auth"], "gatewayId": info["id"], "name": info["name"]}
    path = Path(destination)
    if path.exists():
        raise ValueError("Configuration exists; preserve existing pairing")
    with os.fdopen(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'w') as file:
        json.dump(config, file, indent=2)
    pair_path = Path(pairing_file)
    with os.fdopen(os.open(pair_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), 'w') as file:
        json.dump(pair, file, separators=(',', ':'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default="/etc/drevos-cloud/config.json")
    parser.add_argument("--init", action="store_true")
    parser.add_argument("--gateway-config", default="/etc/drevos/gateway.json")
    parser.add_argument("--relay")
    parser.add_argument("--pairing-file", default="/etc/drevos-cloud/pairing.json")
    parser.add_argument("--pair", action="store_true", help="Open the LAN pairing page for five minutes")
    parser.add_argument("--pair-bind", default="127.0.0.1")
    parser.add_argument("--pair-hostname", default="drevos-pi.local")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    if args.pair:
        from .pairing import serve_pairing
        serve_pairing(args.pairing_file, args.pair_bind, args.pair_hostname)
        return
    if args.init:
        if not args.relay:
            parser.error("--relay is required")
        initialize(args.gateway_config, args.relay, args.config, args.pairing_file)
        print("Private pairing file created locally; do not publish it.")
        return
    path = Path(args.config)
    if os.name == "posix" and path.stat().st_mode & 0o077:
        raise SystemExit("Cloud configuration must be private (chmod 600)")
    config = json.loads(path.read_text())
    asyncio.run(Agent(config).run())


if __name__ == "__main__":
    main()
