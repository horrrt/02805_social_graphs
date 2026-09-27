"""Flag SVG marks that land outside their own viewBox: the sign of an axis that stops short of its data."""
import re, sys

NUM = r"-?\d+(?:\.\d+)?"

def check(src, tol=3):
    bad = []
    for m in re.finditer(r'<svg width="(%s)" height="(%s)" viewBox="0 0 %s %s"[^>]*aria-label="([^"]*)"[^>]*>(.*?)</svg>' % (NUM, NUM, NUM, NUM), src, re.S):
        w, h, label, body = float(m.group(1)), float(m.group(2)), m.group(3), m.group(4)
        if "transform" in body:
            continue  # maps and translated groups use their own frames
        pts = []
        for d in re.findall(r'<path d="([^"]+)"', body):
            nums = [float(x) for x in re.findall(NUM, d)]
            pts += list(zip(nums[0::2], nums[1::2]))
        for tag in re.findall(r"<line [^>]+>", body):
            g = dict(re.findall(r'(x1|y1|x2|y2)="(%s)"' % NUM, tag))
            if len(g) == 4:
                pts += [(float(g["x1"]), float(g["y1"])), (float(g["x2"]), float(g["y2"]))]
        for tag in re.findall(r"<circle [^>]+>", body):
            g = dict(re.findall(r'(cx|cy|r)="(%s)"' % NUM, tag))
            if "cx" in g and "cy" in g:
                pts.append((float(g["cx"]), float(g["cy"])))
        for tag in re.findall(r"<rect [^>]+>", body):
            g = dict(re.findall(r'\b(x|y|width|height)="(%s)"' % NUM, tag))
            if g:
                x, y = float(g.get("x", 0)), float(g.get("y", 0))
                pts += [(x, y), (x + float(g.get("width", 0)), y + float(g.get("height", 0)))]
        for tag in re.findall(r"<text [^>]+>", body):
            g = dict(re.findall(r'\b(x|y)="(%s)"' % NUM, tag))
            if "y" in g:
                pts.append((float(g.get("x", 0)), float(g["y"])))
        out = [(round(x), round(y)) for x, y in pts if x < -tol or y < -tol or x > w + tol or y > h + tol]
        if out:
            bad.append((label[:70], int(w), int(h), out[:6], len(out)))
    return bad

for f in sys.argv[1:]:
    res = check(open(f).read())
    name = f.rsplit("/", 1)[-1]
    print(f"{name}: {'ok' if not res else str(len(res)) + ' svg(s) with marks outside'}")
    for r in res:
        print("   ", r)
