"""Short 2 (Bean) synthesised effects the library lacks -> episodes/02_rat_bounty/sfx_bean/*.wav (48 kHz stereo).
squeak1-4: short high rat chirps (a fast pitch sweep with a little vibrato and breath); snip: a scissor snip (two
metallic clicks with a short shear); scurry: a patter of tiny feet (a few seconds, loopable); bubble: toilet water
gurgle before the rat pops out. Pure numpy, nothing downloaded.
Usage: python3 -I episodes/02_rat_bounty/sfx_bean.py
"""
import pathlib, subprocess
import numpy as np

SR = 48000
OUT = pathlib.Path(__file__).resolve().parent / "sfx_bean"
rng = np.random.default_rng(7)
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

def squeak(dur, f0, f1, f2, vib, seed):
    r = np.random.default_rng(seed); t = t_(dur); u = t / dur
    f = f0 + (f1 - f0) * np.sin(np.pi * np.minimum(1, u * 1.6)) + (f2 - f1) * np.maximum(0, u - 0.6) / 0.4
    f = f * (1 + 0.025 * np.sin(2 * np.pi * vib * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = np.sin(np.pi * u) ** 0.6 * np.exp(-u * 1.2)
    tone = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    breath = bp(r.standard_normal(len(t)), 3000, 9000) * 0.12
    return (tone + breath) * env

for i, (d, a, b, c, v) in enumerate([(0.16, 2600, 4200, 3300, 38), (0.11, 3100, 4600, 3800, 45), (0.22, 2400, 3800, 2900, 30), (0.13, 3400, 5000, 4200, 50)]):
    # a double chirp for variants 1 and 3
    x = squeak(d, a, b, c, v, i)
    if i in (0, 2):
        y = squeak(d * 0.7, a * 1.1, b * 1.08, c * 1.1, v, i + 10)
        x = np.concatenate([x, np.zeros(int(0.04 * SR)), y])
    save(f"squeak{i + 1}", x)

# the snip: blade clicks at 0 and 0.06 s, a short bright shear between
t = t_(0.3)
click = lambda t0, f: np.where(t >= t0, (np.sin(2 * np.pi * f * (t - t0)) + 0.5 * np.sin(2 * np.pi * f * 2.7 * (t - t0))) * np.exp(-(t - t0) * 90), 0)
shear = bp(rng.standard_normal(len(t)), 4000, 12000) * np.exp(-((t - 0.035) / 0.02) ** 2) * 0.8
save("snip", click(0.0, 3200) + click(0.06, 4100) * 1.2 + shear)

# scurrying feet: random tiny taps, ~28 a second, 3 s
t = t_(3.0); x = np.zeros(len(t))
for k in range(int(3.0 * 28)):
    t0 = k / 28 + rng.uniform(-0.012, 0.012)
    i0 = int(max(0, t0) * SR); n = int(0.025 * SR)
    seg = bp(rng.standard_normal(n), 1500, 7000) * np.exp(-np.arange(n) / SR * 260) * rng.uniform(0.4, 1.0)
    x[i0:i0 + n] += seg[: len(x) - i0]
save("scurry", x * (0.85 + 0.15 * np.sin(2 * np.pi * 0.7 * t)), 0.9)

# a toilet gurgle: bubbly low blips
t = t_(0.9); x = np.zeros(len(t))
for k in range(9):
    t0 = 0.05 + k * 0.09 + rng.uniform(-0.02, 0.02); f = rng.uniform(250, 520)
    tt = np.maximum(0, t - t0); x += np.where(t >= t0, np.sin(2 * np.pi * (f + 900 * tt) * tt) * np.exp(-tt * 35), 0)
save("bubble", lp(x, 2500))
print("wrote", sorted(p.name for p in OUT.glob("*.wav")))
