"""Blocky test synthesised effects -> episodes/90_blocky_test/sfx_blocky/*.wav (48 kHz stereo, pure numpy).
knock: one slow heavy knock on a wooden door (a low body thump, a knuckle crack, a short panel ring);
whoosh_soft: a soft airy cut whoosh (band-swept noise, 0.45 s); crickets: a night cricket bed (chirp trains, 6 s, loops).
Usage: python3 -I episodes/90_blocky_test/sfx_blocky.py
"""
import pathlib, subprocess
import numpy as np

SR = 48000
OUT = pathlib.Path(__file__).resolve().parent / "sfx_blocky"
rng = np.random.default_rng(90)
t_ = lambda s: np.arange(int(s * SR)) / SR

def lp(x, fc):
    k = max(1, int(SR / (2 * np.pi * fc))); w = np.ones(k) / k
    return np.convolve(np.convolve(x, w, "same"), w, "same")
def bp(x, lo, hi): return lp(x, hi) - lp(x, lo)
def save(name, x, width=0.95):
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    st = np.stack([x, x * width], 1).astype(np.float32)
    OUT.mkdir(exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(OUT / f"{name}.wav")], input=st.tobytes(), check=True)

# knock: heavy, slow, wooden
t = t_(0.6)
body = np.sin(2 * np.pi * (95 - 25 * t) * t) * np.exp(-t * 14) * 1.0
panel = (np.sin(2 * np.pi * 230 * t) * 0.5 + np.sin(2 * np.pi * 410 * t) * 0.25) * np.exp(-t * 26)
crack = bp(rng.standard_normal(len(t)), 400, 3500) * np.exp(-t * 160) * 0.9
save("knock", lp(body + panel + crack, 5000))

# whoosh_soft: noise swept up then down through a band, gentle swell
t = t_(0.45); u = t / 0.45; env = np.sin(np.pi * u) ** 2
n = rng.standard_normal(len(t))
x = bp(n, 300, 1200) * (1 - u) + bp(n, 900, 3500) * u
save("whoosh_soft", x * env)

# crickets: a few crickets, each a train of 4.6 kHz-ish chirps (pulse groups), at different rates and levels
t = t_(6.0); x = np.zeros(len(t))
for f0, rate, lvl, ph in [(4600, 2.1, 1.0, 0.0), (4300, 1.7, 0.6, 0.3), (5000, 2.6, 0.4, 0.7)]:
    car = np.sin(2 * np.pi * f0 * t)
    pulses = (np.sin(2 * np.pi * 45 * t) > 0.2).astype(float)          # the wing-rub pulses inside a chirp
    chirp = ((t * rate + ph) % 1.0 < 0.18).astype(float)               # chirp on/off
    x += car * lp(pulses * chirp, 400) * lvl
x += bp(rng.standard_normal(len(t)), 200, 1500) * 0.03                  # a little night air
save("crickets", x, width=0.8)
print("wrote", sorted(p.name for p in OUT.glob("*.wav")))
