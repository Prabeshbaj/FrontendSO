#!/usr/bin/env bash
# Mirror the shared docs from BackendSo into docs/backend/ (D-27).
# BackendSo is the source of truth. Never edit docs/backend/ by hand.
#
#   scripts/sync-backend-docs.sh            update the mirrors from BackendSo main
#   scripts/sync-backend-docs.sh <ref>      update from a branch, tag or commit
#   scripts/sync-backend-docs.sh --check    exit 1 if the mirrors differ from BackendSo main
#
# Needs the GitHub CLI (`gh`) signed in with read access to Prabeshbaj/BackendSo.
set -euo pipefail

REPO="Prabeshbaj/BackendSo"
FILES=(decisions.md requirements.md architecture.md implementation-plan.md)
DEST="$(cd "$(dirname "$0")/.." && pwd)/docs/backend"

CHECK=0
REF="main"
if [[ "${1:-}" == "--check" ]]; then CHECK=1; elif [[ -n "${1:-}" ]]; then REF="$1"; fi

SHA=$(gh api "repos/$REPO/commits/$REF" --jq .sha)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

for f in "${FILES[@]}"; do
  {
    echo "<!-- MIRROR of $REPO@${SHA:0:7}:docs/$f. Do not edit here. Change it in BackendSo, then run scripts/sync-backend-docs.sh -->"
    echo
    gh api -H "Accept: application/vnd.github.raw" "repos/$REPO/contents/docs/$f?ref=$SHA"
  } > "$TMP/$f"
done

if [[ $CHECK -eq 1 ]]; then
  stale=0
  for f in "${FILES[@]}"; do
    # Compare content only; the header line carries the commit and changes every sync.
    if ! diff -q <(tail -n +2 "$TMP/$f") <(tail -n +2 "$DEST/$f" 2>/dev/null) >/dev/null; then
      echo "stale: docs/backend/$f (BackendSo main is ${SHA:0:7})"; stale=1
    fi
  done
  [[ $stale -eq 0 ]] && echo "docs/backend/ matches BackendSo@${SHA:0:7}"
  exit $stale
fi

mkdir -p "$DEST"
cp "$TMP"/*.md "$DEST/"
echo "Synced ${FILES[*]} from $REPO@${SHA:0:7} into docs/backend/"
