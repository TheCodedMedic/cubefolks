"""Synthesised sound effects (numpy), for sounds the CC0 library lacks. All vectorised (no per-sample Python loops).

Usage: python3 -I pipeline/synth.py <out_dir>   -> writes <name>.wav for every effect in EFFECTS.
"""
import pathlib
import subprocess
import sys

import numpy as np

SR = 48000
rng = np.random.default_rng(11)


def n_(secs):
    return int(secs * SR)


def lp(x, fc):
    """Low-pass by repeated moving average (good enough for effects)."""
    k = max(1, int(SR / (2 * np.pi * fc)))
    w = np.ones(k) / k
    return np.convolve(np.convolve(x, w, "same"), w, "same")


def hp(x, fc):
    return x - lp(x, fc)


def env(n, a, r, sus=1.0):
    e = np.ones(n) * sus
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na: e[:na] = np.linspace(0, sus, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def sine(f, n):
    f = np.broadcast_to(np.asarray(f, float), (n,))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def reverb(x, secs=1.6, mix=0.25):
    m = n_(secs)
    ir = rng.standard_normal(m) * np.exp(-np.linspace(0, 7, m))
    ir = lp(ir, 5000)
    ir /= np.sqrt((ir ** 2).sum()) * 3
    L = len(x) + m
    y = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L))[: len(x)]
    return x * (1 - mix) + y * mix


# ─── effects ─────────────────────────────────────────────────────────────────
def sizzle(secs=2.5):
    n = n_(secs)
    x = hp(rng.standard_normal(n), 2500) * (0.6 + 0.4 * (rng.random(n) > 0.97))
    crack = np.zeros(n)
    for i in rng.integers(0, n - 800, int(60 * secs)):
        L = rng.integers(60, 500); crack[i:i + L] += rng.standard_normal(L) * np.exp(-np.linspace(0, 6, L))
    return (x * 0.5 + hp(crack, 1500)) * env(n, 0.05, 0.6)


def steam(secs=2.0):
    n = n_(secs)
    return hp(lp(rng.standard_normal(n), 7000), 1800) * env(n, 0.3, 0.8) * (1 + 0.3 * np.sin(np.arange(n) / SR * 7))


def drill(secs=2.4):
    n = n_(secs)
    f = 1900 + 300 * np.sin(np.arange(n) / SR * 3) + 400 * np.minimum(1, np.arange(n) / (0.3 * SR))
    x = sine(f, n) * 0.5 + sine(f * 2.01, n) * 0.25 + np.sign(sine(f / 2, n)) * 0.1
    return hp(x + 0.08 * rng.standard_normal(n), 400) * env(n, 0.08, 0.3)


def hit(secs=3.0):
    n = n_(secs)
    sub = sine(np.linspace(62, 32, n), n) * np.exp(-np.linspace(0, 3.2, n))
    body = lp(rng.standard_normal(n), 1100) * np.exp(-np.linspace(0, 10, n)) * 2
    return reverb(np.tanh((sub * 1.8 + body) * 1.3), 2.6, 0.3)


def riser(secs=2.0):
    n = n_(secs)
    u = np.linspace(0, 1, n)
    x = hp(rng.standard_normal(n), 1200) * u ** 2.5 + sine(200 + 900 * u ** 2, n) * 0.18 * u
    return x * env(n, 0.0, 0.03)


def whoomp(secs=1.4):
    """The soft sub 'whoomp' of a thought ring spreading out."""
    n = n_(secs)
    x = sine(np.linspace(140, 45, n), n) * np.exp(-np.linspace(0, 5, n))
    air = lp(hp(rng.standard_normal(n), 300), 2500) * np.exp(-np.linspace(0, 6, n)) * 0.4
    return reverb(x + air, 1.8, 0.35)


def pop(secs=0.35, f0=900):
    """A bubbly card pop."""
    n = n_(secs)
    return reverb(sine(np.linspace(f0, f0 * 1.8, n), n) * np.exp(-np.linspace(0, 14, n)) + 0.3 * sine(f0 * 2.5, n) * np.exp(-np.linspace(0, 22, n)), 0.8, 0.2)


def tick(secs=0.06):
    n = n_(secs)
    return hp(rng.standard_normal(n), 3000) * np.exp(-np.linspace(0, 30, n))


def beep(secs=0.18, f=1000):
    n = n_(secs)
    return sine(f, n) * env(n, 0.005, 0.03)


def monitor(secs=4.0, bpm=72, f=1000):
    n = n_(secs); x = np.zeros(n); b = beep(0.12, f)
    for k in range(int(secs * bpm / 60) + 1):
        i = int(k * 60 / bpm * SR)
        if i + len(b) < n: x[i:i + len(b)] += b
    return x


def buzz(secs=0.5):
    n = n_(secs)
    return lp(np.sign(sine(170, n)) * 0.6 + sine(85, n) * 0.4, 900) * (np.arange(n) % int(0.25 * SR) < int(0.17 * SR)) * env(n, 0.005, 0.05)


def bell_ring(secs=2.4):
    """An old electric alarm bell: a fast hammer on a metal gong."""
    n = n_(secs)
    gong = sum(sine(f, n) * a for f, a in [(820, 1), (1240, 0.6), (2050, 0.4), (2890, 0.25)])
    ham = (np.sin(np.arange(n) / SR * 2 * np.pi * 24) > 0).astype(float)
    return reverb(gong * lp(ham, 400) * env(n, 0.01, 0.4), 1.2, 0.25)


def crinkle(secs=1.2):
    n = n_(secs); x = np.zeros(n)
    for i in rng.integers(0, n - 2000, int(160 * secs)):
        L = rng.integers(100, 1500); x[i:i + L] += hp(rng.standard_normal(L), 2500) * np.exp(-np.linspace(0, 5, L)) * rng.uniform(0.2, 1)
    return x * env(n, 0.02, 0.2)


def hum(secs=6.0, f=50):
    n = n_(secs)
    return (sine(f, n) * 0.6 + sine(f * 2, n) * 0.3 + sine(f * 3, n) * 0.1) * env(n, 0.5, 0.5) + 0.03 * lp(rng.standard_normal(n), 500)


def rip(secs=0.8):
    n = n_(secs)
    return np.tanh(hp(rng.standard_normal(n), 600) * np.exp(-np.linspace(0, 6, n)) * 3) * 0.7 + sine(np.linspace(180, 60, n), n) * np.exp(-np.linspace(0, 8, n))


def shimmer(secs=2.5):
    n = n_(secs)
    x = sum(sine(f, n) * np.exp(-np.linspace(0, 3 + k, n)) for k, f in enumerate([1318, 1760, 2093, 2637]))
    return reverb(x * env(n, 0.02, 0.6), 2.5, 0.45)


def car_pass(secs=3.0):
    n = n_(secs); u = np.linspace(-1, 1, n)
    amp = 1 / (1 + 12 * u ** 2)
    return lp(rng.standard_normal(n), 900) * amp * 2 + sine(90 - 25 * np.tanh(u * 3), n) * amp * 0.5


EFFECTS = {"sizzle": sizzle(), "steam": steam(), "drill": drill(), "hit": hit(), "riser": riser(), "riser_long": riser(3.5),
           "whoomp": whoomp(), "pop_hi": pop(f0=1100), "pop_lo": pop(f0=700), "tick": tick(), "beep": beep(),
           "monitor": monitor(), "monitor_fast": monitor(4.0, 110), "buzz": buzz(0.9), "bell_ring": bell_ring(), "crinkle": crinkle(),
           "hum": hum(), "rip": rip(), "shimmer": shimmer(), "car_pass": car_pass()}


def save(path, x):
    x = np.asarray(x, np.float32); x = x / (np.abs(x).max() + 1e-9) * 0.89
    st = np.stack([x, x], 1)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(path)], input=st.tobytes(), check=True)


if __name__ == "__main__":
    out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    for k, v in EFFECTS.items():
        save(out / f"{k}.wav", v)
    print(len(EFFECTS), "effects ->", out)
