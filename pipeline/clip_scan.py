"""Scan a debug render (BlockChar `hits` paint clipping parts flat magenta #ff00ff) and list the frames where any part
is inside a wall, prop, floor or another person. Usage: python3 -I pipeline/clip_scan.py video.mp4 [min_px]"""
import subprocess, sys
import numpy as np

path = sys.argv[1]; min_px = int(sys.argv[2]) if len(sys.argv) > 2 else 6
w, h = [int(x) for x in subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height",
                                         "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip().split(",")]
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3).astype(np.int16)
r, g, b = fr[..., 0], fr[..., 1], fr[..., 2]
mag = (r > 200) & (b > 200) & (g < 90)          # flat magenta survives the h264 encode as roughly (240+, <80, 240+)
counts = mag.reshape(len(fr), -1).sum(1)
bad = [i for i, c in enumerate(counts) if c >= min_px]
runs, start = [], None
for i in range(len(counts) + 1):
    on = i < len(counts) and counts[i] >= min_px
    if on and start is None: start = i
    if not on and start is not None: runs.append((start, i - 1, int(counts[start:i].max()))); start = None
print(f"{path}: {len(fr)} frames, {len(bad)} with clipping" + ("".join(f"\n  frames {a}-{b} (max {m} px)" for a, b, m in runs)))
