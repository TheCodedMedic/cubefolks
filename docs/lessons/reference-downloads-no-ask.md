---
name: reference-downloads-no-ask
description: "User (2026-10-22): download reference videos for analysis without asking first; still keep them in source/ and delete after the study"
metadata:
  node_type: memory
  type: feedback
  originSessionId: aedc497c-b939-484f-acd1-44568a738f16
  modified: 2026-10-22T19:18:46.100Z
---

When the user sends a reference video link to study, download it (yt-dlp into `source/`) and analyse it straight away; do not ask permission first (the user said "you don't essentially need to ask me first"). This relaxes the CLAUDE.md "ask before downloading" rule for reference videos only; installs and other downloads still follow the normal rule unless the user says otherwise.

**Why:** asking slowed the user down; they had already approved the same kind of download before.

**How to apply:** download -> analyse (cuts, motion, captions, hook, sound, transcript) -> keep only numbers and notes in `knowledge/craft/` -> delete the video and frames. Never reuse frames, audio or scripts. Related: [[shorts-retention-feedback]].
