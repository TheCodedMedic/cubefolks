"""Short 09 "The Porch Light Code": synthesised sound -> sfx_gen/*.wav (48 kHz stereo, pure numpy, claim-free, no samples
except the two library laughs re-pitched for laugh_two_men).

THE SWITCH is the story: one real-sounding wall rocker switch, a sharp plastic snap with a little wall-plate body. "click"
(light ON, pressed) is brighter and harder than "clack" (released / OFF), so three flashes read as three. Mr. Bell's switch
is the same make, pitched a touch lower (an older plate across the street).

THE SCORE (score09.wav) is OUR OWN music, written here: a piano + music-box piece in F, rendered to the picture's exact
length with every section boundary taken from the words (timing.json) and the picture's events (events09.json), never
typed seconds:
  beats 1-7   gentle, curious music box over soft piano bass (F - Dm - Bb - C, a Lydian B-natural for curiosity)
  beats 8-12  thin and a little tense: a low D-minor pad, sparse high notes; on the stare (beat 10) an uneasy E/F rub
  beat 13     fades to nothing: silence on the knock that never comes
  beat 14     one soft warm chord (relief)
  piano_rise  -> end: a warm piano swell (Bb - F/A - Gm - C - Dm - Bb - C) landing on F on "safe", decayed by the end so
              the loop back to second 0 (which starts on F) is clean.
Music-box / arpeggio onsets never land within 70 ms of a switch event, and the score dips 7 dB around each one: the clicks
always stand alone.
Rerun after the lead regenerates events09.json:  python3 -I episodes/09_porch_light/sfx09.py
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
SRC = ROOT / "video" / "src" / "short09_porch"
rng = np.random.default_rng(9)
TM = json.load(open(SRC / "timing.json"))
EV = json.load(open(SRC / "events09.json"))
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())


def at(b, w, n=1):
    return [x["s"] for x in TM["words"] if x["b"] == b and norm(x["w"]) == norm(w)][n - 1]


PS = lambda b: TM["beats"][b - 1]["s"]
PE = lambda b: TM["beats"][b - 1]["e"]
END = EV["end"]
ev = lambda k: [e for e in EV["events"] if e["kind"] == k]
SWITCH_T = sorted(e["t"] for e in EV["events"] if e["kind"].startswith("switch_"))
t_ = lambda s: np.arange(int(round(s * SR))) / SR
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


def reverb(x, secs=1.0, mix=0.2, seed=3, bright=5000):
    r = np.random.default_rng(seed); m = int(secs * SR)
    ir = r.standard_normal(m) * np.exp(-np.linspace(0, 7, m)); ir = lp(ir, bright); ir /= np.sqrt((ir ** 2).sum()) * 3
    L = len(x) + m
    y = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L))[: len(x)]
    return x * (1 - mix) + y * mix


def loopify(x, xf=0.4):
    """Make a seamless loop: crossfade the tail into the head."""
    n = int(xf * SR); a = np.linspace(0, 1, n)
    y = x[:-n].copy(); y[:n] = y[:n] * a + x[-n:] * (1 - a)
    return y


def damped(f, tau, s, ph=0.0):
    t = t_(s); return np.sin(2 * np.pi * f * t + ph) * np.exp(-t / tau)


def place(dst, src, t0, a=1.0):
    i = int(round(t0 * SR)); j0 = max(0, -i); i = max(0, i); n = min(len(src) - j0, len(dst) - i)
    if n > 0: dst[i:i + n] += src[j0:j0 + n] * a


def save(name, x, width=0.9, right=None, peak=0.9):
    r = x * width if right is None else right
    m = max(np.abs(x).max(), np.abs(r).max()) + 1e-9
    st = np.stack([x / m * peak, r / m * peak], 1).astype(np.float32)
    OUT.mkdir(exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(OUT / f"{name}.wav")],
                   input=st.tobytes(), check=True)
    print(f"  {name}.wav  {len(x) / SR:.2f} s")


def load_lib(name):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(ROOT / "sfx" / "library" / f"{name}.ogg"), "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(float)


# ============================================================ the switch
def switch(pitch=1.0, release=False):
    """A wall rocker switch: a sharp plastic snap (two micro-transients ~1.4 ms apart) ringing the plate, a small body thump."""
    s = 0.09; x = np.zeros(int(s * SR))
    nz = noise(0.0012); snap = hp(nz, 1800) * np.hanning(len(nz))
    hard = 0.8 if release else 1.0          # the clack: the same crisp snap, a little softer and lower, one snap not two
    for d, a in ((0.0, 1.0), (0.0014, 0.25 if release else 0.6)):
        place(x, snap * a * hard, d)
    p = pitch * (0.87 if release else 1.0)
    for f, tau, a in ((3150, 0.0055, 0.9), (4900, 0.003, 0.45 if release else 0.55), (1320, 0.011, 0.5), (2230, 0.007, 0.4)):
        place(x, damped(f * p, tau, s, rng.random() * 6) * a * hard, 0.0003)
    place(x, damped(170 * p, 0.009, s) * (0.5 if release else 0.35), 0.0)   # the wall plate / box
    x = reverb(x, 0.18, 0.1, seed=5, bright=7000)
    return fade(x, 0.0, 0.01)


# ============================================================ effects
def cart_rattle():
    s = 0.9; x = np.zeros(int(s * SR))
    ts = np.sort(rng.random(16) ** 1.6 * 0.6)
    for k, t0 in enumerate(ts):
        f = 2000 + rng.random() * 4200
        hit = sum(damped(f * r, 0.012 + rng.random() * 0.02, 0.12, rng.random() * 6) * a for r, a in ((1, 1), (1.53, 0.5), (2.41, 0.3)))
        place(x, hit * (1 - k / 20) * 0.5, t0)
    roll = lp(noise(0.7), 260) * (0.6 + 0.4 * np.sin(2 * np.pi * 11 * t_(0.7))) * np.exp(-t_(0.7) * 3)
    place(x, roll * 2.0, 0.0)
    return fade(reverb(x, 0.6, 0.18), 0.002, 0.1)


def step(kind):
    s = 0.2; x = np.zeros(int(s * SR)); t = t_(s)
    if kind == "tile":      # a quick shoe on a store floor: heel thump + a tap
        x += lp(noise(s), 400) * np.exp(-t / 0.02) * 2.5
        place(x, bp(noise(0.03), 1800, 4500) * np.exp(-t_(0.03) / 0.006) * 1.2, 0.035)
    elif kind == "path":    # a hurried step on a concrete path: a gritty scuff
        x += lp(noise(s), 300) * np.exp(-t / 0.025) * 2.0
        grit = bp(noise(s), 700, 3500) * (rng.random(len(t)) > 0.9) * np.exp(-t / 0.05)
        x += grit * 1.6
    elif kind == "sock":    # a socked tiptoe on wood: almost nothing
        x += lp(noise(s), 250) * np.exp(-t / 0.03) * 1.5
    elif kind == "slipper": # a soft slap of a slipper on the road
        x += bp(noise(s), 500, 2600) * np.exp(-t / 0.016) * 2.2
        x += damped(120, 0.02, s) * 0.5
        place(x, bp(noise(0.05), 400, 1800) * np.exp(-t_(0.05) / 0.012) * 0.6, 0.06)   # the heel flap
    return fade(x, 0.001, 0.04)


def creak(seed):
    """A floorboard creak: stick-slip pulses whose rate wanders, through two wood resonances."""
    r = np.random.default_rng(seed); s = 0.5 + r.random() * 0.2; t = t_(s)
    rate = 60 + 90 * np.sin(np.pi * t / s) ** 1.5 + r.random() * 20
    ph = np.cumsum(rate) / SR
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.6 + 0.4 * r.random(len(t)))
    x = np.zeros(len(t))
    for f, tau in ((520 + r.random() * 120, 0.006), (1050 + r.random() * 200, 0.003), (2300, 0.0015)):
        k = damped(f, tau, 0.03); x += np.convolve(pulses, k)[: len(t)]
    return fade(x * np.sin(np.pi * t / s) ** 0.7, 0.01, 0.06)


def cloth(s=0.35, seed=0):
    r = np.random.default_rng(seed); t = t_(s)
    flutter = lp(np.abs(r.standard_normal(len(t))), 30); flutter /= flutter.max()
    x = bp(r.standard_normal(len(t)), 900, 6500) * flutter ** 1.5 * np.sin(np.pi * t / s)
    return fade(x, 0.01, 0.05)


def chime():
    """The wall clock at 9:00: one soft, warm bell (F5 with a low octave), long decay."""
    s = 2.4; t = t_(s); f = hz(77)
    x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3)
         + 0.4 * np.sin(2 * np.pi * f / 2 * t) + 0.12 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 8))
    x *= np.exp(-t * 1.6) * np.minimum(1, t / 0.004)
    return fade(reverb(x, 1.2, 0.25), 0.0, 0.3)


def snore():
    """A soft comic snore loop (3.4 s): a fluttering inhale (soft palate at ~26 Hz), a breathy 'pfff' exhale, a pause."""
    L = 3.4; x = np.zeros(int(L * SR))
    si = 1.25; ti = t_(si)
    flutter = (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (24 + 6 * ti / si) * ti))) ** 1.0
    inhale = bp(noise(si), 180, 1300) * lp(flutter, 300) * np.sin(np.pi * ti / si) ** 1.2
    inhale += lp(noise(si), 140) * flutter * np.sin(np.pi * ti / si) * 1.5
    place(x, inhale, 0.1)
    se = 0.9; te = t_(se)
    exhale = bp(noise(se), 300, 2200) * np.sin(np.pi * te / se) ** 2 * 0.45
    exhale += bp(noise(se), 200, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 34 * te)) * np.exp(-te / 0.12) * 0.5   # the lip "pff"
    place(x, exhale, 1.55)
    return x


def tv_murmur():
    """A TV murmuring behind the couch: two talk-show voices (pitched pulse trains through vowel formants, syllable gates),
    a little laugh-track hiss, all muffled (lowpass ~1.3 kHz)."""
    L = 12.4; t = t_(L); x = np.zeros(len(t))
    for f0, who, seed in ((118, 0, 1), (196, 1, 2)):
        r = np.random.default_rng(seed)
        # turn-taking: each voice speaks in phrases
        turn = (np.sin(2 * np.pi * t / 5.3 + who * np.pi) > -0.1).astype(float)
        syl = np.clip(np.sin(2 * np.pi * np.cumsum(4.3 + 1.6 * lp(r.standard_normal(len(t)), 2) * 5) / SR), 0, 1) ** 0.6
        pitch = f0 * (1 + 0.12 * lp(r.standard_normal(len(t)), 1.5) * 8)
        src = np.sign(np.sin(2 * np.pi * np.cumsum(pitch) / SR)) + 0.2 * r.standard_normal(len(t))
        v = sum(bp(src, f * 0.85, f * 1.15) * a for f, a in ((500 + 200 * who, 1.0), (1200, 0.5), (2400, 0.2)))
        x += v * syl * lp(turn, 3)
    x = lp(x, 1300) + lp(hp(noise(L), 3000), 8000) * 0.02
    return loopify(x, 0.4)


def store_hum():
    """Supermarket: fluorescent buzz (120 Hz family), a chiller hum, soft air."""
    L = 10.4; t = t_(L)
    x = sum(np.sin(2 * np.pi * 120 * k * t) * a for k, a in ((1, 0.25), (2, 0.12), (3, 0.08), (5, 0.03), (8, 0.015)))
    x += np.sin(2 * np.pi * 57 * t) * 0.15 * (1 + 0.1 * np.sin(2 * np.pi * 0.3 * t))
    x += lp(noise(L), 600) * 0.6 + bp(noise(L), 2000, 6000) * 0.05
    return loopify(x, 0.4)


def laugh_two_men():
    """Dad and Mr. Bell laugh together: the library's casual man laugh (laugh_man_01, Mixkit Free), once as it is and once
    re-pitched lower and a little later and to the other side, so it reads as two warm adult men."""
    a = load_lib("laugh_man_01")
    b = np.interp(np.arange(0, len(a), 0.84), np.arange(len(a)), a)          # 3 semitones down, slower: the bigger man
    n = len(b) + int(0.14 * SR)
    L = np.zeros(n); R = np.zeros(n)
    place(L, a, 0.0, 1.0); place(R, a, 0.0, 0.7)
    place(L, b, 0.14, 0.6); place(R, b, 0.14, 0.95)
    m = max(np.abs(L).max(), np.abs(R).max())
    return fade(L / m, 0, 0.1), fade(R / m, 0, 0.1)


# ============================================================ the score (our own)
def piano(f, dur, vel=0.6, rel=0.35):
    """A soft upright piano note: slightly inharmonic partials, brighter when louder, a hammer tick, held for dur + release."""
    s = dur + rel + 0.05; t = t_(s); B = 0.0003; x = np.zeros(len(t))
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 9000: break
        a = (1 / k ** 1.4) * (vel ** (0.4 * (k - 1)))
        x += a * np.sin(2 * np.pi * fk * t + k) * np.exp(-t * (0.5 + 0.45 * k) * (1 + f / 1500))
    x *= np.minimum(1, t / 0.004)
    hammer = lp(noise(0.012), 2500) * np.exp(-t_(0.012) / 0.002) * 0.15 * vel
    x[: len(hammer)] += hammer
    off = np.ones(len(t)); nd = int(dur * SR); nr = len(t) - nd
    off[nd:] = np.linspace(1, 0, nr) ** 2
    return x * off * vel


def musicbox(f, vel=0.5):
    s = 1.6; t = t_(s)
    x = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 3.0 * t) * np.exp(-t * 6)
         + 0.15 * np.sin(2 * np.pi * f * 5.2 * t) * np.exp(-t * 12))
    return x * np.exp(-t * 2.4) * np.minimum(1, t / 0.0015) * vel


def pad(freqs, s, att=0.8, rel=1.0, bright=900, detune=0.003):
    t = t_(s); x = np.zeros(len(t))
    for f in freqs:
        for d in (-detune, detune):
            ph = 2 * np.pi * f * (1 + d) * t
            x += np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)
    x = lp(x, bright) * (1 + 0.05 * np.sin(2 * np.pi * 0.4 * t))
    return fade(x / len(freqs), min(att, s / 2), min(rel, s / 2))


def clear_of_switch(t0, guard=0.07):
    return all(abs(t0 - s) > guard and not (0 < s - t0 < 0.12) for s in SWITCH_T)


def score():
    n = int(END * SR); L = np.zeros(n); R = np.zeros(n)

    def put(x, t0, a=1.0, pan=0.0):          # pan -1..1
        place(L, x, t0, a * (1 - max(0, pan))); place(R, x, t0, a * (1 + min(0, pan)))

    # ---- A: beats 1-7, gentle and curious (music box over soft piano bass), F - Dm - Bb - C
    TB = PS(8) - 0.1
    NOTE = 0.36
    chordsA = [(53, [65, 69, 72, 77, 72, 69, 71, 72]),       # F  (the B-natural, 71: the curious Lydian step)
               (50, [62, 65, 69, 74, 69, 65, 64, 65]),       # Dm
               (46, [58, 62, 65, 70, 65, 62, 65, 67]),       # Bb
               (48, [60, 64, 67, 72, 74, 72, 67, 64])]       # C
    k = 0; t0 = 0.0
    while t0 < TB - 0.2:
        bar, i = divmod(k, 8); bass, mel = chordsA[bar % 4]
        if i == 0:
            put(piano(hz(bass), NOTE * 7, 0.35), t0, 0.9, -0.2)
            put(piano(hz(bass + 7), NOTE * 6, 0.25), t0 + NOTE * 2, 0.5, -0.2)
        if clear_of_switch(t0):
            put(musicbox(hz(mel[i] + 12), 0.4 + 0.1 * (i % 2 == 0)), t0, 0.55, 0.25)
        k += 1; t0 = k * NOTE
    # ---- B: beats 8-12, thin and a little tense: a low D-minor pad, sparse high notes
    T13 = PS(13); KNOCK = ev("knock_that_never_comes")[0]["t"]
    put(pad([hz(38), hz(45)], KNOCK - TB + 0.2, 1.2, 1.4, 500), TB, 0.55)
    sparse = [74, 69, 70, 69, 74, 77, 76, 70]
    t0 = TB + 0.2; j = 0
    while t0 < PS(10) - 0.2:
        if clear_of_switch(t0): put(musicbox(hz(sparse[j % len(sparse)] + 12), 0.3), t0, 0.5, 0.3)
        t0 += NOTE * 2; j += 1
    # the stare (beat 10): an uneasy E/F rub up high, a low Bb swelling under it
    S10, E10 = PS(10), PS(11)
    put(pad([hz(76), hz(77)], E10 - S10 + 0.6, 0.9, 0.8, 2500, 0.002), S10, 0.32, 0.3)
    put(pad([hz(34)], E10 - S10 + 0.6, 0.8, 0.8, 300), S10, 0.5, -0.2)
    # beats 11-12: a slow low piano pulse like a held heartbeat, fading by the door
    t0 = E10; j = 0
    while t0 < T13 - 0.1:
        put(piano(hz(38), 0.5, 0.3), t0, 0.55, -0.1)
        if j % 2 == 1 and clear_of_switch(t0 + NOTE): put(musicbox(hz(81), 0.2), t0 + NOTE, 0.3, 0.35)
        t0 += NOTE * 2; j += 1
    # ---- beat 13: nothing new. Silence lands on the knock that never comes (the pad has faded out by then).
    # ---- beat 14: one soft warm chord, relief (F/A)
    put(piano(hz(57), 1.4, 0.3), PS(14) + 0.05, 0.5, -0.1)
    for m in (65, 69, 72):
        put(piano(hz(m), 1.3, 0.28), PS(14) + 0.08, 0.35, 0.1)
    # ---- the warm swell: piano_rise -> "safe" (beat 18), arpeggios that open up, landing on F
    RISE = ev("piano_rise")[0]["t"]; SAFE = at(18, "safe")
    prog = [(46, [58, 62, 65, 70]), (45, [60, 65, 69, 72]), (43, [58, 62, 65, 70]), (48, [60, 64, 67, 72]),
            (50, [62, 65, 69, 74]), (46, [62, 65, 70, 74]), (48, [64, 67, 70, 76])]
    span = (SAFE - RISE) / len(prog); step = span / 4
    put(pad([hz(53), hz(60), hz(65), hz(69)], END - RISE, 2.0, 1.6, 1100), RISE, 0.35)
    for ci, (bass, notes) in enumerate(prog):
        tc = RISE + ci * span; v = 0.38 + 0.4 * ci / (len(prog) - 1)
        put(piano(hz(bass), span * 0.95, v * 0.8), tc, 0.9, -0.25)
        put(piano(hz(bass + 12), span * 0.9, v * 0.6), tc, 0.5, -0.15)
        for i, m in enumerate(notes):
            ti = tc + i * step
            if clear_of_switch(ti):
                put(piano(hz(m + 12), step * 2.2, v), ti, 0.7, 0.2 - 0.1 * i)
    # land: F on "safe", soft and long, decayed by the end
    land = END - SAFE
    put(piano(hz(41), land - 0.4, 0.45, 0.35), SAFE, 0.9, -0.25)
    for i, m in enumerate((53, 60, 65, 69, 72, 77)):
        if clear_of_switch(SAFE + i * 0.05):
            put(piano(hz(m), land - 0.45 - i * 0.05, 0.42, 0.35), SAFE + i * 0.05, 0.55, -0.15 + 0.07 * i)
    L, R = reverb(L, 1.8, 0.28, 11, 4500), reverb(R, 1.8, 0.28, 12, 4500)
    # make room for every switch: the score dips 7 dB from 30 ms before to 70 ms after each click / clack (15 ms ramps)
    g = np.ones(n); ramp = int(0.015 * SR)
    for s in SWITCH_T:
        a, b = int((max(0, s) - 0.03) * SR), int((max(0, s) + 0.07) * SR)
        g[max(0, a):b] = 10 ** (-7 / 20)
    g = np.convolve(g, np.ones(ramp) / ramp, "same"); g[:ramp] = g[ramp]
    L *= g; R *= g
    f = int(0.5 * SR)
    L[-f:] *= np.linspace(1, 0, f) ** 2; R[-f:] *= np.linspace(1, 0, f) ** 2
    return L, R


def main():
    print("Short 09 sound ->", OUT)
    save("sw_ours_click", switch(1.0, False))
    save("sw_ours_clack", switch(1.0, True))
    save("sw_bell_click", switch(0.9, False))
    save("sw_bell_clack", switch(0.9, True))
    save("cart_rattle", cart_rattle())
    for k in ("tile", "path", "sock", "slipper"):
        save(f"step_{k}", step(k))
    for i in range(3):
        save(f"creak_{i + 1}", creak(20 + i))
    save("cloth_rustle", cloth(0.35, 4))
    save("coat_rustle", cloth(0.6, 8))
    save("chime_nine", chime())
    save("snore", snore())
    tv = tv_murmur(); save("tv_murmur", tv, right=np.roll(tv, 400) * 0.9)
    sh = store_hum(); save("store_hum", sh, right=np.roll(sh, 900))
    l, r = laugh_two_men(); save("laugh_two_men", l, right=r)
    L, R = score(); save("score09", L, right=R)


if __name__ == "__main__":
    main()
