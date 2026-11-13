# Setup: what to install

Works in a Claude cloud session (the session-start hook does all of it) or on a Mac/Linux machine by hand.

## In a Claude cloud session (automatic)
`.claude/hooks/session-start.sh` runs at every session start (registered in `.claude/settings.json`) and is idempotent:
1. `cd video && npm install`: Remotion 4.0.537, `@remotion/three`, Three.js 0.169, `@react-three/fiber` 8.17.10, React 18, TypeScript.
   **Commit `video/package-lock.json`**: the hook only installs when it exists.
2. `pip install -r pipeline/requirements.txt`: `faster-whisper`, `numpy`, `requests`, `msgpack`.
3. `ffmpeg` (apt) if missing.
4. The Whisper `small` model (about 0.5 GB from Hugging Face), cached so the first timing run doesn't stall.
5. The preinstalled Chromium under `/opt/pw-browsers` (`video/remotion.config.ts` finds it and turns on software WebGL "swangle";
   there's no GPU). Never run `playwright install` or let Remotion download its own browser.
6. `rclone` (pinned version, checksum-verified) for Google Drive uploads.
7. Reports (never prints) whether `BEAN_FISH_API_KEY` and `RCLONE_CONFIG_GDRIVE_TOKEN` are available.

Speed here: about 140 frames a minute on 4 cores, so a 65 s Short (about 1,950 frames) is about 14 minutes on one session.

## Keys (already in `config/keys.env`)
- `BEAN_FISH_API_KEY`: the owner's Fish Audio API key.
- `RCLONE_CONFIG_GDRIVE_TOKEN`: the Google Drive token for `pipeline/upload_drive.sh` (uploads go to "Beanfolk/Shorts").
- They're already in `config/keys.env` (committed: the owner's decision, the repo is private). Never print the values.

## On a Mac by hand
`brew install node ffmpeg python`; `cd video && npm install`; `pip3 install -r pipeline/requirements.txt`. Remotion uses its own
Chrome and the GPU there (no flags needed). Preview with `cd video && npx remotion studio`.

## Check it works
```bash
cd video && npx tsc --noEmit && npx remotion still src/index.ts Smoke out/smoke.png --frame=45 --timeout=240000
```
You should see a placeholder bean on a little stage with "BEANFOLK" under it.
