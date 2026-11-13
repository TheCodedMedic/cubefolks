# Builder brief template (one build session per Short and style)

Commit the filled brief to `notes/<short>_brief_<style>.md`, then start the build with `create_session`: `source_url` this repo,
`source_revision` the branch with the frozen audio, `outcome_branch` `claude/<short>-<style>`, and a short prompt: "Your full brief is in
notes/<short>_brief_<style>.md. Read it, then CLAUDE.md and docs/PRODUCTION_PLAYBOOK.md, and do the whole job. Message the coordinator
session <your session id> when done." (Find your own session id with `get_session`.)

---

You are building **<Short N>, "<title>"**, from finished audio to a finished, uploaded video, in the **<style>** style.

## Start
- Work on your own branch `<branch>`; push only there (`git push -u origin <branch>`). Commit and push often. No pull request.
- Read `CLAUDE.md`, `docs/PRODUCTION_PLAYBOOK.md` and the docs they list. Style reference: <sheet path, kit files>.

## Inputs (frozen: do NOT rewrite the script or re-voice)
`episodes/<ep>/`: `script.txt`, mp3 clips, `words.json`, `timeline_chunks.json`. Rebuild the WAV with
`python3 pipeline/assemble_cast.py episodes/<ep>` (expect <length> s). The story, beat by beat: <summary with the hook, clues,
"Meanwhile", the "You see" mechanism, the payoff and the loop line>.

## Picture
- Code in `video/src/<short>_<style>/`, composition `<Comp>` (1080x1920, 30 fps). Style-specific code stays in your folder.
- Cast: <characters, with looks>. Sets: <places, dense with readable detail>. The "You see" reveal: <how it is shown>.
- 45-55 set-ups, every camera moving, whips, expressive faces on words, acting characters.
- Pop-ins on words: <list>. Captions one or two words at a time from `words.json`, highlight colours on key words.
- Everything anchored with `at(beat, "word")`. Never type seconds.
- Review before rendering (playbook step 5, all the owner's notes).

## Render: split across 10-20 sessions (playbook step 6, `docs/RENDER_ON_MANY_SESSIONS.md`)

## Sound (playbook step 7)
`episodes/<ep>/cues_<style>.py`: whooshes, pops, <story-specific effects>, real reactions on the right beats (<laughs, cheers, gasps,
animal voices, stings, where>), ambience per place, music 15 dB under the voice, measured with `pipeline/music_level.py`.

## Finish and deliver (playbook step 8)
`exports/<short>_<style>.mp4`, upload to Drive, `git add -f` the export and push, then `send_message` to the coordinator with: the Drive
link, the branch, the length and loudness, a contact-sheet path, and anything still weak. If this is the first finished Short, stop
there: it is the owner's approval gate.

Work without small questions; make the calls a good animation director would. If something blocks you, message the coordinator.
