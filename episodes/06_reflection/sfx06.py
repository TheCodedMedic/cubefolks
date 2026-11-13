"""Short 6 "The Reflection That Blinks First": synthesised effects the library lacks -> episodes/06_reflection/sfx_gen/*.wav
(48 kHz stereo, pure numpy; sfx_gen/*.wav is committed, so the mix works without re-running this).
blink: a soft, wet little eyelid "tick" (a muted click with a tiny low body), for every on-screen blink of a reflection;
fridge: a kitchen fridge hum (60 Hz mains + harmonics, a slow compressor wobble, faint air), 8 s loop;
razor: an electric razor buzz (a 110 Hz sawtooth with a cutter rattle), 2.4 s, soft start and end;
swish: a soft cloth swish (filtered noise with a slow rise and a gentle fall), 0.7 s; swish_long: a towel pulled off, 1.1 s;
sub_drone: a dark sub drone (38 + 57 Hz with a slow beat and a quiet airy top), 12 s loop;
low_hit: a sharp low hit for "alone" (a falling 55 Hz body, a felt-mallet thump, a short dark tail), 2.5 s;
whoosh_soft: a soft airy whoosh for whip cuts (band-swept noise), 0.45 s;
crickets: a night cricket bed (chirp trains), 6 s loop.
Usage: python3 -I episodes/06_reflection/sfx06.py
"""
import pathlib, subprocess
import numpy as np

SR = 48000
OUT = pathlib.Path(__file__).resolve().parent / "sfx_gen"
rng = np.random.default_rng(6)
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
def save(name, x, width=0.95, right=None):
    r = x * width if right is None else right
    m = max(np.abs(x).max(), np.abs(r).max()) + 1e-9
    st = np.stack([x / m * 0.9, r / m * 0.9], 1).astype(np.float32)
    OUT.mkdir(exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(OUT / f"{name}.wav")],
                   input=st.tobytes(), check=True)
def loop_xfade(x, s=0.3):
    """make a bed loop seamlessly: crossfade its tail into its head."""
    n = int(s * SR); r = np.linspace(0, 1, n)
    y = x[:-n].copy(); y[:n] = y[:n] * r + x[-n:] * (1 - r)
    return y

# blink: a soft eyelid tick: two tiny clicks 25 ms apart (close, open) on a little low body, very short
t = t_(0.18); x = np.zeros(len(t))
for t0, a in ((0.0, 1.0), (0.028, 0.55)):
    tt = np.maximum(0, t - t0); on = t >= t0
    x += on * a * (np.sin(2 * np.pi * 1900 * tt) * np.exp(-tt * 260) * 0.6
                   + bp(rng.standard_normal(len(t)), 1200, 5000) * np.exp(-tt * 380) * 0.5
                   + np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 70) * 0.5)
save("blink", lp(x, 6000))

# fridge: mains hum with harmonics, a slow wobble, faint air
t = t_(8.3); wob = 1 + 0.08 * np.sin(2 * np.pi * 0.23 * t)
x = sum(a * np.sin(2 * np.pi * f * t + p) for f, a, p in [(60, 1.0, 0), (120, 0.6, 1), (180, 0.3, 2), (240, 0.15, 0.5), (360, 0.06, 1.3)]) * wob
x += bp(rng.standard_normal(len(t)), 150, 1500) * 0.08
save("fridge", loop_xfade(x), width=0.9)

# razor: a buzzy 110 Hz saw with a cutter rattle, slight load wobble, soft ends
t = t_(2.4); f = 110 + 3 * np.sin(2 * np.pi * 3.1 * t) - 4 * (np.sin(2 * np.pi * 0.9 * t) > 0.6)
ph = np.cumsum(f) / SR
saw = 2 * (ph % 1.0) - 1
x = lp(saw, 2500) * 0.8 + bp(rng.standard_normal(len(t)), 2500, 7000) * (0.25 + 0.15 * np.sin(2 * np.pi * 220 * t)) * 0.5
save("razor", fade(x, 0.06, 0.15))

# swish: soft cloth (towel) movement: noise through a rising then falling band, slow envelope
def cloth(d, seed):
    r = np.random.default_rng(seed); t = t_(d); u = t / d
    env = np.sin(np.pi * u ** 0.7) ** 2 * (1 + 0.3 * lp(r.standard_normal(len(t)), 12))
    n = r.standard_normal(len(t))
    return (bp(n, 400, 2500) * (1 - u) + bp(n, 900, 5000) * u + lp(n, 300) * 0.4) * env
save("swish", cloth(0.7, 61))
save("swish_long", cloth(1.1, 62), width=0.85)

# sub_drone: dark, slow, seamless
t = t_(12.4)
x = (np.sin(2 * np.pi * 38 * t) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.11 * t))
     + np.sin(2 * np.pi * 57.3 * t) * 0.45 * (0.7 + 0.3 * np.sin(2 * np.pi * 0.07 * t + 1))
     + np.sin(2 * np.pi * 76.4 * t) * 0.15)
air = bp(rng.standard_normal(len(t)), 300, 1200) * 0.05 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t))
save("sub_drone", loop_xfade(x + air, 0.6), width=1.0, right=loop_xfade(x + bp(rng.standard_normal(len(t)), 300, 1200) * 0.05, 0.6))

# low_hit: a sharp, low, short hit (soft, not a trailer boom)
t = t_(2.5)
body = np.sin(2 * np.pi * np.cumsum(55 + 45 * np.exp(-t * 18)) / SR) * np.exp(-t * 2.6)
thump = lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 40) * 1.4
click = bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t * 300) * 0.4
tail = lp(rng.standard_normal(len(t)), 220) * np.exp(-t * 1.6) * 0.25
save("low_hit", body + thump + click + tail, width=1.0)

# whoosh_soft: noise swept up then down through a band, gentle swell
t = t_(0.45); u = t / 0.45; env = np.sin(np.pi * u) ** 2
n = rng.standard_normal(len(t))
save("whoosh_soft", (bp(n, 300, 1200) * (1 - u) + bp(n, 900, 3500) * u) * env)

# crickets: a few crickets, each a train of chirps, at different rates and levels, a little night air
t = t_(6.3); x = np.zeros(len(t))
for f0, rate, lvl, ph in [(4600, 2.1, 1.0, 0.0), (4300, 1.7, 0.55, 0.3), (5000, 2.6, 0.35, 0.7)]:
    pulses = (np.sin(2 * np.pi * 45 * t) > 0.2).astype(float)
    chirp = ((t * rate + ph) % 1.0 < 0.18).astype(float)
    x += np.sin(2 * np.pi * f0 * t) * lp(pulses * chirp, 400) * lvl
x += bp(rng.standard_normal(len(t)), 200, 1500) * 0.03
save("crickets", loop_xfade(x), width=0.8)
print("wrote", sorted(p.name for p in OUT.glob("*.wav")))
