#!/bin/bash
# Blocks edits to secrets, generated files and report documents. See CLAUDE.md rules 2 and 7.
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
FILE_PATH="${FILE_PATH//\\//}"

case "$FILE_PATH" in
  *.env.local|*.env.*.local|*/.git/*|*/package-lock.json|*/public/mockServiceWorker.js)
    echo "Blocked: $FILE_PATH is a secret or generated file. Ask the human." >&2; exit 2 ;;
  */docs/backend/*)
    echo "Blocked: docs/backend/ mirrors BackendSo. Change it there, then run scripts/sync-backend-docs.sh." >&2; exit 2 ;;
  *.pdf|*.PDF|*.xlsx|*.docx|*.woff|*.woff2|*.otf|*.ttf)
    echo "Blocked: no report documents or font files in this repo (synthetic data only, O-4)." >&2; exit 2 ;;
esac
exit 0
