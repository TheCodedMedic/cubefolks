"""Short 4 (pacemaker) synthesised effects the library lacks -> episodes/04_pacemaker/sfx_bean/*.wav (48 kHz stereo).
sizzle: a soldering-iron sizzle (filtered noise crackle, 1.2 s); click: a chunky toggle-switch click; tick: the electric
pulse 'tick' (a short bright zap with a low thump, lands on every blip); beep: a 1950s heart-monitor beep (sine 1 kHz,
0.12 s); zap: a small spark (a crackling sweep); thunk: a power-cut thunk with a falling hum. Pure numpy, nothing downloaded.
Usage: python3 -I episodes/04_pacemaker/sfx_bean.py
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
def save(name, x, width=0.97):
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    st = np.stack([x, x * width], 1).astype(np.float32)
    OUT.mkdir(exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", str(OUT / f"{name}.wav")], input=st.tobytes(), check=True)

# sizzle: hiss + random crackles, swelling then fading
t = t_(1.2); env = np.minimum(1, t / 0.08) * np.exp(-np.maximum(0, t - 0.6) * 4)
hiss = bp(rng.standard_normal(len(t)), 2500, 11000) * 0.5
crack = np.zeros(len(t))
for k in range(70):
    i0 = int(rng.uniform(0, 1.15) * SR); n = int(0.004 * SR)
    crack[i0:i0 + n] += rng.standard_normal(n) * rng.uniform(0.5, 1.5)
save("sizzle", (hiss + bp(crack, 1500, 9000)) * env)

# click: two sharp transients 25 ms apart with a body resonance
t = t_(0.15)
c = lambda t0, f, a: np.where(t >= t0, a * np.sin(2 * np.pi * f * (t - t0)) * np.exp(-(t - t0) * 160), 0)
n = bp(rng.standard_normal(len(t)), 2000, 10000) * np.exp(-t * 300)
save("click", c(0, 1800, 1) + c(0.025, 2600, 0.7) + c(0, 180, 0.6) + n * 0.6)

# tick: the pulse — a bright 'tsk' zap and a soft low thump
t = t_(0.25)
zap = bp(rng.standard_normal(len(t)), 3000, 12000) * np.exp(-t * 90)
ping = np.sin(2 * np.pi * (2400 - 3000 * t) * t) * np.exp(-t * 60)
thump = np.sin(2 * np.pi * 90 * t) * np.exp(-t * 25)
save("tick", zap * 0.8 + ping * 0.6 + thump * 0.9)

# beep: a monitor beep
t = t_(0.16); env = np.minimum(1, t / 0.005) * np.minimum(1, (0.16 - t) / 0.02)
save("beep", (np.sin(2 * np.pi * 1000 * t) + 0.2 * np.sin(2 * np.pi * 2000 * t)) * env)

# zap: a crackling electric sweep (spark)
t = t_(0.5); f = 600 + 2600 * t
buzz = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.4
crk = bp(rng.standard_normal(len(t)), 2000, 12000) * (rng.random(len(t)) > 0.97) * 3
save("zap", lp(buzz, 6000) * np.exp(-t * 6) + crk * np.exp(-t * 5) + bp(rng.standard_normal(len(t)), 4000, 12000) * np.exp(-t * 8) * 0.4)

# thunk: a relay/breaker thunk and a mains hum winding down
t = t_(1.3)
th = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 18) + bp(rng.standard_normal(len(t)), 200, 2000) * np.exp(-t * 60) * 0.8
hf = 120 * np.maximum(0.2, 1 - t / 1.1)
hum = (np.sin(2 * np.pi * np.cumsum(hf) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(hf) / SR)) * np.exp(-t * 2.5) * 0.4
save("thunk", th + hum)
print("wrote", sorted(p.name for p in OUT.glob("*.wav")))
