"""Measure how far the music sits under the voice in a cue sheet's mix (average RMS, dB). The owner's level for Shorts: 15 dB under.

Usage: python3 -I pipeline/music_level.py episodes/<ep>/cues.py [target_db]
Mixes the voice alone and the voice with only the beds tagged "music", subtracts them, and compares the music to the voice.
With a target (e.g. -15) it also prints the rel_db to put on the music bed to hit it (rel_db in the cue sheet is not the same
number: it is relative to the loudest 3 s of the track and the mixer ducks under speech, so always measure).
"""
import pathlib, subprocess, sys, tempfile
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
cue = pathlib.Path(sys.argv[1]).resolve()
target = float(sys.argv[2]) if len(sys.argv) > 2 else None
tmp = pathlib.Path(tempfile.mkdtemp())
head = f'__file__ = {str(cue)!r}\nexec(compile(open(__file__).read(), __file__, "exec"))\n'
(tmp / "music.py").write_text(head + 'BEDS = [b for b in BEDS if len(b) > 6 and b[6] == "music"]\nSFX = []\n')
(tmp / "voice.py").write_text(head + "BEDS = []\nSFX = []\n")
for k in ("music", "voice"):
    subprocess.run([sys.executable, "-I", str(ROOT / "pipeline" / "mix.py"), str(tmp / f"{k}.py"), str(tmp / f"{k}.wav")], check=True, capture_output=True)
load = lambda f: np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(f), "-ac", "1", "-ar", "48000", "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32)
m, v = load(tmp / "music.wav"), load(tmp / "voice.wav")
n = min(len(m), len(v)); mus = m[:n] - v[:n]
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
d = db(mus) - db(v[:n])
print(f"music sits {d:.1f} dB relative to the voice (owner's level for Shorts: -15.0)")
if target is not None:
    print(f"to reach {target:.1f} dB, change the music bed's rel_db by {target - d:+.1f}")
