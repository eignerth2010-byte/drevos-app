#!/bin/sh
# Existing verified Drevos gateway required. This installer never changes PLC values.
set -eu
test "$(id -u)" -eq 0 || { echo 'Run with sudo.' >&2; exit 1; }
task_source=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
test -f /etc/drevos/gateway.json || { echo 'Install and verify the local gateway first.'; exit 1; }
task_relay=${1:-}
if test -z "$task_relay" && test -f "$task_source/cloud/endpoint.json"; then
  task_relay=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["relay"])' "$task_source/cloud/endpoint.json")
fi
test -n "$task_relay" || { echo 'The app operator must configure the public relay endpoint first. See README.'; exit 1; }
python3 - "$task_relay" <<'PY'
from urllib.parse import urlsplit
import sys
p=urlsplit(sys.argv[1])
assert p.scheme=='https' and p.hostname and not p.username and not p.password and p.path in ('','/') and not p.query and not p.fragment, 'Use the operator HTTPS relay base URL'
PY
# Upgrade only the local gateway program; its private configuration and PLC values remain intact.
if ! /opt/drevos/.venv/bin/python -c 'from drevos_gateway import __version__; assert tuple(map(int,__version__.split("."))) >= (0,1,1)' 2>/dev/null; then
  sh "$task_source/scripts/install-gateway.sh"
  systemctl restart drevos-gateway.service
fi
# Debian supplies architecture-specific, security-maintained crypto builds for every supported Pi.
apt-get update
apt-get install -y python3-venv python3-cryptography ca-certificates
id drevos-cloud >/dev/null 2>&1 || useradd --system --home-dir /opt/drevos-cloud --user-group --shell /usr/sbin/nologin drevos-cloud
install -d -m 755 /opt/drevos-cloud /opt/drevos-cloud/source
install -d -m 700 -o drevos-cloud -g drevos-cloud /etc/drevos-cloud
cp -R "$task_source/cloud_agent/drevos_cloud" /opt/drevos-cloud/source/
cp "$task_source/cloud_agent/pyproject.toml" /opt/drevos-cloud/source/
python3 -m venv --system-site-packages /opt/drevos-cloud/.venv
/opt/drevos-cloud/.venv/bin/pip install 'websockets==17.4' 'qrcode==8.2'
/opt/drevos-cloud/.venv/bin/pip install --no-deps /opt/drevos-cloud/source
if ! test -f /etc/drevos-cloud/config.json; then
  /opt/drevos-cloud/.venv/bin/drevos-cloud --init --relay "$task_relay"
fi
chown drevos-cloud:drevos-cloud /etc/drevos-cloud/config.json
chmod 600 /etc/drevos-cloud/config.json /etc/drevos-cloud/pairing.json
install -m 644 "$task_source/systemd/drevos-cloud.service" /etc/systemd/system/drevos-cloud.service
systemctl daemon-reload
systemctl enable drevos-cloud.service
systemctl restart drevos-cloud.service
echo 'Standalone app connection installed. PLC setpoints and requests were not changed.'
echo 'Open pairing with: sudo /opt/drevos-cloud/.venv/bin/drevos-cloud --pair --pair-bind YOUR_PI_LAN_IP'
echo 'The pairing page only opens for five minutes and must never be forwarded to the internet.'
