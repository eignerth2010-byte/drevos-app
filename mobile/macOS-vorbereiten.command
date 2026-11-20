#!/bin/bash
set -euo pipefail
trap 'task_status=$?; printf "\nDrevos: Abbruch in Zeile %s (Status %s).\nDrevos: stopped at line %s (status %s).\n" "$LINENO" "$task_status" "$LINENO" "$task_status" >&2; exit "$task_status"' ERR
cd "$(dirname "$0")"
echo "Drevos – iOS-Projekt vorbereiten / Prepare iOS project"
if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo "Bitte zuerst Node.js 24 LTS installieren: https://nodejs.org/"
  echo "Install Node.js 24 LTS first."
  read -r -p "Enter zum Beenden / to close: "
  exit 1
fi
if ! xcode-select -p >/dev/null 2>&1; then
  echo "Bitte Xcode installieren und einmal öffnen. / Install and open Xcode first."
  read -r -p "Enter zum Beenden / to close: "
  exit 1
fi
echo "Prüfe Xcode / Checking Xcode…"
if ! task_xcode_output="$(xcodebuild -version 2>&1)"; then
  printf '%s\n' "$task_xcode_output" >&2
  echo "Bitte Xcode > Settings > Locations > Command Line Tools prüfen und dein Xcode auswählen." >&2
  echo "Check Xcode > Settings > Locations > Command Line Tools and select your Xcode app." >&2
  exit 1
fi
# Read the complete output. With pipefail, head can close the pipe before
# xcodebuild finishes and silently stop this script with SIGPIPE/status 141.
task_xcode_version="$(printf '%s\n' "$task_xcode_output" | awk '$1 == "Xcode" { print $2 }')"
if ! [[ "$task_xcode_version" =~ ^[0-9]+(\.[0-9]+)*$ ]]; then
  printf '%s\n' "$task_xcode_output" >&2
  echo "Xcode-Version nicht erkannt / Unable to identify the Xcode version." >&2
  exit 1
fi
task_xcode_major="${task_xcode_version%%.*}"
task_xcode_remainder="${task_xcode_version#*.}"
task_xcode_minor="${task_xcode_remainder%%.*}"
if [ "$task_xcode_version" = "$task_xcode_major" ]; then task_xcode_minor=0; fi
if [ "$task_xcode_major" -lt 26 ] || { [ "$task_xcode_major" -eq 26 ] && [ "$task_xcode_minor" -lt 4 ]; }; then
  echo "Xcode 26.4+ erforderlich / required. Installiert / installed: $task_xcode_version"
  echo "macOS 13 Ventura kann diese Xcode-Version nicht ausführen."
  echo "Stattdessen GitHub Actions > Drevos App verwenden / Use the hosted GitHub build."
  read -r -p "Enter zum Beenden / to close: "
  exit 1
fi
export EXPO_NO_TELEMETRY=1
echo "Xcode $task_xcode_version erkannt. Bereite die App vor / Preparing the app…"
npm ci
npm run typecheck
npm test
npx expo prebuild --platform ios
open ios/Drevos.xcworkspace
echo "In Xcode: Signing & Capabilities > Team wählen, iPhone auswählen und Run drücken."
echo "In Xcode: choose your Team under Signing & Capabilities, select your iPhone, then Run."
read -r -p "Enter zum Beenden / to close: "
