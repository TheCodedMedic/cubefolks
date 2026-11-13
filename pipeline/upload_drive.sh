#!/bin/bash
# Upload a finished file to the user's Google Drive, this studio's own folder "Beanfolk/Shorts" (one folder per channel,
# the owner's rule 2026-11-11; override with DRIVE_FOLDER), and print its link.
# Needs rclone (installed by the session-start hook) and the environment variables RCLONE_CONFIG_GDRIVE_TYPE=drive,
# RCLONE_CONFIG_GDRIVE_SCOPE=drive.file and RCLONE_CONFIG_GDRIVE_TOKEN (from `rclone authorize "drive" --drive-scope drive.file`
# on the user's own computer). The drive.file scope only reaches files this tool uploads. Never print the token.
# Usage: pipeline/upload_drive.sh <file> [subfolder]
set -euo pipefail
f="$1"; sub="${2:-Episodes}"
[ -f "$f" ] || { echo "no such file: $f" >&2; exit 1; }
# fall back to the git-ignored .env (this container only) when the environment settings don't carry the token
for kf in "$(dirname "$0")/../config/keys.env" "$(dirname "$0")/../.env"; do   # the repo's keys file, then the local .env
  if [ -z "${RCLONE_CONFIG_GDRIVE_TOKEN:-}" ] && [ -f "$kf" ]; then
    while IFS='=' read -r k v; do case "$k" in RCLONE_CONFIG_GDRIVE_*) export "$k=$v";; esac; done < "$kf"
  fi
done
[ -n "${RCLONE_CONFIG_GDRIVE_TOKEN:-}" ] || { echo "RCLONE_CONFIG_GDRIVE_TOKEN is not set (add it in the environment settings, then start a new session)" >&2; exit 2; }
export RCLONE_CONFIG_GDRIVE_TYPE="${RCLONE_CONFIG_GDRIVE_TYPE:-drive}" RCLONE_CONFIG_GDRIVE_SCOPE="${RCLONE_CONFIG_GDRIVE_SCOPE:-drive.file}"
folder="${DRIVE_FOLDER:-Cubefolks/Shorts}"
dest="gdrive:$folder"
rclone copy "$f" "$dest" --drive-chunk-size 64M --transfers 1 --retries 5 --low-level-retries 20 --stats 30s --stats-one-line
# a share link (anyone with the link can view): the user is fine with uploads being public (2026-10-25)
rclone link "$dest/$(basename "$f")" 2>/dev/null || echo "uploaded to: $folder/$(basename "$f")"
