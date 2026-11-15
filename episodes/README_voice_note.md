# Voice note for Shorts 07-10 (2026-11-15)
Clips in `audio_raw/` are the untouched Fish Audio takes. `audio/` holds the same takes with internal pauses capped at ~0.2 s
and a 10% pitch-preserving speed-up (`ffmpeg silenceremove ... stop_silence=0.16, atempo=1.1`), to reach the sample's pace
(~4.0-4.4 words/s, masters 37-43 s). `assemble_cast.py` reads `audio/`. To re-voice a beat: replace its file in `audio_raw/`,
re-run that ffmpeg line for it into `audio/`, then assemble, whisper, align and build_timing again.
