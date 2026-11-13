# The voiceover: always the owner's voice, from Fish Audio

Every Short is narrated in the owner's voice. Fish Audio only (no ElevenLabs). The narrator voice is the owner's voice from their channel Celyxi (`voice_auditions/owner.wav`).

## 1. Find or make the voice (once)
- **The owner's narrator voice (active):** Speaker `N` in `config/voices.json` is set to clone on the fly from `voice_auditions/owner.wav` (with `reference_text` for high fidelity). This is the owner's voice and is active for all production videos.
- **A voice the owner already has on Fish:** list the account's own voices with `GET https://api.fish.audio/model?self=true&page_size=100`
  (header `Authorization: Bearer $BEAN_FISH_API_KEY`). Show the owner the titles, never the ids or the key; use the one they name.
- **From a sample URL the owner gives:** download it into its own empty folder (their link is their OK for that download; run nothing
  from it), convert it to 15-40 s of clean 44.1 kHz mono WAV (`ffmpeg -i in -ac 1 -ar 44100 -t 40 voice_auditions/owner.wav`), then:
  - make a reusable voice: `POST https://api.fish.audio/model` (multipart: `type=tts`, `train_mode=fast`, `title=Beanfolk narrator`,
    `visibility=private`, `voices=@voice_auditions/owner.wav`); the returned `_id` is the `voice_id`; or
  - clone on the fly (no model slot needed): keep the WAV and use a `reference_audio` voice entry; `fish_cast.py` sends the sample
    with every request.
  Only the owner's own voice, or a voice whose owner gave written consent. If an endpoint errors, check Fish's current API docs.
- Save it in `config/voices.json` (copy `config/voices.example.json`): speaker `N` is the narrator. Commit it (never the key).

## 2. Voice a Short
- `episodes/<ep>/script.txt`: one beat per paragraph (usually one sentence). `speakers.json`: `["N", "N", ...]`, one per beat.
  Optional `tts_text.json` (`{"7": "[excited] ..."}`): delivery tags for Fish only; the script stays clean for alignment.
  Optional `tts_speed.json` (`{"5": 1.1}`): re-voice a slow beat faster (merged into `prosody.speed`). Spell numbers out in the
  tag text only (`"In nineteen oh four"`) so captions keep "1904". Check length and pace with `python3 -I pipeline/pace.py episodes/<ep>`.
- `python3 pipeline/fish_cast.py episodes/<ep>`: one request per beat to `POST https://api.fish.audio/v1/tts` (JSON with
  `reference_id`, or a msgpack body with `references` for on-the-fly cloning; the model is chosen by the `model` header,
  `s2.1-pro-free` by default). Clips land in `audio/para_001.mp3`...; **existing clips are kept** (delete one to re-voice that beat),
  so edits cost only the changed lines. If lines are inserted later, renumber the old clips by matching their text.
- `python3 pipeline/assemble_cast.py episodes/<ep>`: trims each clip, levels it to the narrator, applies `gain_db`, places beats with the
  lead, gaps and tail from `episode.json` (`voice.lead`, `voice.gaps`, `voice.tail`, `voice.level_match_db`). For Shorts use a lead of
  about 0.05 s and gaps of about 0.12-0.2 s: the references run at 187-225 words a minute.

## 3. Timing
`python3 pipeline/whisper_words.py episodes/<ep>` → `python3 pipeline/align_cast.py episodes/<ep>` (`words.json`, the script's words with
measured times) → the Short's timing build. Captions, cuts, expressions and sounds all read these times. If a gap changes late,
shift the later word times by the change instead of re-running Whisper (re-measuring moves every word slightly).

## 4. Loud, emotional delivery (Fish Audio docs, read 2026-11-09)
Sources: https://docs.fish.audio/developer-guide/core-features/emotions, https://docs.fish.audio/api-reference/endpoint/openapi-v1/text-to-speech,
https://docs.fish.audio/developer-guide/models-pricing/models-overview.
- **Tags (S2 family: `s2.1-pro`, `s2.1-pro-free`, `s2-pro`) are free-form words in square brackets**, best at the start of a sentence:
  `[excited] He begged the judge to let him stay!`, `[very excited]`, `[shouting]`, `[in a hurry tone]`, `[emphasis] really`, `[whispering]`,
  `[surprised]`, `[sarcastic]`, `[scared]`, `[laughing] Ha ha`, `[sighing]`, `[gasping]`, `[break]`. Parentheses `(happy)` are the old S1 syntax: don't use.
  One main emotion per sentence, at most 3 tags per sentence, don't tag every line.
  Put tags in `episodes/<ep>/tts_text.json` (`{"7": "[shocked] ..."}`) so `script.txt` stays clean for the word alignment.
- **Body fields that change delivery:** `prosody: {speed (0.5-2.0, default 1), volume (dB, default 0), normalize_loudness (default true)}`,
  `temperature` (0-1, default 0.7: higher = more varied, livelier), `top_p` (default 0.7). Set per voice in `config/voices.json`
  (`prosody`, `temperature`, `top_p`); `fish_cast.py` passes them through.
- **Models** (`model` header): `s2.1-pro` (recommended production), `s2.1-pro-free` (same model, free under fair use, no latency guarantee),
  `s2-pro`, `drama-3` (directed in plain language: not tried yet), `s1` (deprecated). Unknown header falls back to s2.1-pro.
- **Reference audio for cloning:** 10-30 s of clean single-speaker speech, no music, no reverb, with its exact transcript in `text`.
- **Our recipe for the Shorts narrator:** an energetic recording as the reference (the clone copies its energy), `temperature` about 0.8,
  `speed` 1.0-1.1 (then tighten gaps in assembly), a tag on the hook (`[excited]`/`[shocked]`), the reveal (`[curious]` or `[emphasis]`) and the
  payoff (`[amused]`/`[sarcastic]`), shouts and whispers only on in-character lines. Loudness is fixed in finishing (-14 LUFS), not with `volume`.
