#!/bin/bash
# SessionStart hook for Claude cloud sessions on this studio repo: makes the video toolchain ready before work starts.
# Runs only in a cloud container (CLAUDE_CODE_REMOTE=true). Idempotent; nothing here needs a key.
set -uo pipefail
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$ROOT" || exit 0
log() { echo "[session-start] $*"; }

# 1. Remotion + Three.js (video/). `npm install` keeps the cached node_modules when the lockfile is unchanged.
if [ -f video/package-lock.json ]; then
  if (cd video && npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1); then
    log "video/node_modules ready ($(cd video && ./node_modules/.bin/remotion --version 2>/dev/null | head -1))"
  else
    log "WARNING: npm install failed in video/ (run it by hand: cd video && npm install)"
  fi
fi

# 2. Python pipeline (faster-whisper, numpy, requests).
if python3 -c "import faster_whisper, numpy, requests" 2>/dev/null; then
  log "python pipeline packages present"
else
  pip install -q -r pipeline/requirements.txt >/dev/null 2>&1 || pip install -q --break-system-packages -r pipeline/requirements.txt >/dev/null 2>&1
  python3 -c "import faster_whisper, numpy, requests" 2>/dev/null && log "python pipeline packages installed" || log "WARNING: pip install -r pipeline/requirements.txt failed"
fi

# 3. ffmpeg (the mixer, the finisher and Whisper's decoder all shell out to it).
if command -v ffmpeg >/dev/null 2>&1; then
  log "ffmpeg $(ffmpeg -version 2>/dev/null | head -1 | cut -d' ' -f3)"
else
  (apt-get install -y ffmpeg >/dev/null 2>&1 && log "ffmpeg installed") || log "WARNING: ffmpeg missing and apt-get failed"
fi

# 4. The Whisper 'small' model (about 0.5 GB from Hugging Face), so the first timing run does not stall on a download.
if python3 - <<'PY' 2>/dev/null
from faster_whisper import WhisperModel
WhisperModel("small", device="cpu", compute_type="int8")
PY
then log "whisper small model cached"; else log "WARNING: whisper model download failed (it will retry on first use)"; fi

# 5. Synthesised effects for any 3D episode whose cue sheet needs them but whose sfx_gen folder is missing.
for ep in episodes/*/; do
  if [ -f "$ep/cues_full.py" ] && grep -q 'sfx_gen' "$ep/cues_full.py" && [ ! -f "$ep/sfx_gen/zap.wav" ]; then
    python3 -I pipeline/sfx_gen.py "$ep" >/dev/null 2>&1 && log "synthesised effects built for $ep" || log "WARNING: sfx_gen failed for $ep"
  fi
done

# 6. The browser Remotion must use here (video/remotion.config.ts also finds it) and the key we expect.
CHROME=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell 2>/dev/null | sort -V | tail -1 || true)
if [ -n "$CHROME" ]; then
  echo "export BEAN_CHROME=\"$CHROME\"" >> "${CLAUDE_ENV_FILE:-/dev/null}"
  log "chromium headless shell: $CHROME"
else
  log "WARNING: no preinstalled Chromium under /opt/pw-browsers (Remotion cannot download its own here)"
fi
# 6b. Keys kept in this private repo (config/keys.env, the user's decision 2026-10-25): export them to the session.
if [ -f config/keys.env ]; then
  grep -E '^[A-Z_]+=' config/keys.env | while IFS='=' read -r k v; do [ -z "${!k:-}" ] && printf 'export %s=%q\n' "$k" "$v" >> "${CLAUDE_ENV_FILE:-/dev/null}"; done
  log "keys loaded from config/keys.env"
fi
if [ -f config/rclone.conf ] && [ ! -s "$HOME/.config/rclone/rclone.conf" ]; then
  mkdir -p "$HOME/.config/rclone" && cp config/rclone.conf "$HOME/.config/rclone/rclone.conf" && log "rclone config installed from config/rclone.conf"
fi
# 7. rclone, for uploading finished videos to the user's Google Drive (the user said yes, 2026-10-25); pinned and checksum-verified.
RCLONE_V=v1.75.2; RCLONE_SHA=349ac8fba6ff65d6247043f1750cdcb518ec5d500ef91463a10d37c0ccdf3702
if ! command -v rclone >/dev/null 2>&1; then
  T=$(mktemp -d) && curl -sSL "https://downloads.rclone.org/$RCLONE_V/rclone-$RCLONE_V-linux-amd64.zip" -o "$T/r.zip" \
    && echo "$RCLONE_SHA  $T/r.zip" | sha256sum -c --quiet - && unzip -q "$T/r.zip" -d "$T" \
    && install -m 755 "$T/rclone-$RCLONE_V-linux-amd64/rclone" /usr/local/bin/rclone && log "rclone $RCLONE_V installed" \
    || log "WARNING: rclone install failed (Drive uploads unavailable)"; rm -rf "$T"
else log "rclone present"; fi
if [ -n "${RCLONE_CONFIG_GDRIVE_TOKEN:-}" ] || grep -qs "^RCLONE_CONFIG_GDRIVE_TOKEN=." config/keys.env; then log "Google Drive token is set (pipeline/upload_drive.sh works)"; else log "NOTE: RCLONE_CONFIG_GDRIVE_TOKEN is not set: Drive uploads need it (docs/CLOUD_SETUP.md)"; fi
if [ -n "${BEAN_FISH_API_KEY:-}" ] || grep -qs '^BEAN_FISH_API_KEY=.' .env config/keys.env; then log "BEAN_FISH_API_KEY is available (voicing possible)"; else log "NOTE: BEAN_FISH_API_KEY is not set: add it to the environment before voicing"; fi
exit 0
