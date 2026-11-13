"""Mix voice + ambience beds + effects from a cue sheet -> 48 kHz stereo WAV.

Usage: python3 -I pipeline/mix.py <cues.py> <out.wav>

The cue sheet is a Python file defining:
  VOICE = "path/to/master_voiceover.wav"
  LENGTH = seconds                               # total length of the mix
  BEDS = [(name, start, end, rel_db, fade_in, fade_out[, "music"]), ...]
  MUSIC_DUCK_DB = 11   (optional) beds tagged "music" sit at rel_db in the gaps and dip this many dB under any voice,
                       with a smooth attack (0.15 s) and release (0.5 s); untagged beds keep the light duck
  SFX  = [(name, time, rel_db[, keep_s]), ...]   (one-shots are cut to keep_s, else SFX_MAX = 8 s, with a short fade)
Names resolve to sfx/library/<name>.wav (or a path). rel_db is the level of the
sound's loudest 0.3 s relative to the voice's speech level (negative = quieter),
so effects never jump out over the narration. Beds loop to fill their span and
duck under the voice (up to -45 %).
"""
import importlib.util
import pathlib
import subprocess
import sys

import numpy as np

SR = 48000
ROOT = pathlib.Path(__file__).resolve().parent.parent
LIB = ROOT / "sfx" / "library"


def load(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def resolve(name):
    p = pathlib.Path(name)
    if p.suffix and p.exists():
        return p
    for ext in (".ogg", ".wav"):
        if (LIB / f"{name}{ext}").exists():
            return LIB / f"{name}{ext}"
    raise FileNotFoundError(f"no sound named {name} in {LIB}")


def resolve_ok(name):
    try:
        resolve(name)
        return True
    except FileNotFoundError:
        return False


def loudest(x, win=0.3):
    n = int(win * SR)
    mono = x.mean(axis=1)
    if len(mono) <= n:
        return float(np.sqrt(np.mean(mono ** 2)) + 1e-9)
    c = np.cumsum(np.concatenate([[0], mono ** 2]))
    return float(np.sqrt((c[n:] - c[:-n]).max() / n) + 1e-9)


def speech_level(v):
    n = int(0.3 * SR)
    mono = v.mean(axis=1)
    r = np.array([np.sqrt(np.mean(mono[i:i + n] ** 2)) for i in range(0, len(mono) - n, n)])
    return float(np.median(r[r > 0.02]))


def main(cue_path, out_path):
    spec = importlib.util.spec_from_file_location("cues", cue_path)
    cues = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cues)

    missing = sorted({n for n in [b[0] for b in cues.BEDS] + [x[0] for x in cues.SFX] if not resolve_ok(n)})
    if missing:
        sys.exit(f"cue sheet names sounds that are not in the library: {missing}")
    total = int(cues.LENGTH * SR)
    voice = load(cues.VOICE)[:total]
    voice = np.pad(voice, ((0, total - len(voice)), (0, 0)))
    vref = speech_level(voice)

    # voice envelope for ducking (0.25 s window)
    n = int(0.25 * SR)
    c = np.cumsum(np.concatenate([[0.0], np.abs(voice.mean(axis=1)).astype(np.float64)]))
    idx = np.arange(total); h = n // 2
    e = (c[np.clip(idx + (n - h), 0, total)] - c[np.clip(idx - h, 0, total)]) / n  # moving average (same as the convolution, much faster)
    duck = 1 - 0.45 * np.clip(e / (vref * 0.6), 0, 1)
    # music duck: a speech mask from the same envelope, smoothed (fast attack, slow release) so music breathes, never flutters
    mdb = getattr(cues, "MUSIC_DUCK_DB", None)
    if mdb:
        k = 160  # envelope rate (Hz) for the smoother
        m = (np.clip(e / (vref * 0.25), 0, 1))[::SR // k]
        sm = np.zeros_like(m); a_up, a_dn = 1 - np.exp(-1 / (0.15 * k)), 1 - np.exp(-1 / (0.5 * k)); v = 0.0
        for i, x in enumerate(m):
            v += (x - v) * (a_up if x > v else a_dn); sm[i] = v
        mduck = np.interp(np.arange(total), np.arange(len(sm)) * (SR // k), sm)
        mduck = (10 ** (-mdb * mduck / 20)).astype(np.float32)
    music = np.zeros((total, 2), np.float32)

    beds = np.zeros((total, 2), np.float32)
    cache = {}

    def get(name):
        if name not in cache:
            cache[name] = load(resolve(name))
        return cache[name]

    for bed in cues.BEDS:
        name, start, stop, rel, fi, fo = bed[:6]
        is_music = mdb and len(bed) > 6 and bed[6] == "music"
        clip = get(name)
        a, b = int(start * SR), min(total, int(stop * SR))
        if b <= a:
            continue
        reps = int(np.ceil((b - a) / len(clip)))
        seg = np.tile(clip, (reps, 1))[: b - a]
        gain = vref * 10 ** (rel / 20) / loudest(clip, 3.0)
        env = np.ones(b - a, np.float32)
        nfi, nfo = int(fi * SR), int(fo * SR)
        if nfi:
            env[:nfi] = np.linspace(0, 1, min(nfi, b - a))
        if nfo:
            env[-nfo:] = np.minimum(env[-nfo:], np.linspace(1, 0, min(nfo, b - a)))
        (music if is_music else beds)[a:b] += seg * gain * env[:, None]
    beds *= duck[:, None]
    if mdb:
        beds += music * mduck[:, None]

    fx = np.zeros((total, 2), np.float32)
    cap = getattr(cues, "SFX_MAX", 8.0)          # one-shots longer than this are loops: play only the start
    for e in cues.SFX:
        name, at, rel = e[:3]
        clip = get(name)
        keep = int(min(e[3] if len(e) > 3 else cap, cap) * SR)   # optional 4th element: seconds to keep
        if len(clip) > keep:
            clip = clip[:keep].copy()
            f = min(int(0.08 * SR), keep // 3)
            clip[-f:] *= np.linspace(1, 0, f)[:, None]
        a = int(at * SR)
        if a >= total or a < 0:
            continue
        gain = vref * 10 ** (rel / 20) / loudest(clip)
        seg = clip[: total - a] * gain
        fx[a:a + len(seg)] += seg

    mix = voice + beds + fx
    peak = np.abs(mix).max()
    if peak > 0.98:
        mix *= 0.98 / peak
    pcm = (mix * 32767).astype(np.int16).tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", out_path],
                   input=pcm, check=True)
    print(f"mixed {cues.LENGTH:.1f} s: {len(cues.BEDS)} beds, {len(cues.SFX)} effects -> {out_path}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
