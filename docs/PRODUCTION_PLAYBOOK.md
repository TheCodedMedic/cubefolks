# Production playbook: a 60-second animated Short, start to finish

How the owner's studios actually make a Short, written from the first one (Short 1 "Clever Hans", 2026-11-09, made in both the 3D
bean style and the Inkfolk style). Follow it step by step. Every step names the command, the file and the check that proves it worked.
The owner reads results on a phone: send them files and Drive links, not paths.

---

## 0. Before anything
- The session-start hook installs node packages, Python packages, ffmpeg, the Whisper model and rclone, and loads the keys from
  `config/keys.env`. Its log should say `BEAN_FISH_API_KEY is available` and `Google Drive token is set`.
- Approval gates: a cast sheet before the first Short; the first finished Short; anything the owner asks to see first.

## 1. The story (script)
**Check the script and the first second against `knowledge/SHORTS_PLAYBOOK.md`** (hook checklist, story shape, re-hooks, loop ending, ChatGPT prompt).

The owner usually brings the script (often from ChatGPT with the template in `docs/PLAN.md`): keep their words. When they ask Claude to
write it, invent an **original, made-up** story by default (clever thieves, strange towns, odd jobs, schemes, twists; a true story only when
the owner asks or brings one; see the story rule in `CLAUDE.md`) and write it in
this shape, one sentence per beat, as long as the story needs (about 20-60 s; 75-220 words; see `knowledge/SHORTS_PLAYBOOK.md`):

1. **Hook as a strange fact** in sentence 1, 10-16 words ("In 1904, a horse in Berlin could do math better than most schoolchildren.").
2. Who, where, the stakes: concrete nouns a cartoon can show.
3. Doubt and escalation: people laugh, experts come, 2-4 clues the viewer can't solve.
4. **"Meanwhile,"** a parallel mystery or a second character noticing something.
5. **"You see,"** the reveal: the hidden mechanism, which must make sense inside the story's own world, with at least two clues planted
   before it. (Only a true story needs its facts accurate.)
6. A one-line payoff that lands the point as a **complete sentence** ("He was a genius at reading people.").
7. **The loop:** a last line that runs straight into line 1 ("And we were so easy to read that the whole world believed..." →
   "In 1904, a horse in Berlin could do math..."). The owner felt a bare hanging fragment sounded unfinished: give the story its ending
   first, then the loop line.

**From the analytics (`docs/lessons/analytics-retention-comments.md`):** the hook must be crazy (the most extreme claim in the story, flat as
fact); the reveal ends at about 80-85% of the runtime; after it, one payoff line and the loop line, 8 s at most; an on-screen question
pop-in in the last 3-4 s (never spoken); a pinned comment written with every title.

Short punchy sentences, no dialogue tags, no emojis. Specific invented names, places, times and numbers beat vague ones. Never invent
crimes or scandals for real, named people, and never present a made-up story as documented history.

**Files** in `episodes/<NN_slug>/`:
- `script.txt`: one beat per paragraph (beats separated by a **blank line**).
- `speakers.json`: `["N", "N", ...]`, one per beat.
- `episode.json`: `{"title": "...", "voice": {"lead": 0.05, "gap_default": 0.15, "tail": 0.6}}`.
- `tts_text.json` (optional, Fish only): `{"1": "[excited] ...", "16": "[emphasis] You see, ..."}`, keys are 1-based beats. Tag the hook,
  the turn, the reveal and the payoff; at most one main emotion per sentence; never tag every line. Whispers and shouts only on lines a
  character says. **Spell out numbers the way they should be read** in the tag text only ("In nineteen oh four"); `script.txt` keeps
  "1904" so captions show it.
- `tts_speed.json` (optional): `{"5": 1.1}` re-voices a beat faster (merged into Fish `prosody.speed`).

## 2. The voice
```
python3 pipeline/fish_cast.py episodes/<ep>
python3 pipeline/assemble_cast.py episodes/<ep>
```
- One Fish request per beat, narrator `N` cloned on the fly from the voice sample in `config/voices.json`. Clips land in `audio/para_NNN.mp3`.
- **Existing clips are kept:** to re-voice a beat, delete its clip and run `fish_cast.py` again. Only changed lines cost credits.
- **Cutting or inserting beats:** renumber the existing clips to the new beat numbers (by text) instead of re-voicing everything, and
  renumber the keys of `tts_text.json` / `tts_speed.json` to match.
- WAV files are git-ignored: a new session rebuilds `master_voiceover.wav` with `assemble_cast.py` from the committed mp3 clips.

## 3. Timing, length and pace
```
python3 pipeline/whisper_words.py episodes/<ep>
python3 pipeline/align_cast.py episodes/<ep>
python3 -I pipeline/pace.py episodes/<ep>
```
- `align_cast.py` prints what Whisper heard differently. Spelling-only differences ("Oskar" → "oscar", "Hans" → "hands", a compound split
  in two) are fine: the words still get times. A garbled beat is re-voiced.
- **Length: whatever the story needs (about 20-60 s), at about 3.5-4.1 words a second.** A 30 s Short is fine if it holds people. If it is longer than the story deserves, or slow (Short 1 first came out 75 s at 3.2 w/s):
  1. cut beats that don't move the story (we cut two: about 5 s);
  2. re-voice the slowest lines at speed 1.1 with `tts_speed.json` (`pace.py` lists them; leave deliberate pauses like "Nothing." alone);
  3. tighten gaps only last (0.15 s is already short).
- **Never type a time in seconds** anywhere after this: every cut, expression, caption, pop and sound anchors to measured words.

## 4. The picture (build on its own session)
Start the build in a **separate cloud session** with `create_session` (repo URL, the branch with the frozen audio, an
`outcome_branch` such as `claude/short02-<style>`), and a written brief committed to the repo first: `docs/templates/builder_brief.md`
is the template (story, cast, sets, pop-ins, sound, render and delivery). The coordinating session stays free to talk to the owner.
Two styles can be built in parallel on two sessions, each on its own branch, never touching the other's branch.

What the build delivers:
- Code in `video/src/<short>/`, a composition per Short, on the kit (`video/src/kit/`: Short, Captions, Pop, Whip, Cutaway).
- 45-55 set-ups, a new picture every 1-1.5 s, **every camera moving**, mostly whip transitions, faces that change on the words,
  characters that act, feet on the ground.
- Pop-ins on key words (counters, stamps, X and ✓, big words like "GENIUS"), captions one or two words at a time with highlight colours.
- An original design for any new character (an animal included), checked from front, three-quarter and side **before** building shots,
  with the approved proportions (big head, short neck: the first horse read like a giraffe).

## 5. Review before rendering
Stills of every shot, a contact sheet of every second, and a 60-frame sequence of the busiest part. Check (`docs/lessons/short01-owner-notes.md`):
- nothing too close to the lens (look at the **corners** of the first, middle and last frame of every moving shot: a wall in front of
  the lens gave a black slab at 0:10);
- no back of a head filling the frame (a foreground head only as a sliver at the edge; always a face);
- faces bright in dark grades (a face fill light in night and violet grades; every skin tone readable);
- no blurry foreground opening a shot;
- clipping, facing, framing, black frames, captions.
- **frame 0 already tells the hook** (vidIQ flagged a slow first 1.5 s): the hook pop-in fully on screen, the character mid-reaction,
  the camera moving, no slow lead-in.
Fix, then review again. (Frame 0 must already tell the hook.) The owner shipped Short 1 with these flaws but said: don't make them again.

## 6. Rendering: always split across 10-20 sessions
Follow `docs/RENDER_ON_MANY_SESSIONS.md`: freeze the source (commit, push, note the hash), split the frames into 10-20 parts (Short 1:
14 parts of about 145 frames, about 10 minutes wall time), one `create_session` per part, each part pushing to its **own branch**
`claude/<short>-partKK`; collect, check every part's frame count and black runs, join with `-c copy`, check the total, archive the
part sessions.

## 7. Sound
A cue sheet per Short (`episodes/<ep>/cues_<style>.py`), every time read from the picture's own word-anchored timing:
- a whoosh on every whip, a pop on every pop-in, synthesised effects the library lacks (`sfx_<style>.py`, e.g. hoof taps);
- **real reactions on the beats that call for them** (`sfx/library/`, see `library_index.md`): a laugh on a joke, applause and a cheer on a
  win, a game-show buzz on a wrong answer, a gasp on a shock, the animal's real voice when it appears, a ba-dum-tss on a punchline,
  camera flashes for "the whole world";
- ambience under every place (street, room, crowd), quieter in the reveal;
- **music 15 dB under the voice, measured** (the owner's level; the first mix at 29 dB under was inaudible on a phone):
  `python3 -I pipeline/music_level.py episodes/<ep>/cues_<style>.py -15` prints the level and the rel_db change to make.
- Music is claim-free: the owner's own track (they generate it from prompts, `docs/templates/music_prompts.md`; store it in `sfx/music/`
  and credit it in `sfx/credits.json`), or a credited library pad.

```
python3 -I pipeline/mix.py episodes/<ep>/cues_<style>.py episodes/<ep>/mix_<style>.wav
```
**A sound change never needs a re-render:** `finish.py` takes only the picture from its first input, so remix and re-finish onto the
existing export.

## 8. Finish, upload, deliver
```
python3 pipeline/finish.py <picture.mp4> episodes/<ep>/mix_<style>.wav exports/<name>.mp4     # -14 LUFS, -1.5 dBTP
bash pipeline/upload_drive.sh exports/<name>.mp4                                              # prints the Drive link
```
Check the length (picture and audio equal), the loudness, and look at a contact sheet of the finished file. Send the owner the file
(SendUserFile) and the Drive link, with what's in it and what is still weak, honestly. Version names `_v2`, `_v3` for each change.

## 9. Thumbnail, title, hashtags
- **Thumbnail frames without captions:** add a `<Short>Clean` composition (the same `ShortFrame` without `T`, so no captions; pop-ins
  stay) and render stills: `npx remotion still src/index.ts <Short>Clean out/t.png --frame=<n>`. Pick from a timestamped contact sheet
  (`ffmpeg ... fps=2, drawtext pts, tile`); skip frames mid-whip and frames just before a pop lands. Best: a big expressive face (shock
  or smugness) on a clean background with room for title text, or the payoff word ("GENIUS"). Send the owner 4-5, best first.
- **Titles** spark curiosity and never give away the twist: "This Horse Fooled 13 Scientists", "The Horse That Could Do Math".
  Hook in the first 40 characters.
- **Pinned comment:** an open, light question from the viewer's own life, posted and pinned with every upload.
- **Hashtags:** 3-5: `#shorts #history #animation` plus one or two for the topic (`#psychology #didyouknow`).
- **Channel description** (general, not about one episode): short, promises good stories.

## 10. Keep learning
After the owner's notes, write them into `docs/lessons/` and the review step in `CLAUDE.md`, so the next Short doesn't repeat them.
Log progress in `notes/progress.md`.
