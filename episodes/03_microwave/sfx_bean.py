"""Short 3 (Bean) synthesised effects the library lacks -> episodes/03_microwave/sfx_bean/*.wav (48 kHz stereo).
hum: a low electric radar-tube hum (60 Hz mains with harmonics, a crackly buzz, 4 s loopable); popcorn: a rapid burst
of kernels popping (1.6 s); wobble: an egg rocking on a stand (little ceramic rattles); splat: a wet egg splat; ding: a
microwave-oven ding; turntable: a whirring microwave (motor whirr + fan); clank: a factory metal clank; zap: a bright
electric wave sweep for the microwaves firing. Pure numpy, nothing downloaded.
Usage: python3 -I episodes/03_microwave/sfx_bean.py
"""
import pathlib, subprocess
import numpy as np

SR = 48000
OUT = pathlib.Path(__file__).resolve().parent / "sfx_bean"
rng = np.random.default_rng(3)
t_ = lambda s: np.arange(int(s * SR)) / SR

def lp(x, fc):
    k = max(1, int(SR / (2 * np.pi * fc))); w = np.ones(k) / k
    return np.convolve(np.convolve(x, w, "same"), w, "same")

def bp(x, lo, hi): return lp(x, hi) - lp(x, lo)

def save(name, x, width=0.97):
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    st = np.stack([x, x * width], 1).astype(np.float32)
    OUT.mkdir(exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(OUT / f"{name}.wav")], input=st.tobytes(), check=True)

# hum: 60 Hz + harmonics, slow wobble, a little crackle
t = t_(4.0)
x = sum(a * np.sin(2 * np.pi * 60 * k * t + k) for k, a in [(1, 1.0), (2, 0.6), (3, 0.35), (4, 0.2), (6, 0.12), (8, 0.06)])
x *= 1 + 0.08 * np.sin(2 * np.pi * 0.5 * t)
x += bp(rng.standard_normal(len(t)), 2000, 6000) * 0.04 * (rng.random(len(t)) < 0.002).astype(float).cumsum() % 2
save("hum", x)

# popcorn: ~40 pops in 1.6 s, density rising then falling
t = t_(1.8); x = np.zeros(len(t))
for k in range(46):
    t0 = 1.5 * rng.beta(2, 2.2); i0 = int(t0 * SR); n = int(0.05 * SR)
    f = rng.uniform(600, 1800); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) * 0.6 + bp(rng.standard_normal(n), 800, 7000)) * np.exp(-tt * rng.uniform(70, 140)) * rng.uniform(0.4, 1.0)
    x[i0:i0 + n] += s[: len(x) - i0]
save("popcorn", x, 0.85)

# wobble: little ceramic rattles, quickening
t = t_(1.2); x = np.zeros(len(t)); tk = 0.0; k = 0
while tk < 1.15:
    i0 = int(tk * SR); n = int(0.03 * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * 2400 * tt) + 0.5 * np.sin(2 * np.pi * 3700 * tt)) * np.exp(-tt * 160) * (0.4 + 0.6 * tk)
    x[i0:i0 + n] += s[: len(x) - i0]; k += 1; tk += max(0.035, 0.16 - k * 0.012)
save("wobble", x)

# splat: a wet burst (low thump + gooey noise with a downward squelch)
t = t_(0.6)
thump = np.sin(2 * np.pi * (120 - 60 * t) * t) * np.exp(-t * 18)
goo = lp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 9) * (1 + 0.6 * np.sin(2 * np.pi * 30 * t))
sq = np.sin(2 * np.pi * np.cumsum(700 - 500 * np.minimum(1, t / 0.25)) / SR) * np.exp(-((t - 0.12) / 0.08) ** 2) * 0.4
save("splat", thump * 0.9 + goo * 0.8 + sq)

# microwave ding: a bell partial stack at 1760 Hz
t = t_(1.8)
x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in [(1760, 1.0, 2.2), (4420, 0.35, 4.0), (2640, 0.25, 3.0), (7040, 0.08, 7.0)])
x *= np.minimum(1, t / 0.003)
save("ding", x)

# turntable: motor whirr (~120 Hz + 240) and fan noise, 3 s loopable
t = t_(3.0)
x = 0.5 * np.sin(2 * np.pi * 118 * t) + 0.3 * np.sin(2 * np.pi * 236 * t) + 0.15 * np.sin(2 * np.pi * 354 * t)
x += lp(rng.standard_normal(len(t)), 900) * 0.5
save("turntable", x * (1 + 0.05 * np.sin(2 * np.pi * 0.33 * t)))

# clank: metal plate struck (inharmonic partials)
t = t_(1.2)
x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in [(310, 1.0, 5), (857, 0.7, 7), (1530, 0.5, 9), (2410, 0.35, 12), (3700, 0.2, 16)])
x += bp(rng.standard_normal(len(t)), 1000, 8000) * np.exp(-t * 60) * 0.6
save("clank", x)

# zap: a bright sweeping wave tone with tremolo (microwaves firing)
t = t_(1.0)
ph = 2 * np.pi * np.cumsum(500 + 1600 * t + 200 * np.sin(2 * np.pi * 9 * t)) / SR
x = np.sin(ph) * (0.6 + 0.4 * np.sin(2 * np.pi * 18 * t)) * np.sin(np.pi * t) ** 0.5
save("zap", x)
print("wrote", sorted(p.name for p in OUT.glob("*.wav")))
