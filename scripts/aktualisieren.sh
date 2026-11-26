#!/usr/bin/env bash
# Holt die neueste Version von GitHub und startet die App für Expo Go.
# Nutzung im Projektordner:  npm run aktualisieren
set -e
cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "⚠️  Im Ordner gibt es eigene Änderungen. Bitte zuerst sichern oder mit 'git stash' beiseitelegen."
  exit 1
fi

vorher=$(git rev-parse HEAD)
echo "⬇️  Hole neue Version …"
git pull --ff-only

if [ ! -d node_modules ] || ! git diff --quiet "$vorher" HEAD -- package.json package-lock.json; then
  echo "📦 Neue oder geänderte Pakete – installiere …"
  npm install
else
  echo "📦 Keine neuen Pakete."
fi

echo "✅ Aktuell: $(git log -1 --format='%s (%cd)' --date=format:'%d.%m. %H:%M')"
echo "🚀 Starte Expo – QR-Code mit der Kamera bzw. Expo Go scannen."
npx expo start --go
