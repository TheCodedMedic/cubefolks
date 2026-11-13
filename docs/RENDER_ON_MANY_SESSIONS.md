# Rendering fast on several sessions (each part on its OWN branch)

A Short is about 2,000 frames. **The owner wants every Short split across 10-20 sessions** (Short 1: 14 parts, about 10 minutes wall
time, every part on its own branch), so always split, like this.

0. **Freeze the source:** commit and push everything the render needs; note the commit hash and the composition id.
1. **Split** into 10-20 parts: total frames from `npx remotion compositions src/index.ts`; N parts of `floor(total/N)` frames, the last part runs to
   `total-1`. Write the table in `notes/<short>_render.md`.
2. **One session per part** with the claude-code-remote `create_session` tool (never the Agent tool: agents share your container and
   branch). Pass `source_url` (this repo), `source_revision` = **the frozen commit**, a title, and this prompt with the numbers filled in:
   > You render ONE part. Do not edit code. `git fetch origin <commit> && git checkout -B part-kk <commit>`; `cd video`; render
   > `npx remotion render src/index.ts <Comp> out/part.mp4 --frames=<start>-<end> --concurrency=2 --timeout=240000 --crf=18`
   > (in two halves joined with `ffmpeg -f concat -c copy` if it could take over 50 minutes); check the frame count with
   > `ffprobe -v error -count_packets -select_streams v -show_entries stream=nb_read_packets -of csv=p=0 out/part.mp4` equals
   > end-start+1; copy it to `parts/<short>_kk.mp4`, `git add -f` that one file, commit, and `git push -u origin HEAD:claude/<short>-partkk`
   > (that branch only). Reply to the coordinator with `send_message`: "done: part kk, N frames, branch ...".
3. **Collect** without checking out the branches:
   `git fetch -q origin claude/<short>-partkk && git show FETCH_HEAD:parts/<short>_kk.mp4 > video/out/p_kk.mp4`, and check each count.
4. **Check:** a contact sheet of the first, middle and last frame of every part, and a brightness scan of every frame for black runs
   (`ffmpeg -i x.mp4 -vf "scale=320:-1,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null -`, flag 6+ frames in a
   row with YAVG < 12). Sampled frames miss short glitches (a camera inside a wall for half a second).
5. **Join:** remux every part with `-c copy -video_track_timescale 90000` first (parts that skipped re-encoding keep a different
   timebase), then `ffmpeg -f concat -safe 0 -i list.txt -c copy`. Check the total frame count.
6. **Clean up:** archive the render sessions once their parts are collected; leave the branches.
