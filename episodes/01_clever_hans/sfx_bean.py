"""Short 1 (Bean) synthesised effects the library lacks -> episodes/01_clever_hans/sfx_bean/*.wav (48 kHz stereo).
hoof1-3: a crisp hollow hoof clop on cobbles; snort: a horse's proud nostril snort; drop: a soft falling 'whoomp' when
the watchers relax; lift: a tiny rising blip for the head lift. Pure numpy, nothing downloaded.
Usage: python3 -I episodes/01_clever_hans/sfx_bean.py
"""
import pathlib, subprocess
import numpy as np

SR = 48000
OUT = pathlib.Path(__file__).resolve().parent / "sfx_bean"
rng = np.random.default_rng(4)
t_ = lambda s: np.arange(int(s * SR)) / SR

def lp(x, fc):
    k = max(1, int(SR / (2 * np.pi * fc))); w = np.ones(k) / k
    return np.convolve(np.convolve(x, w, "same"), w, "same")

def bp(x, lo, hi): return lp(x, hi) - lp(x, lo)

def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    st = np.stack([x, x * 0.97], 1).astype(np.float32)
    OUT.mkdir(exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(OUT / f"{name}.wav")], input=st.tobytes(), check=True)

def hoof(seed, pitch):
    r = np.random.default_rng(seed); t = t_(0.22)
    knock = (np.sin(2 * np.pi * pitch * t) * 0.8 + np.sin(2 * np.pi * pitch * 2.37 * t) * 0.35) * np.exp(-t * 55)
    thump = np.sin(2 * np.pi * 150 * t * (1 - 0.3 * t)) * np.exp(-t * 30) * 0.9
    click = bp(r.standard_normal(len(t)), 1800, 6000) * np.exp(-t * 260) * 2.2
    grit = bp(r.standard_normal(len(t)), 400, 2500) * np.exp(-t * 70) * 0.35
    return knock + thump + click + grit

for i, p in enumerate([720, 800, 760]): save(f"hoof{i + 1}", hoof(i + 3, p))

t = t_(0.6)
pulse = np.exp(-((t - 0.08) / 0.05) ** 2) + 0.8 * np.exp(-((t - 0.3) / 0.09) ** 2)
snort = bp(rng.standard_normal(len(t)), 250, 1600) * pulse
snort += np.sin(2 * np.pi * 55 * t) * pulse * 0.3 * (rng.standard_normal(len(t)) * 0.3 + 1)
save("snort", snort)

t = t_(0.7)
f = 520 * np.exp(-t * 3.2) + 90
drop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) * np.minimum(1, t / 0.02)
save("drop", drop + lp(rng.standard_normal(len(t)), 300) * np.exp(-t * 6) * 0.3)

t = t_(0.25)
f = 500 + 900 * t / 0.25
save("lift", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / 0.25) ** 2)
print("wrote", sorted(p.name for p in OUT.glob("*.wav")))
