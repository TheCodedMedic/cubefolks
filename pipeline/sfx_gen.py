"""Synthesised effects for a 3D episode's cue sheet -> episodes/<name>/sfx_gen/<name>.wav (48 kHz stereo).

Usage: python3 -I pipeline/sfx_gen.py episodes/<name> [name ...]
Without names: every effect. The definitions and the random seeds are the ones Episode 04's m1_audio.py / film_audio.py
used (same order, same output), so the committed cue sheets of Episodes 04 and 05 mix as they did; `suck` and `rewind`
(Part 2's cold-open rewind) are re-synthesised approximations: their originals were never committed.
Rules: every sound is vectorised numpy except the one filter sweep; nothing is downloaded.
"""
import pathlib
import subprocess
import sys

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


# ─── tools (as in episodes/04_go_back_in_time/m1_audio.py) ────────────────────
def lp_fast(x, fc):
    n = max(1, int(SR / (2 * np.pi * fc)))
    k = np.ones(n) / n
    return np.convolve(np.convolve(x, k, "same"), k, "same")


def hp_fast(x, fc):
    return x - lp_fast(x, fc)


def env(n, a, r, sus=1.0):
    e = np.ones(n) * sus
    na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, sus, na)
    if nr: e[-nr:] = e[-nr:] * np.linspace(1, 0, nr) ** 2
    return e


def reverb(x, secs=2.2, mix=0.3):
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-np.linspace(0, 7, n))
    ir = lp_fast(ir, 6000); ir /= np.abs(ir).sum() ** 0.5 * 4
    y = np.fft.irfft(np.fft.rfft(x, len(x) + n) * np.fft.rfft(ir, len(x) + n))[: len(x)]
    return x * (1 - mix) + y * mix


def saw(f, n, ph=0.0):
    t = np.arange(n) / SR
    return 2 * ((f * t + ph) % 1.0) - 1


def sine(f, n):
    if np.ndim(f) == 0: return np.sin(2 * np.pi * f * np.arange(n) / SR)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# ─── the first-minute set (m1_audio.py, seed 7) ──────────────────────────────
def crackle(secs=1.2):
    n = int(secs * SR); x = np.zeros(n)
    for _ in range(int(140 * secs)):
        i = rng.integers(0, n - 2000); L = rng.integers(80, 1800)
        x[i:i + L] += rng.standard_normal(L) * np.exp(-np.linspace(0, 6, L)) * rng.uniform(0.3, 1)
    buzz = saw(110, n) * 0.15 * (rng.random(n) > 0.6)
    return hp_fast(x + buzz, 900) * env(n, 0.01, 0.2)


def thunder(secs=5.0):
    n = int(secs * SR); x = rng.standard_normal(n)
    crack = hp_fast(x[: int(0.25 * SR)], 1500) * np.exp(-np.linspace(0, 5, int(0.25 * SR)))
    roll = lp_fast(x, 140) * env(n, 0.05, 3.5) * (1 + 0.5 * np.sin(np.arange(n) / SR * 9))
    roll[: len(crack)] += crack * 3
    return reverb(roll, 3, 0.35)


def freeze_whoosh(secs=1.6):
    n = int(secs * SR); f = np.linspace(2200, 120, n)
    x = rng.standard_normal(n); y = np.zeros(n); s = 0.0
    a = np.exp(-2 * np.pi * f / SR)
    for i in range(n): s = a[i] * s + (1 - a[i]) * x[i]; y[i] = s
    tone = sine(np.linspace(880, 220, n), n) * 0.2
    return reverb((y * 3 + tone) * env(n, 0.02, 0.9), 2.5, 0.45)


def tear(secs=3.0):
    n = int(secs * SR)
    rise_n = int(0.6 * SR)
    rise = hp_fast(rng.standard_normal(rise_n), 2000) * np.linspace(0, 1, rise_n) ** 3
    boom = sine(np.linspace(90, 28, n), n) * np.exp(-np.linspace(0, 4, n)) * 1.6
    burst = rng.standard_normal(n) * np.exp(-np.linspace(0, 12, n)) * 0.8
    x = np.zeros(n + rise_n); x[:rise_n] += rise; x[rise_n:] += boom + burst
    return reverb(np.tanh(x * 1.4), 2.8, 0.35)


def tunnel_roar(secs=9.0):
    n = int(secs * SR); x = rng.standard_normal(n)
    y = lp_fast(x, 400) * 2 + hp_fast(lp_fast(x, 3000), 900) * 0.4
    wob = 1 + 0.3 * np.sin(np.arange(n) / SR * 2 * np.pi * 0.7)
    return y * wob * env(n, 0.3, 1.0)


def zap(secs=0.6):
    n = int(secs * SR)
    return (saw(np.linspace(1800, 200, n).mean(), n) * 0.3 + hp_fast(rng.standard_normal(n), 3000)) * np.exp(-np.linspace(0, 8, n))


def hit(secs=3.5):
    n = int(secs * SR)
    sub = sine(np.linspace(60, 34, n), n) * np.exp(-np.linspace(0, 3, n))
    body = lp_fast(rng.standard_normal(n), 900) * np.exp(-np.linspace(0, 9, n)) * 2
    return reverb(np.tanh((sub * 1.8 + body) * 1.3), 3.0, 0.3)


# ─── the film set (film_audio.py, seed 11) ───────────────────────────────────
def screech(secs=1.6):
    n = int(secs * SR); f = np.linspace(2600, 1400, n)
    x = sine(f, n) * 0.4 + sine(f * 1.51, n) * 0.25 + hp_fast(rng.standard_normal(n), 2500) * 0.35
    return x * env(n, 0.05, 0.5) * (1 + 0.3 * np.sin(np.arange(n) / SR * 2 * np.pi * 23))


def passby(secs=2.6):
    n = int(secs * SR); u = np.linspace(-1, 1, n)
    amp = 1 / (1 + 12 * u * u); f = 70 + 30 * np.tanh(-u * 3)
    return (saw(80, n) * 0.4 + lp_fast(rng.standard_normal(n), 600)) * amp + sine(f, n) * amp * 0.3


def whistle(secs=0.7):
    n = int(secs * SR)
    return (sine(2900, n) + 0.3 * sine(2950, n)) * (1 + 0.5 * np.sin(np.arange(n) / SR * 2 * np.pi * 40)) * env(n, 0.01, 0.15)


def bell(f=392, secs=4.0):
    n = int(secs * SR)
    return sum(sine(f * k, n) * a for k, a in [(1, 1), (2.76, 0.5), (5.4, 0.25)]) * np.exp(-np.linspace(0, 5, n))


def tick():
    n = int(0.05 * SR)
    return hp_fast(rng.standard_normal(n), 3000) * np.exp(-np.linspace(0, 30, n))


# ─── Part 2's rewind (re-synthesised; the originals were not committed) ───────
def suck(secs=1.3):
    """The world being pulled backwards: a rising, tightening noise sweep that cuts off (the freeze whoosh, reversed in pitch)."""
    n = int(secs * SR); u = np.linspace(0, 1, n); f = 150 + 5000 * u ** 2
    x = rng.standard_normal(n); y = np.zeros(n); s = 0.0
    a = np.exp(-2 * np.pi * f / SR)
    for i in range(n): s = a[i] * s + (1 - a[i]) * x[i]; y[i] = s
    tone = sine(np.linspace(110, 1400, n), n) * 0.15 * u
    return reverb((y * 3 + tone) * (0.1 + 0.9 * u ** 1.5) * env(n, 0.05, 0.03), 1.4, 0.2)


def rewind(secs=1.6):
    """A tape rewind: warbling pitch sweeping up with hiss, a stop click at the end."""
    n = int(secs * SR); u = np.linspace(0, 1, n)
    f = 320 * (1 + 6 * u ** 1.6) * (1 + 0.06 * np.sin(2 * np.pi * 11 * u * secs) + 0.02 * np.sin(2 * np.pi * 47 * u * secs))
    x = sine(f, n) * 0.35 + sine(f * 2.02, n) * 0.12
    hiss = hp_fast(rng.standard_normal(n), 2500) * 0.25 * (0.4 + 0.6 * u)
    click_n = int(0.03 * SR); click = hp_fast(rng.standard_normal(click_n), 1800) * np.exp(-np.linspace(0, 12, click_n))
    y = (x + hiss) * env(n, 0.02, 0.08); y[-click_n:] += click * 0.8
    return y


ORDER_A = [("crackle", lambda: crackle()), ("crackle_long", lambda: crackle(3.5)), ("thunder", thunder), ("freeze", freeze_whoosh),
           ("tear", tear), ("tunnel", tunnel_roar), ("zap", zap), ("hit", hit)]
ORDER_B = [("screech", screech), ("passby", passby), ("whistle", whistle), ("bell", lambda: reverb(bell(), 3, 0.4)), ("tick", tick)]
ORDER_C = [("suck", suck), ("rewind", rewind)]
NAMES = [k for k, _ in ORDER_A + ORDER_B + ORDER_C]


def save(path, x):
    x = np.asarray(x, np.float32); x = x / (np.abs(x).max() + 1e-9) * 0.89
    st = np.stack([x, x], 1)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(path)], input=st.astype(np.float32).tobytes(), check=True)


def main(ep, want):
    global rng
    out = pathlib.Path(ep) / "sfx_gen"; out.mkdir(parents=True, exist_ok=True)
    made = []
    for seed, order in ((7, ORDER_A), (11, ORDER_B), (23, ORDER_C)):
        rng = np.random.default_rng(seed)
        for name, fn in order:          # the whole group runs so the random stream matches the originals
            x = fn()
            if not want or name in want:
                save(out / f"{name}.wav", x); made.append(name)
    print(len(made), "effects ->", out, ":", " ".join(made))


if __name__ == "__main__":
    main(sys.argv[1], set(sys.argv[2:]))
