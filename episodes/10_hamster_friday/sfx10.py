"""Short 10 "The Hamster Who Escapes Every Friday": synthesised effects + an ORIGINAL mystery music bed -> sfx_gen/*.wav
(48 kHz stereo, pure numpy, committed so the mix works without re-running this).
tape_rip: tape pulled off a roll and slapped on (a ripping noise burst, then a pat), 0.8 s;
drawer_out / drawer_in: a plastic drawer sliding (a rough rising/falling slide + a clack at the end), 0.6 s;
wheel: a hamster wheel turning (a rhythmic squeak + a light rattle), 4 s loop;
scratch: tiny claws scratching inside a backpack (bursts of filtered noise scrapes), 1.6 s;
rustle: a nylon backpack rustle/zip, 0.7 s;  shells: sunflower shells spilling (tiny clicks), 1.0 s;
boop: a phone "boop" (start/stop recording), 0.25 s;  rec_beep: a recording beep;
clue: a soft detective sting (pizzicato + a vibraphone note), 1.2 s;  aha: the big "aha" sting (rising arpeggio + bell chord), 2.4 s;
munch: a hamster nibbling (fast crunchy ticks), 1.0 s;  pencil: a pencil scribble on paper, 0.8 s;
mystery_bed: OUR OWN music: a sneaky walking pizzicato bass with a soft vibraphone motif and brushed hats, 94 bpm, D minor,
  32 s loop (claim-free: synthesised here, no samples).
Usage: python3 -I episodes/10_hamster_friday/sfx10.py
"""
import pathlib, subprocess
import numpy as np

SR = 48000
OUT = pathlib.Path(__file__).resolve().parent / "sfx_gen"
rng = np.random.default_rng(10)
t_ = lambda s: np.arange(int(s * SR)) / SR


def lp(x, fc):
    k = max(1, int(SR / (2 * np.pi * fc))); w = np.ones(k) / k
    return np.convolve(np.convolve(x, w, "same"), w, "same")
def bp(x, lo, hi): return lp(x, hi) - lp(x, lo)
def fade(x, a, b):
    na, nb = int(a * SR), int(b * SR)
    if na: x[:na] *= np.linspace(0, 1, na)
    if nb: x[-nb:] *= np.linspace(1, 0, nb)
    return x
def save(name, x, width=0.95, right=None, peak=0.9):
    r = x * width if right is None else right
    m = max(np.abs(x).max(), np.abs(r).max()) + 1e-9
    st = np.stack([x / m * peak, r / m * peak], 1).astype(np.float32)
    OUT.mkdir(exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(OUT / f"{name}.wav")],
                   input=st.tobytes(), check=True)
def noise(s): return rng.standard_normal(int(s * SR))
def place(dst, src, t0, a=1.0):
    i = int(t0 * SR); n = min(len(src), len(dst) - i)
    if n > 0: dst[i:i + n] += src[:n] * a
def pluck(f, s, decay=6.0, bright=1.0):
    t = t_(s); x = np.zeros(len(t))
    for h in range(1, 7): x += np.sin(2 * np.pi * f * h * t) * (bright ** (h - 1)) / h ** 1.2 * np.exp(-t * decay * (1 + 0.5 * h))
    att = np.minimum(1, t / 0.004); return x * att
def vib(f, s, decay=1.6):
    t = t_(s); trem = 1 + 0.25 * np.sin(2 * np.pi * 5.5 * t)
    x = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-t * 8) + 0.1 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t * 20))
    return x * np.exp(-t * decay) * trem * np.minimum(1, t / 0.003)
def bell(f, s, decay=1.2):
    t = t_(s); return sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * decay * d) for r, a, d in [(1, 1, 1), (2.76, 0.4, 1.6), (5.4, 0.2, 2.4), (8.9, 0.1, 3)]) * np.minimum(1, t / 0.002)
def reverb(x, secs=1.2, mix=0.22):
    n = int(secs * SR); ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 5.0); ir = lp(ir, 5000)
    w = np.convolve(x, ir)[:len(x)]; w /= np.abs(w).max() + 1e-9
    return x * (1 - mix) + w * mix * np.abs(x).max()
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# tape_rip: a ripping burst (noise with fast amplitude chatter) then a pat
t = t_(0.8); x = np.zeros(len(t))
r = bp(noise(0.42), 900, 6000) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 70 * t_(0.42)))) * np.linspace(0.6, 1, int(0.42 * SR))
place(x, fade(r, 0.01, 0.05), 0.0)
pat = lp(noise(0.08), 900) * np.exp(-t_(0.08) * 60); place(x, pat, 0.55, 1.4)
save("tape_rip", x)

# drawer slide: rough scrape whose pitch rises (out) / falls (in), then a clack
def drawer(out=True):
    s = 0.6; t = t_(s); x = np.zeros(len(t))
    sl = bp(noise(0.42), 300, 2500) * (1 + 0.6 * np.sin(2 * np.pi * (38 if out else 30) * t_(0.42))) * np.sin(np.pi * np.linspace(0, 1, int(0.42 * SR)))
    place(x, sl, 0.0, 0.8)
    ck = (np.sin(2 * np.pi * 1300 * t_(0.06)) + bp(noise(0.06), 1000, 5000)) * np.exp(-t_(0.06) * 90); place(x, ck, 0.43, 1.2)
    return x
save("drawer_out", drawer(True)); save("drawer_in", drawer(False))

# wheel: rhythmic squeak (about 2.2 turns a second) + rattle, loop
s = 4.0; t = t_(s); x = np.zeros(len(t))
for k in range(int(s * 2.2)):
    sq = np.sin(2 * np.pi * (2300 + 300 * rng.random()) * t_(0.07) + 4 * np.sin(2 * np.pi * 40 * t_(0.07))) * np.sin(np.pi * np.linspace(0, 1, int(0.07 * SR)))
    place(x, sq, k / 2.2 + 0.02 * rng.random(), 0.5)
    place(x, bp(noise(0.03), 2000, 7000) * np.exp(-t_(0.03) * 120), k / 2.2 + 0.22, 0.3)
x += bp(noise(s), 400, 3000) * 0.04
save("wheel", x, width=0.85)

# scratch: claw scrapes in bursts
s = 1.6; x = np.zeros(int(s * SR))
for k in range(9):
    d = 0.06 + 0.08 * rng.random(); sc = bp(noise(d), 1500, 7000) * np.sin(np.pi * np.linspace(0, 1, int(d * SR))) * (1 + 0.8 * np.sin(2 * np.pi * 120 * t_(d)))
    place(x, sc, k * 0.16 + 0.05 * rng.random(), 0.6 + 0.4 * rng.random())
save("scratch", x)

# rustle: nylon rustle + a short zip
s = 0.7; x = lp(bp(noise(s), 700, 5000), 6000) * np.abs(np.sin(2 * np.pi * 3 * t_(s))) * 0.5
z = bp(noise(0.3), 2000, 8000) * (1 + np.sign(np.sin(2 * np.pi * 180 * t_(0.3)))) * 0.5; place(x, fade(z, 0.02, 0.05), 0.35, 0.8)
save("rustle", fade(x, 0.02, 0.1))

# shells: tiny clicks spilling
s = 1.0; x = np.zeros(int(s * SR))
for k in range(40):
    tk = 0.9 * (k / 40) ** 1.5 + 0.01 * rng.random()
    c = (np.sin(2 * np.pi * (2500 + 2500 * rng.random()) * t_(0.02)) + bp(noise(0.02), 2000, 8000)) * np.exp(-t_(0.02) * 300)
    place(x, c, tk, 0.4 + 0.6 * rng.random())
save("shells", x)

# boop: phone record start (two soft tones)
x = np.zeros(int(0.3 * SR))
for i, (f, t0) in enumerate([(880, 0.0), (1320, 0.09)]): place(x, np.sin(2 * np.pi * f * t_(0.12)) * np.exp(-t_(0.12) * 25) * np.minimum(1, t_(0.12) / 0.003), t0)
save("boop", x)
x = np.sin(2 * np.pi * 1046 * t_(0.16)) * np.exp(-t_(0.16) * 12) * np.minimum(1, t_(0.16) / 0.003); save("rec_beep", x)

# munch: fast crunchy nibbles
s = 1.0; x = np.zeros(int(s * SR))
for k in range(16): place(x, bp(noise(0.025), 1500, 6000) * np.exp(-t_(0.025) * 160), k * 0.058 + 0.01 * rng.random(), 0.5 + 0.5 * rng.random())
save("munch", x)

# pencil scribble
s = 0.8; x = bp(noise(s), 2500, 9000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 7 * t_(s)))) ; save("pencil", fade(x, 0.03, 0.1))

# clue sting: pizzicato D + A, then a vibraphone F (soft, curious)
x = np.zeros(int(1.4 * SR))
place(x, pluck(hz(50), 0.5, 7), 0.0, 0.9); place(x, pluck(hz(57), 0.5, 7), 0.12, 0.8); place(x, vib(hz(77), 1.2, 2.2), 0.24, 0.7)
save("clue", reverb(x, 1.0, 0.25))

# aha: a rising vibraphone arpeggio (D minor -> D major lift) and a bell chord, with a low pluck
x = np.zeros(int(2.6 * SR))
for i, m in enumerate([62, 65, 69, 74, 78]): place(x, vib(hz(m), 1.4, 2.0), i * 0.07, 0.6)
for m in (74, 78, 81): place(x, bell(hz(m), 2.2, 1.0), 0.38, 0.35)
place(x, pluck(hz(38), 1.0, 3), 0.38, 1.0)
save("aha", reverb(x, 1.6, 0.3))

# mystery_bed: 94 bpm, D minor, 12 bars (~30.6 s) + a tail, made to loop
bpm = 94; beat = 60 / bpm; bars = 12; L = bars * 4 * beat; x = np.zeros(int((L + 0.01) * SR))
# walking pizzicato bass, one note per beat (a sneaky chromatic walk)
walk = [38, 41, 43, 44, 45, 44, 43, 41, 38, 41, 43, 45, 46, 45, 44, 43,
        41, 43, 44, 45, 38, 40, 41, 43, 45, 44, 43, 41, 38, 37, 38, 45]
for i in range(bars * 4):
    m = walk[i % len(walk)]; place(x, pluck(hz(m), beat * 0.95, 9, 0.7), i * beat + 0.004 * rng.random(), 0.9 - 0.15 * (i % 2))
# brushed hats on the off-beats, a soft rim on 2 and 4
for i in range(bars * 8):
    if i % 2: place(x, bp(noise(0.06), 5000, 12000) * np.exp(-t_(0.06) * 60), i * beat / 2, 0.12)
for i in range(bars * 4):
    if i % 4 in (1, 3): place(x, (bp(noise(0.05), 800, 3000) + 0.4 * np.sin(2 * np.pi * 420 * t_(0.05))) * np.exp(-t_(0.05) * 70), i * beat, 0.14)
# the vibraphone motif (our own), every two bars, answered an octave up on the second half
motif = [(0, 74), (0.75, 77), (1.5, 76), (2.0, 74), (3.0, 81), (4.5, 80), (5.0, 77)]
for b0 in range(0, bars, 2):
    up = 12 if b0 % 4 == 2 else 0
    for off, m in motif:
        if b0 * 4 * beat + off * beat < L - 0.5: place(x, vib(hz(m + up - 12 * (b0 % 8 == 6)), beat * 2.5, 2.4), b0 * 4 * beat + off * beat, 0.32)
x = reverb(x, 1.4, 0.18)
n = int(0.25 * SR); x[-n:] = x[-n:] * np.linspace(1, 0, n) + x[:n] * np.linspace(0, 1, n)  # loop seam
x = x[n:]
right = np.roll(x, int(0.011 * SR))
save("mystery_bed", x, right=right, peak=0.8)
print("wrote", sorted(p.name for p in OUT.glob("*.wav")))
