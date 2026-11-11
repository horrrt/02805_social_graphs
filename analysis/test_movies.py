"""movies.py turns a screenplay into scenes and a co-occurrence network.

The fixture is a made-up script in IMSDb's layout: tab-indented cues, a
(V.O.) and a (CONT'D) extension, a transition in capitals, and an action
line in capitals that no dialogue follows. Two characters who share two
scenes get weight 2; a character below MIN_LINES drops out. A script with
no scene headings returns an issue, not a one-scene network. find() reads
IMSDb's "Title, The" order. Needs no network or build data.

    python analysis/test_movies.py
"""

import sys

from movies import cue_name, find, network, parse

SCRIPT = """
INT. DINER - DAY

\t\t\t\tVINCENT
\t\tYou know what they call it?

\t\t\t\tJULES (V.O.)
\t\tNo.

THE DOOR SLAMS.

\t\t\t\tVINCENT (CONT'D)
\t\tA Royale with cheese.

\t\t\t\t\t\tCUT TO:

EXT. STREET - NIGHT

\t\t\t\tJULES
\t\tLet's go.

\t\t\t\tVINCENT
\t\tAfter you.

\t\t\t\tMIA
\t\tHi.

INT. CAR - NIGHT

\t\t\t\tJULES
\t\tQuiet.

\t\t\t\tVINCENT
\t\tFine.

INT. HOUSE - NIGHT

\t\t\t\tJULES
\t\tHome.

EXT. ROAD - DAY

\t\t\t\tVINCENT
\t\tDrive.
"""


def main():
    failures = []

    def check(label, got, want):
        if got != want:
            failures.append(f"{label}: got {got!r}, want {want!r}")

    scenes, issue = parse(SCRIPT)
    check("issue", issue, None)
    check("scenes", scenes, [["VINCENT", "JULES", "VINCENT"], ["JULES", "VINCENT", "MIA"],
                             ["JULES", "VINCENT"], ["JULES"], ["VINCENT"]])

    nodes, edges = network(scenes, min_lines=2)
    check("nodes", nodes, {"JULES": {"lines": 4, "scenes": 4}, "VINCENT": {"lines": 5, "scenes": 4}})
    check("edges", edges, [["JULES", "VINCENT", 3]])

    check("cue extension", cue_name("JULES (V.O.)"), "JULES")
    check("transition", cue_name("CUT TO:"), None)
    check("heading", cue_name("INT. DINER - DAY"), None)

    _, issue = parse("\t\t\tBOB\n\tHello there.\n")
    check("no headings", issue, "only 0 scene headings")

    rows = [("Godfather", "u1"), ("Godfather Part II", "u2"), ("Dark Knight, The", "u3")]
    check("exact", find(rows, "Godfather"), ("Godfather", "u1"))
    check("article", find(rows, "The Dark Knight"), ("Dark Knight, The", "u3"))

    print({"failures": failures})
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
