"""Short-lived, LAN-only pairing page. Not part of the public relay service."""
import html
import io
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import qrcode
from qrcode.image.svg import SvgPathImage


def serve_pairing(pairing_file, bind, hostname="drevos-pi.local", port=8765, duration=300):
    pair = json.loads(Path(pairing_file).read_text())
    code = json.dumps(pair, separators=(",", ":"))
    qr = qrcode.make(code, image_factory=SvgPathImage, border=4)
    svg_buffer = io.BytesIO()
    qr.save(svg_buffer)
    svg = svg_buffer.getvalue()
    deadline = time.monotonic() + min(600, max(30, duration))
    allowed_hosts = {hostname.lower(), bind, "localhost", "127.0.0.1"}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def authorized(self):
            try:
                host = urlsplit("http://" + self.headers.get("Host", "")).hostname
            except ValueError:
                return False
            return host in allowed_hosts and (not self.headers.get("Origin") or self.headers["Origin"] == "http://" + self.headers["Host"])

        def reply(self, status, body, content_type):
            self.send_response(status)
            for name, value in {"Content-Type": content_type, "Content-Length": str(len(body)), "Cache-Control": "no-store", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff"}.items():
                self.send_header(name, value)
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if not self.authorized() or time.monotonic() >= deadline:
                self.reply(403, b"Pairing closed", "text/plain")
                return
            if self.path == "/qr.svg":
                self.reply(200, svg, "image/svg+xml")
            elif self.path == "/":
                body = '''<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Drevos koppeln</title>
<style>body{font:17px system-ui;background:#11191d;color:#eee;max-width:620px;margin:30px auto;padding:20px}h1{color:#ffad62}img{width:min(100%,440px);display:block;background:white}textarea{width:100%;height:72px}button{padding:14px;margin:12px 6px 12px 0;background:#ffad62;border:0;border-radius:8px;font-size:16px}</style>
<h1>Drevos-App koppeln</h1><p>Öffne die Drevos-App und wähle „Ofen koppeln“. Scanne diesen Code. / Open the Drevos app, choose “Pair oven” and scan this code.</p>
<img src="/qr.svg" alt="Privater Drevos-Kopplungscode"><p>Auf demselben Handy: Code kopieren, zur App wechseln und dort „Code einfügen“ wählen. / On the same phone: copy the code and paste it in the app.</p>
<textarea id="code" readonly>''' + html.escape(code) + '''</textarea><button onclick="document.getElementById('code').select();document.execCommand('copy');this.textContent='Kopiert / Copied'">Code kopieren / Copy code</button>
<button onclick="fetch('/finish',{method:'POST'}).then(()=>document.body.textContent='Kopplungsseite geschlossen / Pairing page closed')">Fertig / Done</button>
<p>Dieser Code erlaubt die Bedienung deines Ofens. Privat aufbewahren. Die Seite schließt nach fünf Minuten. / This code grants access to your oven. Keep it private. This page closes after five minutes.</p></html>'''
                self.reply(200, body.encode(), "text/html; charset=utf-8")
            else:
                self.reply(404, b"Not found", "text/plain")

        def do_POST(self):
            if self.path != "/finish" or not self.authorized():
                self.reply(403, b"Forbidden", "text/plain")
                return
            self.reply(200, b"Closed", "text/plain")
            self.server.finished = True

    class Server(HTTPServer):
        finished = False

        def get_request(self):
            connection, address = super().get_request()
            connection.settimeout(5)
            return connection, address

    with Server((bind, port), Handler) as server:
        server.timeout = 1
        print(f"Open http://{hostname}:{port} in your home network. Pairing closes after five minutes.")
        while not server.finished and time.monotonic() < deadline:
            server.handle_request()
