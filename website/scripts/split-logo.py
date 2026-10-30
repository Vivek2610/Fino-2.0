"""Split the supplied logo into its separate facet shapes (exact pixels).
Usage: python3 scripts/split-logo.py path/to/logo.png
Writes public/images/fino-logo.png, public/images/fino-logo-facets.png, lib/logo-facets.json
"""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

L = Image.open(sys.argv[1]).convert("RGBA")
bb = L.getchannel("A").getbbox(); pad = 6
lc = L.crop((bb[0]-pad, bb[1]-pad, bb[2]+pad, bb[3]+pad)); lc.save("public/images/fino-logo.png", optimize=True)
A = np.array(lc); full = A[..., 3] > 0
lab, n = ndi.label(ndi.binary_dilation(A[..., 3] > 20, iterations=2))
facets, parts = [], []
for i in range(1, n+1):
    m = (lab == i) & full
    ys, xs = np.where(m); x0, x1, y0, y1 = xs.min(), xs.max()+1, ys.min(), ys.max()+1
    P = np.zeros_like(A); P[m] = A[m]
    parts.append(Image.fromarray(P[y0:y1, x0:x1])); facets.append(dict(x=int(x0), y=int(y0), w=int(x1-x0), h=int(y1-y0)))
W = sum(p.width+2 for p in parts); H = max(p.height for p in parts)
at = Image.new("RGBA", (W, H), (0, 0, 0, 0)); x = 0
for f, p in zip(facets, parts):
    at.paste(p, (x, 0)); f["sx"] = x; f["sy"] = 0; x += p.width + 2
at.save("public/images/fino-logo-facets.png", optimize=True)
json.dump(dict(width=lc.width, height=lc.height, facets=facets), open("lib/logo-facets.json", "w"))
print(f"{len(facets)} facets")
