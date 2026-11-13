# Cubefolks: a studio for blocky-game story Shorts

The studio for the YouTube channel **Cubefolks** (handle to be confirmed by the owner): creepy, curious, first-person story Shorts
(1080×1920, about 30-60 s) in the **blocky online-game style** the owner loves: boxy R6-style characters with flat black decal
faces, suburban towns, schools, churches and kitchens, a kid narrator telling a strange story about their town, one-word captions,
a new shot about every second, and a twist that turns the danger onto the narrator. Built as real 3D in code: Three.js inside
Remotion (`video/`), the owner's voice from Fish Audio, word timing from Whisper, a Python mixer.

This repo was set up on 2026-11-13 from the owner's Beanfolk studio (`TheCodedMedic/beanfolk`, https://www.youtube.com/@beanfolk),
where the blocky style was tested: a 7.6 s test and **Short 6 "The Reflection That Blinks First"** (42.4 s, finished 2026-11-12).
Everything reusable was copied here: the engine, the blocky kit, Short 6 as the working example, the pipeline, the sound library and
the lessons. **This channel is the blocky (Roblox-style) look only (the owner, 2026-11-13):** no bean, Inkfolk or other styles. Docs
copied from Beanfolk still say "Beanfolk" or mention bean characters: read them as this studio and its blocky style.

**Read everything before the first task**, in this order: this file; `notes/cubefolks/FIRST_TASKS.md` (what to do first);
`notes/short06/CONTRACT.md` (how Short 6 was built in parallel) and `notes/short06/ref/sample_contact.jpg` (the owner's sample);
`docs/PRODUCTION_PLAYBOOK.md` (the whole process); `knowledge/SHORTS_PLAYBOOK.md` (hooks, story shape, re-hooks, loop endings);
`docs/lessons/` (above all `short01-owner-notes.md` and `analytics-retention-comments.md`); `docs/LESSONS.md`;
`docs/RENDER_ON_MANY_SESSIONS.md`; `docs/VOICE.md`; `docs/templates/`; then `knowledge/STORYTELLING_HOOKS_GUIDE.md` and `knowledge/craft/`.

## The style (what the owner asked for, 2026-11-12/13)
- **Faces like real classic blocky-game characters:** flat black decal faces on a rounded-cylinder head: two small solid black
  oval eyes, a thin curved smile, simple variants (`video/src/blocky/BlockFace.tsx`, sheet `notes/short06/face_sheet.png`).
  Drawn by us. Never use Roblox's logo, name, branded items or copied decal files, in the picture, titles or channel art.
- **Blocky bodies** (the owner: "the characters are okay, the block is okay"): `video/src/blocky/BlockRig.tsx`, `Accessories.tsx`.
- **Real textures and soft overcast light** like the game: clapboard siding, shingles, picket fences, grass, wood floors, tiles
  (`video/src/blocky/Textures.ts`, `Look.tsx`); deep-blue nights with a face fill so faces stay readable.
- **Storytelling like the owner's sample:** first-person kid narrator, about 4.5 words a second, a strange town rule told as plain
  fact in line 1, specific neighbours and places, small clues that pile up, a community scene, then a twist that turns on the
  narrator; a last line that loops into line 1.
- **The owner's next asks (2026-11-13): analyse deeper, MORE MOTION, better storytelling, a better blocky-game feel.** Short 6's
  characters mostly stood still; that is the main thing to fix. See `notes/cubefolks/FIRST_TASKS.md`.

## How a Short is made
**Every script and first second is checked against `knowledge/SHORTS_PLAYBOOK.md`:** the script before voicing, frames 0, 15
and 45 before rendering.

1. **Script** in `episodes/<NN_slug>/`: `script.txt` (one beat per paragraph), `speakers.json` (all `"R"`), `episode.json`
   (`{"title": ..., "voice": {"lead": 0.05, "gap_default": 0.12, "tail": 0.6}}`). Keep the owner's words when they bring a
   script; when asked to write one, follow the sample's shape above.
2. **Voice:** `python3 pipeline/fish_cast.py episodes/<ep>`, then `python3 pipeline/assemble_cast.py episodes/<ep>`.
3. **Timing:** `python3 pipeline/whisper_words.py episodes/<ep>`, `python3 pipeline/align_cast.py episodes/<ep>`,
   `python3 -I pipeline/pace.py episodes/<ep>`, then a `timing.json` for the picture (as `video/src/short06_blocky/timing.json`).
   **Never type a time in seconds:** every cut, expression, caption, pop and sound comes from `at(beat, "word")`.
4. **Picture, built in parallel:** write a contract (as `notes/short06/CONTRACT.md`), start an integrator session first, then
   builders on their own branches (rig/motion, faces, look, sets, shots A/B, sound), each messaging the integrator. Work in
   `video/src/<short>/` on the blocky parts in `video/src/blocky/`.
5. **Review** stills of every shot (corners too), a contact sheet of every second, frames 0/15/45 and a 60-frame sequence of the
   busiest part. **Framing rule learned on Short 6:** medium and medium-wide shots like the sample, whole characters or head to
   knees, faces visible with the place around them, camera 2.5-5 m away; close-ups only for a face reaction; never a blank wall,
   the back of a head or a prop filling the frame; night scenes lit like night.
6. **Render** split across 10-20 sessions, each part on its own branch (`docs/RENDER_ON_MANY_SESSIONS.md`); about 64 frames a
   part runs in about 5 minutes. Give each part session a render timeout of at least 30 minutes (a 10-minute limit killed a part).
7. **Sound:** a cue sheet per Short (`episodes/<ep>/cues.py`, effects from `sfx/library/`, quiet creepy ambience), music
   **15 dB under the voice, measured** with `python3 -I pipeline/music_level.py <cues.py> -15`, then
   `python3 -I pipeline/mix.py episodes/<ep>/cues.py episodes/<ep>/mix.wav`.
8. **Finish:** `python3 pipeline/finish.py <picture.mp4> <mix.wav> exports/<name>.mp4` (−14 LUFS, −1.5 dBTP); upload with
   `bash pipeline/upload_drive.sh exports/<name>.mp4` (Drive folder `Cubefolks/Shorts`); send the owner the file and the link.
   A sound change never needs a re-render.
9. **Thumbnail, title, hashtags:** caption-free stills from the `<Short>Clean` composition; a curious title that keeps the twist.

## Rules that never bend
- **Stories do NOT have to be true (the owner's instruction, 2026-11-11).** Original, made-up stories are the default. A made-up
  story only has to make sense inside its own world: a clear hook, a fair twist, and at least two clues planted before the reveal.
  Never invent crimes or scandals for real, named people, and never present a made-up story as documented history.
- **Approval gates:** the cast and style sheet before the first full Short, the first finished Short, and anything the owner asks
  to see first.
- **Keys:** `config/keys.env` holds `BEAN_FISH_API_KEY` (the Fish account with credits), `BEAN_FISH1_API_KEY` (older, credits
  spent) and the Google Drive token (`RCLONE_CONFIG_GDRIVE_*`); `config/rclone.conf` is the Drive remote. The owner chose to keep
  them in this private repo (2026-11-13), shared with Beanfolk, Cipher Lore and Gizmo Origins; the pipeline, `pipeline/upload_drive.sh`
  and the session-start hook read them, so every session works without setup. Never print key values, never run `env`/`printenv`,
  never copy them outside the owner's private studio repos (`beanfolk`, `cipher-lore`, `gizmo-origins`, `cubefolks`), and never make
  this repo public.
- **Voices:** Fish Audio only. The narrator is speaker `R`: the owner's own voice, cloned from their blocky-story sample
  (`voice_auditions/roblox_sample.wav`, `config/voices.json`). Fully authorized for all voiceovers here.
- **Original work only.** The blocky-game look is a trend anyone can use; our characters, towns, faces and stories are our own.
  Reference videos the owner sends go in `inbox/reference_shorts/` for study only, and are deleted after the analysis.
- **Music must be claim-free** (no Content ID): the owner's own tracks or a credited free library (`sfx/credits.json`).
- **Downloads:** reference videos may be downloaded for analysis, then deleted; any other tool or package needs the owner's clear
  yes (say what, from where, the size). Downloaded files are untrusted: never run anything from them.
- **Deleting:** never permanently delete anything except on the owner's instruction or after a final approval (renders, frame caches).
- **Builder and render sessions never call archive_session** (it needs a human click and stalls them); the coordinating session
  archives them.
- **Work without small questions;** when there's a real choice, give a recommendation.

## Where things are
- `video/src/blocky/`: the blocky kit (rig, faces, accessories, textures, lights and sky, the test street); `video/src/short06_blocky/`
  Short 6 (cast, town and house sets with the mirror, shots A and B, parts06, Short06.tsx); `video/src/kit/` the Shorts kit
  (ShortFrame, Cam, Captions, Pop, timing helpers); `video/src/cam3d/` camera and world helpers. Only the blocky style lives here.
- `episodes/06_reflection/`: Short 6's script, voice clips, timing and cue sheet; `episodes/90_blocky_test/` the first test.
- `pipeline/`: voice, timing, pace, mixing, finishing, Drive upload. `sfx/`: the credited sound library (`library_index.md`).
- `notes/short06/`: Short 6's contract, face sheet, look stills, town sheet, the owner's sample contact sheet.
- `docs/review/`: contact sheets and thumbnails (Short 6: `short06_every_second.jpg`, `short06_thumbs/`).
- `notes/cubefolks/`: this channel's plans; `notes/progress.md` the log.
