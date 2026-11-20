#!/bin/bash
set -euo pipefail
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
task_xcode_version="$(xcodebuild -version | head -n 1 | awk '{print $2}')"
task_xcode_major="${task_xcode_version%%.*}"
task_xcode_minor="$(echo "$task_xcode_version" | cut -d. -f2)"
if [ "$task_xcode_major" -lt 26 ] || { [ "$task_xcode_major" -eq 26 ] && [ "$task_xcode_minor" -lt 4 ]; }; then
  echo "Xcode 26.4+ erforderlich / required. Installiert / installed: $task_xcode_version"
  echo "macOS 13 Ventura kann diese Xcode-Version nicht ausführen."
  echo "Stattdessen GitHub Actions > Drevos Mobile verwenden / Use the hosted GitHub build."
  read -r -p "Enter zum Beenden / to close: "
  exit 1
fi
export EXPO_NO_TELEMETRY=1
npm ci
npm run typecheck
npm test
npx expo prebuild --platform ios
open ios/Drevos.xcworkspace
echo "In Xcode: Signing & Capabilities > Team wählen, iPhone auswählen und Run drücken."
echo "In Xcode: choose your Team under Signing & Capabilities, select your iPhone, then Run."
read -r -p "Enter zum Beenden / to close: "
