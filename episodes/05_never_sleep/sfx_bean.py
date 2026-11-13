"""Short 5 (never slept) synthesised effects the library lacks -> episodes/05_never_sleep/sfx_bean/*.wav (48 kHz stereo).
whistle: a coach's pea whistle blast (a trilled 2.9 kHz tone, 0.7 s); bounce: one basketball bounce (a hollow low thump
with a rubbery ring); flipper: a pinball flipper clack (solenoid thunk + plastic click); pinbell: pinball bells (three
quick bright bell dings); yawn: a yawn-like swoosh (a rising then sinking breathy filtered sweep, 1.2 s); switch: a big
light-switch click; snore: a long cartoon snore (a rattling inhale and a whistling exhale, 2.4 s). Pure numpy.
Usage: python3 -I episodes/05_never_sleep/sfx_bean.py
"""
import pathlib, subprocess
import numpy as np

SR = 48000
OUT = pathlib.Path(__file__).resolve().parent / "sfx_bean"
rng = np.random.default_rng(5)
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
osc = lambda f: np.sin(2 * np.pi * np.cumsum(f) / SR)

# whistle: pea trill (amplitude + pitch wobble at ~28 Hz), breathy noise, sharp attack, short tail
t = t_(0.75); env = np.minimum(1, t / 0.02) * np.minimum(1, (0.75 - t) / 0.08)
trill = 0.55 + 0.45 * np.sin(2 * np.pi * 28 * t)
f = 2900 + 120 * np.sin(2 * np.pi * 28 * t)
save("whistle", (osc(f) + 0.25 * osc(2 * f)) * trill * env + bp(rng.standard_normal(len(t)), 2000, 6000) * env * 0.25)

# bounce: a basketball on a wooden floor
t = t_(0.35)
th = np.sin(2 * np.pi * (140 - 60 * t) * t) * np.exp(-t * 22)
ring = np.sin(2 * np.pi * 420 * t) * np.exp(-t * 35) * 0.35 + np.sin(2 * np.pi * 760 * t) * np.exp(-t * 50) * 0.15
slap = bp(rng.standard_normal(len(t)), 800, 5000) * np.exp(-t * 200) * 0.6
save("bounce", th + ring + slap)

# flipper: solenoid thunk + plastic clack
t = t_(0.2)
save("flipper", np.sin(2 * np.pi * 110 * t) * np.exp(-t * 40) + bp(rng.standard_normal(len(t)), 1500, 9000) * np.exp(-t * 180) * 0.9 + np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 120) * 0.3)

# pinbell: three quick bell dings (inharmonic partials)
t = t_(1.0); x = np.zeros(len(t))
for k, (t0, f0) in enumerate([(0, 1568), (0.09, 2093), (0.18, 2637)]):
    tt = np.maximum(0, t - t0); on = t >= t0
    x += on * sum(a * np.sin(2 * np.pi * f0 * m * tt) for m, a in [(1, 1), (2.76, 0.4), (5.4, 0.2)]) * np.exp(-tt * 7)
save("pinbell", x)

# yawn: breathy filtered noise swelling up in pitch then sinking
t = t_(1.2); env = np.sin(np.pi * t / 1.2) ** 1.5
n = rng.standard_normal(len(t))
lo = lp(n, 900) * (1 - t / 1.2) + bp(n, 600, 2200) * (t / 1.2)
tone = osc(260 + 140 * np.sin(np.pi * t / 1.2) - 90 * t) * 0.18
save("yawn", (lo * 1.4 + tone) * env)

# switch: a big light switch (a snap with a body thunk)
t = t_(0.15)
c = lambda t0, f, a: np.where(t >= t0, a * np.sin(2 * np.pi * f * (t - t0)) * np.exp(-(t - t0) * 140), 0)
save("switch", c(0, 2400, 1) + c(0.012, 3400, 0.6) + c(0, 160, 0.8) + bp(rng.standard_normal(len(t)), 2000, 10000) * np.exp(-t * 260) * 0.7)

# snore: a rattling inhale (low buzzy noise) then a whistling exhale
t = t_(2.4); x = np.zeros(len(t))
inh = (t < 1.2); u = t / 1.2
rattle = (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 32 * t))) * bp(rng.standard_normal(len(t)), 80, 900)
x += inh * rattle * np.sin(np.pi * np.clip(u, 0, 1)) * 1.2
v = np.clip((t - 1.3) / 1.0, 0, 1); exh = (t >= 1.3) & (t < 2.3)
x += exh * (osc(900 + 500 * v) * 0.35 + bp(rng.standard_normal(len(t)), 1000, 4000) * 0.4) * np.sin(np.pi * v)
save("snore", x)
print("wrote", sorted(p.name for p in OUT.glob("*.wav")))
