"""Word timestamps with faster-whisper -> episodes/<name>/whisper_words.json ([{words:[{w,s,e}]}])."""
import json, pathlib, sys
import subprocess
import numpy as np
from faster_whisper import WhisperModel
ep = pathlib.Path(sys.argv[1])
m = WhisperModel("small", device="cpu", compute_type="int8")
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(ep / "narrator_16k.wav"), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.float32).copy()  # decode with ffmpeg (the bundled PyAV is incompatible)
segs, _ = m.transcribe(audio, word_timestamps=True, language="en", beam_size=5)
out = [{"words": [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for w in s.words]} for s in segs]
(ep / "whisper_words.json").write_text(json.dumps(out))
print(sum(len(s["words"]) for s in out), "words heard")
