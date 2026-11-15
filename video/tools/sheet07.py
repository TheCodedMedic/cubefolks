"""Contact sheet from a folder of stills: python3 -I tools/sheet07.py <dir> <out.jpg> [cols] [w]"""
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6; w = int(sys.argv[4]) if len(sys.argv) > 4 else 240
fs = sorted(glob.glob(os.path.join(d, "*.png"))); h = w * 16 // 9
S = Image.new("RGB", (cols * w, ((len(fs) + cols - 1) // cols) * h), "#111")
for i, f in enumerate(fs):
    im = Image.open(f).convert("RGB").resize((w, h)); ImageDraw.Draw(im).text((6, 4), os.path.basename(f)[1:-4], fill="#ffff00")
    S.paste(im, ((i % cols) * w, (i // cols) * h))
S.save(out, quality=85); print(out, len(fs))
