"""Short 07 "The Truck With No Speaker": synthesised sound -> sfx_gen/*.wav (48 kHz stereo, pure numpy, committed).

THE JINGLE is the story. It is OUR OWN melody (written here, no real ice cream truck tune): a bouncy 2-bar phrase of eighth
notes in C, 0.19 s a note (16 notes = 3.04 s), and note 6 of EVERY bar is the same WRONG NOTE: an A-flat that warbles flat
(it should be an A or a G). The picture shares the same grid (video/src/short07_truck/common.tsx: JINGLE_NOTE, WRONG_IN_BAR,
HUM_T0, TOBY_T0, MOM_T0, BLAST_T0; ShotsStreet.tsx: JINGLE_T0, JINGLE_LOOP_T0), so glows, jolts and the teacher's head
tilt land on the notes. Every cue file is rendered here at the exact phrase position it starts on (times from the words in
timing.json, never typed seconds), so cues.py only places it.

Versions: truck (a tinny pulse-wave speaker with a glockenspiel, street reverb), toby (a muffled little music box, as if
inside him), hum (the teacher humming it, same wrong note, the pitch sagging), closer (the truck song coming up the stairs:
muffled through walls, opening up and getting louder, then dry and close: it is Mom), blast (the full song, bells and all:
louder, distorted, glockenspiel on every note, big bells on each bar, sleigh bells), cone (the spare cone humming it, tiny).
Effects: engine idle + engine dying (sputter, clunk), brake squeak, headlight click, bin lid, chalk, pencils, mouth click,
cone hum. Music: music_box_bed: OUR OWN slow creepy music-box bed (the jingle's melody at half speed over a C-minor pad, the
wrong note kept), 32 s loop, claim-free (synthesised here, no samples).
Usage: python3 -I episodes/07_icecream_truck/sfx07.py
"""
import json
import pathlib
import re
import subprocess

import numpy as np

SR = 48000
HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
OUT = HERE / "sfx_gen"
rng = np.random.default_rng(7)
TM = json.load(open(ROOT / "video" / "src" / "short07_truck" / "timing.json"))
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())


def at(b, w, n=1):
    return [x["s"] for x in TM["words"] if x["b"] == b and norm(x["w"]) == norm(w)][n - 1]


PS = lambda b: TM["beats"][b - 1]["s"]
END = TM["end"]
t_ = lambda s: np.arange(int(round(s * SR))) / SR

# ---- the grid (must match common.tsx / ShotsStreet.tsx)
NOTE = 0.19
WRONG_IN_BAR = 5
PHRASE = 16 * NOTE
JINGLE_T0 = -0.4
HUM_T0 = at(10, "wrong") - (WRONG_IN_BAR + 8) * NOTE
TOBY_T0 = at(6, "walked")
MOM_T0 = at(13, "Mom")
BLAST_T0 = at(17, "whole")
JINGLE_LOOP_T0 = END + JINGLE_T0 - PHRASE
# the melody (MIDI), 2 bars; index 5 and 13 are the wrong note (A-flat 5 = 80, warbling flat)
MEL = [72, 76, 79, 76, 77, 80, 79, 76, 74, 77, 81, 77, 76, 80, 79, 72]
WRONG = {5, 13}
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc):
    k = max(1, int(SR / (2 * np.pi * fc))); w = np.ones(k) / k
    return np.convolve(np.convolve(x, w, "same"), w, "same")


def hp(x, fc): return x - lp(x, fc)
def bp(x, lo, hi): return lp(x, hi) - lp(x, lo)
def noise(s): return rng.standard_normal(int(round(s * SR)))


def fade(x, a, b):
    na, nb = int(a * SR), int(b * SR)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x


def reverb(x, secs=1.2, mix=0.22, seed=3):
    r = np.random.default_rng(seed); m = int(secs * SR)
    ir = r.standard_normal(m) * np.exp(-np.linspace(0, 7, m)); ir = lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum()) * 3
    L = len(x) + m
    y = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L))[: len(x)]
    return x * (1 - mix) + y * mix


def save(name, x, width=0.9, right=None, peak=0.9):
    r = x * width if right is None else right
    m = max(np.abs(x).max(), np.abs(r).max()) + 1e-9
    st = np.stack([x / m * peak, r / m * peak], 1).astype(np.float32)
    OUT.mkdir(exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(OUT / f"{name}.wav")],
                   input=st.tobytes(), check=True)
    print(f"  {name}.wav  {len(x) / SR:.2f} s")


def osc(freq, kind="sine", duty=0.25):
    ph = np.cumsum(freq) / SR
    if kind == "sine": return np.sin(2 * np.pi * ph)
    if kind == "pulse": return np.where((ph % 1) < duty, 1.0, -1.0) * 0.8 + np.sin(2 * np.pi * ph) * 0.2
    if kind == "tri": return 2 * np.abs(2 * (ph % 1) - 1) - 1
    raise ValueError(kind)


def bell(f, s, decay=2.2, bright=1.0):
    t = t_(s)
    x = (np.sin(2 * np.pi * f * t) + 0.5 * bright * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4)
         + 0.3 * bright * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9) + 0.15 * np.sin(2 * np.pi * f * 8.9 * t) * np.exp(-t * 16))
    return x * np.exp(-t * decay) * np.minimum(1, t / 0.002)


def place(dst, src, t0, a=1.0):
    i = int(round(t0 * SR)); j0 = max(0, -i); i = max(0, i); n = min(len(src) - j0, len(dst) - i)
    if n > 0: dst[i:i + n] += src[j0:j0 + n] * a


def melody_track(secs, start, style, tempo=1.0):
    """Note frequency (Hz, per sample), gate (0/1 per note, with a small gap), onset times and note indices, for a file
    that starts `start` seconds into the phrase grid (start may be any number: it wraps)."""
    n = int(round(secs * SR)); tt = start + np.arange(n) / SR
    note_len = NOTE / tempo
    k = np.floor(tt / note_len).astype(int); idx = k % 16
    f = np.array([hz(m) for m in MEL])[idx]
    within = tt / note_len - k
    wrong = np.isin(idx, list(WRONG))
    # the wrong note warbles: starts a touch sharp of A-flat, sags flat, wobbles (the "horn wobble")
    sag = np.where(wrong, 2 ** ((0.25 - 0.9 * within + 0.18 * np.sin(2 * np.pi * 9 * within)) / 12), 1.0)
    f = f * sag
    gate = (within < 0.86).astype(float)
    onsets = []
    k0 = int(np.ceil(start / note_len))
    while k0 * note_len - start < secs:
        onsets.append((k0 * note_len - start, k0 % 16)); k0 += 1
    return f, gate, onsets


def smooth_gate(g, ms=6):
    k = max(1, int(ms / 1000 * SR)); return np.convolve(g, np.ones(k) / k, "same")


def jingle_truck(secs, start, wet=0.28, glock=0.35):
    f, g, ons = melody_track(secs, start, "truck")
    flutter = 1 + 0.006 * np.sin(2 * np.pi * 0.7 * t_(secs)[: len(f)]) + 0.003 * np.sin(2 * np.pi * 6.1 * t_(secs)[: len(f)])
    x = osc(f * flutter, "pulse", 0.25) * smooth_gate(g) * 0.6 + osc(f * 2 * flutter, "sine") * smooth_gate(g) * 0.15
    x = np.tanh(bp(x, 650, 4200) * 2.2)                       # a small cheap speaker
    for t0, i in ons:                                          # glockenspiel an octave up, quieter
        place(x, bell(hz(MEL[i] + 12) * (0.985 if i in WRONG else 1.0), 0.6, 6.0, 0.6) * glock, t0)
    return reverb(x, 1.1, wet)


def jingle_toby(secs, start):
    f, g, ons = melody_track(secs, start, "toby")
    x = np.zeros(len(f))
    for t0, i in ons:
        place(x, bell(hz(MEL[i]) * (0.98 if i in WRONG else 1.0), 0.5, 7.0, 0.5), t0)
    x = lp(x, 1600) + 0.15 * osc(f, "tri") * smooth_gate(g)    # muffled, as if from inside him
    return reverb(lp(x, 2200), 0.7, 0.18)


def jingle_hum(secs, start):
    f, g, ons = melody_track(secs, start, "hum")
    fk = lp(f, 25) * 0.5                                        # an octave down, legato glides
    vib = 1 + 0.012 * np.sin(2 * np.pi * 5.2 * t_(secs)[: len(f)])
    ph = osc(fk * vib, "sine")
    x = ph + 0.45 * osc(fk * 2 * vib, "sine") + 0.2 * osc(fk * 3 * vib, "sine") + 0.08 * osc(fk * 4 * vib, "sine")
    x = lp(x, 900) * (0.75 + 0.25 * smooth_gate(g, 40))       # hummed: notes barely separate
    x += 0.04 * lp(hp(noise(secs)[: len(x)], 300), 1500)      # breath
    return reverb(x, 0.8, 0.12)


def jingle_blast(secs, start):
    f, g, ons = melody_track(secs, start, "blast")
    sg = smooth_gate(g)
    x = osc(f, "pulse", 0.3) * sg * 0.7 + osc(f / 2, "pulse", 0.5) * sg * 0.35 + osc(f * 2, "sine") * sg * 0.2
    x = np.tanh(bp(x, 180, 6500) * 3.2)                         # loud, a speaker pushed too hard
    for t0, i in ons:
        place(x, bell(hz(MEL[i] + 12), 0.9, 4.5, 1.0) * 0.6, t0)        # glockenspiel on every note
        if i in (0, 8):                                                  # big bells on each bar
            place(x, bell(hz(MEL[i] - 12), 2.4, 1.3, 0.9) * 0.9, t0)
            place(x, bell(hz(MEL[i] - 5), 2.0, 1.6, 0.9) * 0.5, t0)
        if i % 2 == 0:                                                   # sleigh bells
            nb = hp(noise(0.25), 5000) * np.exp(-t_(0.25) * 18)
            place(x, nb * 0.35, t0)
    return reverb(x, 1.4, 0.2)


def jingle_cone(secs, start):
    f, g, ons = melody_track(secs, start, "cone", tempo=0.5)
    x = np.zeros(len(f))
    for t0, i in ons:
        place(x, bell(hz(MEL[i] + 12) * (0.98 if i in WRONG else 1.0), 0.8, 4.0, 0.4), t0)
    x += 0.25 * osc(np.full(len(f), 220.0) * (1 + 0.01 * np.sin(2 * np.pi * 4 * t_(secs)[: len(f)])), "sine")
    return reverb(lp(x, 3000), 1.0, 0.3)


def cue(name, fn, t_start, t_end, grid_t0, fin=0.02, fout=0.25, env=None, **kw):
    """Render a cue file starting at master time t_start on the phrase grid that began at grid_t0."""
    x = fn(t_end - t_start, t_start - grid_t0, **kw)
    if env is not None: x = x * env(np.arange(len(x)) / SR + t_start)
    save(name, fade(x, fin, fout))


if __name__ == "__main__":
    print("Short 07 sound ->", OUT)
    P = lambda b: max(0.0, PS(b) - 0.08)
    # --- the jingle cues (start, end in master seconds; all from words)
    cue("j01_truck_hook", jingle_truck, 0.0, P(2) + 0.35, JINGLE_T0, fin=0.0, fout=0.35)
    cue("j03_truck_toby", jingle_truck, P(3) - 0.05, P(4) + 0.3, JINGLE_T0, fin=0.05, fout=0.3, wet=0.38)
    cue("j06_toby", jingle_toby, at(6, "walked") - 0.02, P(7) + 0.02, TOBY_T0, fin=0.05, fout=0.02)
    cue("j09_hum", jingle_hum, at(9, "hummed"), at(10, "hits.") + 0.35, HUM_T0, fin=0.08, fout=0.3)
    # b11-b15: the truck song from the street, through the walls and up the stairs, then from Mom; cut dead on "Then" (b16)
    t11, then16 = P(11), at(16, "Then")
    but, mom = at(12, "but"), at(13, "Mom")
    def closer_env(tt):
        # outside (b11) -> through the walls quieter and muffled from "but" -> rising -> close and loud from "Mom"
        lvl = np.interp(tt, [t11, but - 0.05, but + 0.1, mom - 0.1, mom + 0.15, then16], [0.9, 0.9, 0.35, 0.8, 1.0, 1.0])
        return lvl
    x = jingle_truck(then16 - t11, t11 - MOM_T0, wet=0.3)
    tt = np.arange(len(x)) / SR + t11
    # the walls: a lowpass that is shut from "but", opening toward "Mom", fully open after (block-filtered for speed)
    cutoff = np.interp(tt, [t11, but - 0.05, but + 0.1, mom - 0.2, mom + 0.1], [6000, 6000, 700, 2200, 9000])
    y = np.zeros_like(x); blk = SR // 50
    for i in range(0, len(x), blk):
        seg = x[max(0, i - 2000): i + blk]; fseg = lp(seg, float(cutoff[i])); y[i: i + blk] = fseg[-len(x[i: i + blk]):]
    save("j11_closer", fade(y * closer_env(tt), 0.08, 0.0))
    cue("j17_blast", jingle_blast, at(17, "whole") - 0.02, P(18) + 0.6, BLAST_T0, fin=0.0, fout=0.5)
    cue("j18_cone", jingle_cone, at(18, "held"), at(19, "its"), at(18, "held"), fin=0.3, fout=0.3)
    cue("j35_loop", jingle_truck, at(19, "its") - 0.08, END, JINGLE_LOOP_T0, fin=0.6, fout=0.0)
    # the jingle as one clean phrase (for listening/review)
    save("jingle_phrase", fade(jingle_truck(PHRASE * 2, 0.0), 0.0, 0.2))

    # --- effects
    s = 4.5; t = t_(s)   # engine idle: a low lumpy diesel rumble (looped by the mixer)
    rpm = 11 + 0.6 * np.sin(2 * np.pi * 0.3 * t)
    x = osc(np.full(len(t), 38.0), "pulse", 0.4) * 0.5 + osc(np.full(len(t), 76.0), "sine") * 0.3
    x = lp(x * (0.6 + 0.4 * np.abs(np.sin(np.pi * np.cumsum(rpm) / SR))), 420) + 0.15 * lp(noise(s), 300)
    save("engine_idle", fade(x, 0.05, 0.05))
    s = 1.6; t = t_(s)   # engine dying: the rumble drops, three sputters, a clunk
    f = np.interp(t, [0, 0.5, 1.0, s], [38, 30, 18, 10])
    x = lp(osc(f, "pulse", 0.4) * (0.6 + 0.4 * np.abs(np.sin(np.pi * np.cumsum(f / 3.2) / SR))), 380) * np.exp(-t * 2.2)
    for k, tk in enumerate([0.35, 0.62, 0.95]):
        place(x, lp(noise(0.09), 900) * np.exp(-t_(0.09) * 30) * (0.9 - 0.2 * k), tk)
    place(x, lp(noise(0.12), 600) * np.exp(-t_(0.12) * 40) * 1.2, 1.15)
    save("engine_off", fade(x, 0.0, 0.2))
    s = 0.7; t = t_(s); x = np.sin(2 * np.pi * np.cumsum(2300 + 180 * np.sin(2 * np.pi * 23 * t)) / SR) * np.exp(-t * 4) * np.minimum(1, t / 0.05)
    save("brake_squeak", fade(hp(x, 800) + 0.1 * hp(noise(s), 3000) * np.exp(-t * 6), 0.0, 0.1))
    s = 0.12; t = t_(s); save("click", hp(noise(s), 1500) * np.exp(-t * 90) + np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 60) * 0.5)
    s = 0.9; t = t_(s); x = np.zeros(len(t))   # bin lid: a tin clank and a rattle
    for fr, a in [(523, 1), (1187, 0.6), (1913, 0.4), (2873, 0.25)]: x += a * np.sin(2 * np.pi * fr * t) * np.exp(-t * 7)
    place(x, hp(noise(0.2), 2000) * np.exp(-t_(0.2) * 25) * 0.8, 0.0); place(x, x[: int(0.3 * SR)] * 0.35, 0.16)
    save("bin_lid", fade(x, 0.0, 0.15))
    s = 0.7; t = t_(s); x = bp(noise(s), 2500, 9000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 6 * t))) ; save("pencils", fade(x, 0.05, 0.15))
    s = 0.6; t = t_(s); x = bp(noise(s), 1800, 7000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 3.5 * t)))
    place(x, hp(noise(0.03), 2000) * 2, 0.0); save("chalk", fade(x, 0.0, 0.1))
    s = 0.25; t = t_(s); x = lp(noise(s), 2500) * np.exp(-t * 30) * 0.6 + np.sin(2 * np.pi * np.cumsum(np.linspace(900, 300, len(t))) / SR) * np.exp(-t * 25)
    save("mouth_click", fade(x, 0.0, 0.05))
    s = 2.0; t = t_(s)   # a soft riser into the blast: filtered noise swelling up + a rising tone
    x = bp(noise(s), 800, 6000) * (t / s) ** 2 + 0.3 * np.sin(2 * np.pi * np.cumsum(np.linspace(200, 900, len(t))) / SR) * (t / s) ** 3
    save("riser_in", fade(x, 0.2, 0.01))
    s = 3.0; t = t_(s)   # a low sub hit for the blast
    x = np.sin(2 * np.pi * np.cumsum(np.linspace(70, 30, len(t))) / SR) * np.exp(-t * 2.5) + lp(noise(s), 900) * np.exp(-t * 12)
    save("sub_hit", reverb(np.tanh(x * 1.6), 2.0, 0.3))
    s = 0.5; t = t_(s); save("step_soft", lp(noise(s), 500) * np.exp(-t * 18) + 0.4 * np.sin(2 * np.pi * 70 * t) * np.exp(-t * 20))
    s = 1.0; t = t_(s); save("slide_whoosh", fade(bp(noise(s), 300, 3000) * np.sin(np.pi * t / s) ** 2, 0.0, 0.1))
    # the wrong note alone, a little louder, for a tiny accent on "wrong" (it sits inside the hum)
    s = 0.6; t = t_(s); fw = hz(80) * 2 ** ((0.25 - 0.9 * t / NOTE + 0.18 * np.sin(2 * np.pi * 9 * t / NOTE)) / 12)
    save("wrong_note", fade(np.tanh(bp(osc(fw, "pulse", 0.25), 650, 4200) * 2) * np.exp(-t * 3), 0.0, 0.1))

    # --- our own music: a slow creepy music-box bed (the jingle at half speed over a C-minor pad), 32 s loop
    s = 32.0; n = int(s * SR); t = t_(s); x = np.zeros(n)
    chords = [[48, 55, 63], [44, 51, 60], [41, 48, 56], [43, 50, 59]]   # Cm, Ab, Fm, G (each 8 s)
    for ci, ch in enumerate(chords):
        a = int(ci * 8 * SR); seg = t_(8.0)
        pad = sum(np.sin(2 * np.pi * hz(m) * seg) + 0.3 * np.sin(2 * np.pi * hz(m) * 2.003 * seg) for m in ch)
        pad = lp(pad, 900) * np.minimum(1, seg / 1.5) * np.minimum(1, (8 - seg) / 1.5) * 0.12
        x[a: a + len(pad)] += pad
    note = NOTE * 2.2
    k = 0
    while k * note < s - 1:
        i = k % 16
        if not (k // 16) % 2 or i < 8:   # every other phrase plays only its first bar: sparse
            place(x, bell(hz(MEL[i]) * (0.985 if i in WRONG else 1.0), 1.4, 2.6, 0.5) * 0.5, k * note)
        k += 1
    x = reverb(x, 2.0, 0.35)
    save("music_box_bed", fade(x, 0.5, 0.5), right=np.roll(x, int(0.011 * SR)) * 0.95, peak=0.8)
