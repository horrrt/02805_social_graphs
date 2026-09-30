"""Turn the captured boards into canvas artboards and add them to canvas.json.

    python review/week04-redesign/generator/capture/assemble_boards.py <canvas.json read just now> <root>

Writes <root>/project/<Board>.dc.html for each capture and <root>/project/canvas.json:
the index read from the canvas with three pages, their boards and row titles added,
every other key and entry kept as it was."""
import json
import sys
from pathlib import Path

CAPTURE = Path(__file__).resolve().parents[4] / "build/canvas-capture"
# The site stylesheets as uploaded to the canvas on 30 September 2026. After a change to one,
# upload it again (Artifact publish with asset: true) and put its new /_blob/ url here.
CSS = ["/_blob/bdbcfe09e54e57045ac6bae8752c2a81",   # type.css
       "/_blob/4ffd6c535951a1e34a0c3882e96ae51c",   # corridor.css
       "/_blob/5b0af5961bb5a81a4a5c5ab494e11fb9"]   # post.css, Week 4 cards for week 5 and the template
FONT = "/_blob/9ad036b9f76606ea91d82e15ebec8da3"      # Barlow Condensed 800, as the other boards use it
W, GAP_X, TITLE = 1440, 80, 420

PAGES = [
    {"id": "week05", "name": "Week 5: the page as built"},
    {"id": "graphkit", "name": "Components: network views"},
    {"id": "template", "name": "Template: start a new week here"},
]
# page -> rows of (board, title); each row gets a title note above it.
LAYOUT = {
    "week05": [
        ("Week 5 as built: the frame", [("W5Top", "Week 5 · Hero and findings"), ("W5Opening", "Week 5 · Opening"),
                                        ("W5Closing", "Week 5 · Closing, methods and AI use")]),
        ("Sections 1 to 4", [("W5Relations", "1 · Turn links into relationships"), ("W5Copying", "2 · Catch Wikipedia copying itself"),
                             ("W5Search", "3 · A Marvel search engine in 20 lines"), ("W5Autocomplete", "4 · Community autocomplete")]),
        ("Sections 5 to 7", [("W5Heaps", "5 · Heaps' law of the Marvel universe"), ("W5Fame", "6 · Does network fame buy you more words?"),
                             ("W5Weird", "7 · Who has the weirdest Wikipedia page?")]),
    ],
    "graphkit": [
        ("Network views: networkView() in six styles, real data", [("GraphKit", "networkView() · six styles, dark and light")]),
    ],
    "template": [
        ("The post template: copy public/weeks/_template to start a week", [
            ("TplTop", "Template · Hero and findings"), ("TplOpening", "Template · Opening"),
            ("TplFirst", "Template · Standard section card"), ("TplSecond", "Template · Wide section card"),
            ("TplClosing", "Template · Closing")]),
    ],
}


def board(title, height, html):
    links = "\n".join(f'<link rel="stylesheet" href="{u}">' for u in CSS)
    assert "{{" not in html, title
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>{title}</title>
<script src="./support.js"></script>
{links}
</head>
<body>
<x-dc>
<helmet>
<style>
@font-face{{font-family:"Condensed";src:url("{FONT}") format("truetype");font-weight:800;font-style:normal}}
body{{margin:0;background:#eef3f9}}
</style>
</helmet>
<div class="corridor" style="width: {W}px; height: {height}px; overflow: hidden; background: #eef3f9">{html}</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview": {{"width": {W}, "height": {height}}}}}'>
class Component extends DCLogic {{
renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
"""


def main():
    index_path, root = Path(sys.argv[1]), Path(sys.argv[2])
    c = json.loads(index_path.read_text())
    (root / "project").mkdir(parents=True, exist_ok=True)
    have = {p["id"] for p in c.get("pages", [])}
    c.setdefault("pages", []).extend(p for p in PAGES if p["id"] not in have)
    for page, rows in LAYOUT.items():
        y = 0
        for r, (row_title, row) in enumerate(rows):
            x, tallest = 0, 0
            for name, title in row:
                cap = json.loads((CAPTURE / f"{name}.json").read_text())
                path = f"{name}.dc.html"
                (root / "project" / path).write_text(board(title, cap["height"], cap["html"]))
                c["boards"][path] = {"x": x, "y": y, "w": W, "h": cap["height"], "title": title, "page": page}
                if path not in c["order"]:
                    c["order"].append(path)
                x += W + GAP_X
                tallest = max(tallest, cap["height"])
            c["notes"][f"{page}{r + 1}"] = {"x": 0, "y": y - 300, "text": row_title, "kind": "title1",
                                            "maxW": x - GAP_X, "page": page, "w": 240}
            y += tallest + TITLE
    (root / "project" / "canvas.json").write_text(json.dumps(c, indent=2, sort_keys=True, ensure_ascii=False) + "\n")
    print("boards", sum(len(r) for rows in LAYOUT.values() for _, r in rows), "pages", [p["id"] for p in c["pages"]])


if __name__ == "__main__":
    main()
