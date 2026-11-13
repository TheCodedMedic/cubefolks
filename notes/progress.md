# Progress log

- 2026-11-08 Step 0 done: the session hook, the smoke test, the lock file.
- 2026-11-08 Step 0b done: narrator N = the owner's own voice (from their channel Celyxi), cloned on the fly from a 29.8 s cut of their audio (`voice_auditions/owner.wav`). Active, verified and authorized for all videos.
- 2026-11-09 **Step 1 APPROVED by the owner**: cast sheet v1 (`docs/review/cast_sheet_v1.jpg`; the 8 beans in `video/src/bean/Bean3D.tsx`).
- 2026-11-09 Step 2 (face animation) and Step 3 (the Shorts kit): in progress.
- 2026-11-09 Short 1 "Clever Hans" (`episodes/01_clever_hans/`): script, voice (22 beats, 223 words, 67.0 s), words.json. The owner asked for it to be built in BOTH styles, each by its own session on its own branch: Beanfolk 3D (`claude/short01-bean`) and Inkfolk (`claude/short01-ink`), each rendering on 10-20 part sessions.
- 2026-11-09 Short 1 "Clever Hans", Beanfolk 3D: built (52 word-anchored set-ups, `video/src/short01_bean/`), rendered on 14 sessions, mixed (`episodes/01_clever_hans/cues_bean.py`), finished and uploaded. **Waiting for the owner's approval (first finished Short).**
- 2026-11-09 Short 1 shipped by the owner in the Beanfolk 3D style (v4: their music track 15 dB under the voice, real reactions). Picture notes kept as lessons in docs/lessons/short01-owner-notes.md.
- 2026-11-09 Short 2 "The City That Paid for Rat Tails" (episodes/02_rat_bounty): script, voice (23 beats, 223 words, 64.0 s, 3.49 w/s), words.json; built on its own session (claude/short02-bean), brief notes/short02_brief_bean.md.
- 2026-11-11 Studio switched to Gizmo Origins Shorts (CLAUDE.md, notes/ideas.md). Short 3 Microwave (64.9 s) and Short 4 Pacemaker (61.4 s): scripts, voice, timing; built in parallel on claude/short03-microwave and claude/short04-pacemaker. The owner is away and asked for both finished; Claude makes every call.
- 2026-11-11 Shorts 3 (microwave, v2 after fixing overlapping POP!s and a small piano/oven shot; Drive 1upnJYc_rBm_0wTWk2kBkgvbtqDLgXziA) and 4 (pacemaker; Drive 16xohROQjD_d3VIrldMKy2Aa291Kv0s_l) finished and sent to the owner.
- 2026-11-11 Owner: Shorts can be any length the story needs (about 20-60 s); a tight 30 s Short is fine. Rules, playbook, ChatGPT prompt and pace.py updated (both studios).
- 2026-11-09 Short 2 "The City That Paid for Rat Tails", Beanfolk 3D: built (54 word-anchored set-ups, `video/src/short02_bean/`), rendered on 14 sessions, mixed (music -15 dB), finished (64.6 s, -14.2 LUFS) and uploaded (https://drive.google.com/open?id=1DDMT1aOObaJscYSb93YWf6-FWACvO59P). Waiting for the owner.

## 2026-11-13: Cubefolks studio set up
Copied from TheCodedMedic/beanfolk (claude/s06-integrate @ fb4974a): engine, blocky kit, Short 6 and the earlier Shorts as examples, pipeline, sound library, lessons. Keys not copied yet (awaiting the owner). Narrator R is the default speaker; Drive uploads go to Cubefolks/Shorts. Next: notes/cubefolks/FIRST_TASKS.md.
