"""Rebuild every board of the Week 4 redesign canvas from the repository's JSON into ../boards.

Run from anywhere: python3 review/week04-redesign/generator/build_all.py
Board positions in ../boards/canvas.json belong to the canvas, where people move boards around. This keeps them,
updates each board's height, and places boards the index does not list yet at the end of the second row.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kit  # noqa: E402
import build as B  # noqa: E402
import deep as D  # noqa: E402
import extra as E  # noqa: E402
import explore4 as X4  # noqa: E402


def main():
    # One process, in this order: popover ids are numbered across boards, and the published boards were built so.
    boards = [
        ("Main.dc.html", "Top of the page: hero, findings, opening, section 1", B.board_main(), B.HEIGHTS["Main"]),
        ("Section3.dc.html", "Section 3 · who staffs whom", B.board_section3(), B.HEIGHTS["Section3"]),
        ("Section4.dc.html", "Section 4 · the one interaction", B.board_section4(), B.HEIGHTS["Section4"]),
        ("Closing.dc.html", "Closing and the deep dive", B.board_closing(), B.HEIGHTS["Closing"]),
        ("ChartKit.dc.html", "Chart kit: one colour key, one strip, before and after", B.board_kit(), B.HEIGHTS["ChartKit"]),
    ]
    boards += [(f, title, html, h) for f, title, html, h in D.all_boards()]
    boards += [(f, title, html, h) for f, title, html, h, _ in E.all_boards()]
    boards += X4.all_boards()
    # Today.dc.html is a screenshot of the live page, committed as the canvas has it; nothing here rebuilds it.

    for name, _, html, _ in boards:
        errs = kit.check_markup(html)
        assert not errs, (name, errs[:4])
    for name, _, html, _ in boards:
        with open(os.path.join(B.OUT, name), "w") as f:
            f.write(html)

    index_path = os.path.join(B.OUT, "canvas.json")
    idx = json.load(open(index_path))
    row2_y = idx["boards"]["ChartKit.dc.html"]["y"]
    x = max(e["x"] + e["w"] for e in idx["boards"].values() if e["y"] == row2_y) + 80
    for name, title, _, h in boards:
        if name in idx["boards"]:
            idx["boards"][name]["h"] = h
            continue
        idx["boards"][name] = {"x": x, "y": row2_y, "w": kit.W, "h": h, "title": title, "is_interactive": True}
        idx["order"].append(name)
        x += kit.W + 80
    with open(index_path, "w") as f:
        json.dump(idx, f, ensure_ascii=False, indent=1)
    print(f"{len(boards)} boards -> {os.path.relpath(B.OUT)}")


if __name__ == "__main__":
    main()
