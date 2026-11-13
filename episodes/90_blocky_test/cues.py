"""Blocky style test (episodes/90_blocky_test): the sound cue sheet. Every time comes from measured data: words.json
(lead-free word times, plus the episode's lead from episode.json) and timeline_chunks.json (the beats in master seconds).
Effects:  python3 -I episodes/90_blocky_test/sfx_blocky.py
Mix:      python3 -I pipeline/mix.py episodes/90_blocky_test/cues.py episodes/90_blocky_test/mix.wav
Level:    python3 -I pipeline/music_level.py episodes/90_blocky_test/cues.py -15
"""
import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
LEAD = json.load(open(HERE / "episode.json"))["voice"]["lead"]
TAIL = json.load(open(HERE / "episode.json"))["voice"]["tail"]
WORDS = json.load(open(HERE / "words.json"))
CH = json.load(open(HERE / "timeline_chunks.json"))
G = lambda n: str(HERE / "sfx_blocky" / f"{n}.wav")   # our synthesised effects
S = lambda n: str(ROOT / "sfx" / f"{n}.mp3")          # the credited one-offs in sfx/

def at(beat, word, k=0, end=False):
    """Master time of the k-th `word` (case/punctuation-free) inside beat `beat` (1-based)."""
    c0, c1 = CH[beat - 1]["start"] - LEAD, CH[beat - 1]["end"] - LEAD
    hits = [w for w in WORDS if c0 - 0.02 <= w["start"] <= c1 + 0.02 and w["word"].strip(".,!?").lower() == word.lower()]
    return hits[k]["end" if end else "start"] + LEAD

VOICE = str(HERE / "master_voiceover.wav")
LENGTH = CH[-1]["end"] + TAIL
MUSIC_DUCK_DB = 6
SFX_MAX = 4.0

DAY0, DAY1 = 0.0, CH[2]["start"]           # beats 1-2: the street by day
NIGHT0, NIGHT1 = CH[2]["start"], LENGTH    # beat 3: night

BEDS = [
    ("amb_city_street_03", DAY0, DAY1, -32, 0.0, 0.15),
    (S("street_birds"), DAY0, DAY1, -27, 0.0, 0.15),
    ("amb_wind_soft_01", DAY0, DAY1, -38, 0.0, 0.15),
    (G("crickets"), NIGHT0, NIGHT1, -26, 0.12, 0.4),
    ("amb_room_tone_02", NIGHT0, NIGHT1, -32, 0.12, 0.4),
    # a low drone rising under beat 3 (a second, louder layer fades in from "tonight" to the knocks)
    ("drone_tension_02", NIGHT0, NIGHT1, -30, 0.3, 0.4),
    ("drone_tension_04", at(3, "tonight"), NIGHT1, -24, at(3, "knocked") - at(3, "tonight"), 0.4),
]

# music: the owner's own track "Tiptoe Across the Floorboards" (sfx/music, credits.json), 15 dB under the voice (measured)
MUSIC = str(ROOT / "sfx" / "music" / "tiptoe_across_the_floorboards.mp3")
MUSIC_REL = -6.2
BEDS += [(MUSIC, 0.0, LENGTH, MUSIC_REL, 0.0, 0.4, "music")]

SFX = []
# a soft whoosh into each beat change, peaking on the beat's first word
for b in (2, 3):
    SFX.append((G("whoosh_soft"), CH[b - 1]["start"] - 0.25, -16, 0.45))
# a single dog bark, far away, in the gap after "family ... it."
SFX.append(("dog_bark_01", at(1, "it", end=True), -30, 1.0))
# three slow heavy knocks starting on "knocked", spaced by the measured word gaps "knocked" -> "on" -> "door"
k0 = at(3, "knocked")
step = (at(3, "door") - k0) / 2 + 0.12
for i in range(3):
    SFX.append((G("knock"), k0 + i * step, -8 if i < 2 else -6, 0.6))
# integrator: whooshes on the two whip-pans inside beats (BlockTest cuts at "has" and "one"), same shape as the beat whooshes
for b, w in ((1, "has"), (3, "one")):
    SFX.append((G("whoosh_soft"), at(b, w) - 0.25, -18, 0.45))
