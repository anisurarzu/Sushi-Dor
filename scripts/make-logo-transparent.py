from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
src = ROOT / "public/brand/sushi-dor-mark.jpg"
out = ROOT / "public/brand/sushi-dor-mark.png"

im = Image.open(src).convert("RGBA")
px = im.load()
w, h = im.size

for y in range(h):
    for x in range(w):
        r, g, b, _a = px[x, y]
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        chroma = max(r, g, b) - min(r, g, b)
        # Charcoal / near-black plate → transparent
        if lum < 40 and chroma < 30:
            px[x, y] = (0, 0, 0, 0)
        elif lum < 70 and chroma < 25:
            t = (lum - 40) / 30.0
            px[x, y] = (r, g, b, int(max(0, min(1, t)) * 255))
        else:
            px[x, y] = (r, g, b, 255)

bbox = im.getbbox()
if bbox:
    pad = 20
    x0 = max(0, bbox[0] - pad)
    y0 = max(0, bbox[1] - pad)
    x1 = min(w, bbox[2] + pad)
    y1 = min(h, bbox[3] + pad)
    im = im.crop((x0, y0, x1, y1))

im.save(out, "PNG")
hist = im.getchannel("A").histogram()
px = im.load()
w, h = im.size
print("saved", out)
print("size", im.size, "a0", hist[0], "a255", hist[255])
print("corners", px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1])
