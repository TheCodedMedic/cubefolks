# The music library (the user, 2026-10-26)

The user: "All the tracks and musics we've been using... save them in the repo with descriptions of the kind of scenes they fit, so in the future we can reuse any music... and keep improving our library."

- Every claim-free track is catalogued in `music/LIBRARY.md` (readable) and `music/library.json` (data): file, length, an energy shape per 10 s, mood, instruments, what it suits, where it was used, tags, and its credit.
- **Before asking for new music, look in the library first.** Reuse fitting tracks; ask the user for new Gemini songs only for scenes the library can't cover.
- **When a track is added:** put it in its folder, add its credit to that folder's `credits.json`, add a description to `music/library_notes.json`, run `python3 -I music/catalog.py`, commit. Update `used_in` when a track is reused.
- Our own synthesized effects live per episode in `episodes/<ep>/sfx_gen/` (e.g. Ep09's Stingy Jack TOCK, VHS, static, rotary ring).
