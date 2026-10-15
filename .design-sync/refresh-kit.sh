#!/bin/sh
# Rebuild the Log-Log Legends Kit's bundle and previews from the repo and stage
# what changed for publishing to https://claude.ai/artifact/JRrSbSw7WMvvxRr57oBmWD.
# Build and capture only: nothing here talks to claude.ai. Publishing is an
# Artifact tool call, described in .design-sync/NOTES.md ("Refreshing the kit").
#
# Usage: .design-sync/refresh-kit.sh [Component,Component,...]
#   The optional list is captured to ds-bundle/_screenshots/review/ for a look.
set -e
cd "$(dirname "$0")/.."

# The converter is not in the repo. Restore it from the local backup.
if [ ! -f .ds-sync/package-build.mjs ]; then
  test -d "$HOME/.cache/log-log-ds-sync" || { echo "no converter: see NOTES.md, Refreshing the kit" >&2; exit 1; }
  cp -cR "$HOME/.cache/log-log-ds-sync" .ds-sync
fi
# The repo's own node_modules; clone (APFS), never symlink: Turbopack refuses links.
if [ ! -d node_modules/next ]; then
  src=$(git worktree list --porcelain | sed -n 's/^worktree //p' | while read w; do
    [ -d "$w/node_modules/next" ] && [ "$w" != "$(pwd)" ] && echo "$w" && break; done)
  test -n "$src" || { echo "no node_modules: run npm ci" >&2; exit 1; }
  cp -cR "$src/node_modules" node_modules
fi

.design-sync/pkg/build.sh
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --entry .design-sync/pkg/entry.ts --out ./ds-bundle
if [ -n "$1" ]; then
  node .ds-sync/package-capture.mjs --out ./ds-bundle --components "$1" --force
fi
node .design-sync/stage-kit.mjs
