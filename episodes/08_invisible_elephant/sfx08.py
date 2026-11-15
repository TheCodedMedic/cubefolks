"""Short 08 "The Invisible Elephant": our own synthesised sounds (numpy). Original, claim-free.

Usage: python3 -I episodes/08_invisible_elephant/sfx08.py   -> episodes/08_invisible_elephant/sfx_gen/*.wav

- scheme_bed: the music. An original sneaky-comedy tune ("the scheme"): pizzicato bass walking in C minor, a staccato
  marimba-ish melody, a soft shaker; 112 bpm, 44 s. Melody and harmony written here (no existing tune).
- kaching: a cash-register ka-ching (bell + drawer clunk), ours.
"""
import pathlib
import subprocess

import numpy as np

SR = 48000
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "sfx_gen"
rng = np.random.default_rng(8)

BPM = 112
BEAT = 60 / BPM
LEN = 44.0


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def pluck(f, dur, bright=1.0, decay=7.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.35 * bright * np.sin(4 * np.pi * f * t) + 0.12 * bright * np.sin(6 * np.pi * f * t)
    e = np.exp(-t * decay) * np.minimum(1, t / 0.004)
    return x * e


def marimba(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 3.99 * t) * np.exp(-t * 30) + 0.1 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 60)
    return x * np.exp(-t * 9) * np.minimum(1, t / 0.002)


def shaker(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    w = rng.standard_normal(n)
    w = w - np.convolve(w, np.ones(6) / 6, "same")  # bright
    return w * np.exp(-t * 40) * np.minimum(1, t / 0.006)


def place(buf, x, t, g):
    i = int(t * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    buf[i:i + len(x)] += g * x


def scheme_bed():
    n = int(LEN * SR)
    bass, mel, perc = np.zeros(n), np.zeros(n), np.zeros(n)
    # C minor, 4 bars per phrase: i - iv - V - i, walking pizzicato (on the beats, a sneaky step-down on 4)
    C, F, G, Ab, Eb, D, Bb, B = 48, 53, 55, 56, 51, 50, 46, 47
    bars = [[C, G - 12, C, B - 12], [F - 12, C, F - 12, Ab - 12], [G - 12, D, G - 12, B - 12], [C, Eb, D, B - 12],
            [Ab - 12, Eb, Ab - 12, G - 12], [F - 12, C, Ab - 12, G - 12], [G - 12, B - 12, D, G - 12], [C, G - 12, C, C]]
    # melody (8 bars, eighths; None = rest): tiptoe up, a cheeky leap, a "ta-da" turn
    mel_bars = [
        [72, None, 75, None, 74, 72, None, 71], [72, None, 77, None, 75, 74, None, None],
        [74, None, 79, None, 77, 75, 74, None], [72, 71, 72, None, 67, None, None, None],
        [75, None, 80, None, 79, 77, None, 75], [77, None, 75, 74, 72, None, 74, None],
        [71, None, 74, None, 79, None, 77, 74], [72, None, 67, None, 72, None, None, None],
    ]
    t, bar = 0.0, 0
    while t < LEN:
        b = bars[bar % 8]
        for k, m in enumerate(b):
            place(bass, pluck(hz(m), BEAT * 0.9, 0.8, 6.5), t + k * BEAT, 0.9)
        for k, m in enumerate(mel_bars[bar % 8]):
            if m is not None and bar >= 1:  # the bass walks in alone for one bar
                place(mel, marimba(hz(m), BEAT * 0.9), t + k * BEAT / 2, 0.42)
        for k in range(8):
            place(perc, shaker(0.08), t + k * BEAT / 2, 0.10 if k % 2 else 0.05)
        t += 4 * BEAT; bar += 1
    x = bass * 0.9 + mel + perc
    # a light room
    rv = np.zeros_like(x)
    for d, g in [(0.031, 0.25), (0.067, 0.18), (0.113, 0.12), (0.171, 0.08)]:
        k = int(d * SR); rv[k:] += g * x[:-k]
    x = x + 0.5 * rv
    st = np.stack([x * 0.98 + 0.02 * np.roll(x, 240), x], axis=1)
    return st / np.abs(st).max() * 0.7


def kaching():
    n = int(1.4 * SR); t = np.arange(n) / SR
    clunk = rng.standard_normal(n) * np.exp(-t * 60) * 0.5
    clunk = np.convolve(clunk, np.ones(30) / 30, "same") * 6
    bell = np.zeros(n)
    for f, g in [(2093, 1.0), (2637, 0.6), (4186, 0.35), (5274, 0.2)]:
        on = (t > 0.12)
        bell += g * np.sin(2 * np.pi * f * (t - 0.12)) * np.exp(-np.maximum(0, t - 0.12) * 4.5) * on
    x = clunk + 0.6 * bell
    return np.stack([x, x], axis=1) / np.abs(x).max() * 0.8


def save(name, x):
    OUT.mkdir(exist_ok=True)
    raw = (np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", str(OUT / f"{name}.wav")], input=raw, check=True)


if __name__ == "__main__":
    save("scheme_bed", scheme_bed())
    save("kaching", kaching())
    print("wrote", sorted(p.name for p in OUT.glob("*.wav")))
