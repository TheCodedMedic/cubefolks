"""Mux a rendered picture with a mix at YouTube loudness, then verify.

Usage: python3 -I pipeline/finish.py <picture.mp4> <mix.wav> <out.mp4> [web.mp4]

Two-pass loudnorm to -14 LUFS / -1.5 dBTP, audio padded or trimmed to the exact
picture length, then checks: equal durations, loudness, true peak, a non-silent
opening. Prints the measurements; exits non-zero if a check fails.
FINISH_LIMIT (default 0.74) lowers the limiter for mixes with hard hits that overshoot in AAC (Ep09 v2: 0.66).
"""
import json
import os
import subprocess
import sys


def run(args, **kw):
    return subprocess.run(args, capture_output=True, text=True, **kw)


def duration(path, stream):
    out = run(["ffprobe", "-v", "error", "-select_streams", stream, "-show_entries", "stream=duration", "-of", "csv=p=0", path]).stdout
    return float(out.strip().rstrip(","))


def main(pic, mix, out, web=None):
    plen = duration(pic, "v:0")
    probe = run(["ffmpeg", "-i", mix, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"]).stderr
    m = json.loads(probe[probe.index("{"): probe.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true,"
          f"alimiter=limit={os.environ.get('FINISH_LIMIT', '0.74')}:level=false:attack=3:release=60,apad=whole_dur={plen + 0.1},atrim=duration={plen + 0.02}")
    r = run(["ffmpeg", "-v", "error", "-y", "-i", pic, "-i", mix, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", af,
             "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", str(plen), "-movflags", "+faststart", out])
    if r.returncode:
        print(r.stderr); sys.exit(1)

    v, a = duration(out, "v:0"), duration(out, "a:0")
    meas = run(["ffmpeg", "-i", out, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    integrated = float(meas.split("I:")[-1].split("LUFS")[0])
    peak = float(meas.split("Peak:")[-1].split("dBFS")[0])
    head = run(["ffmpeg", "-t", "3", "-i", out, "-af", "volumedetect", "-vn", "-f", "null", "-"]).stderr
    mean3 = float(head.split("mean_volume:")[-1].split("dB")[0])
    ok = abs(v - a) < 0.1 and -15.5 <= integrated <= -12.5 and peak <= -1.0 and mean3 > -40
    print(f"video {v:.2f}s audio {a:.2f}s | {integrated:.1f} LUFS | true peak {peak:.1f} dBFS | first 3 s mean {mean3:.1f} dB | {'OK' if ok else 'CHECK FAILED'}")

    if web:
        run(["ffmpeg", "-v", "error", "-y", "-i", out, "-c:v", "libx264", "-crf", "23", "-preset", "medium", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", web])
        print("web copy:", web)
    sys.exit(0 if ok else 2)


if __name__ == "__main__":
    main(*sys.argv[1:])
