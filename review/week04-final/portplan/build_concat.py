"""Concatenate the design boards' page markup in page order into boards_concat.html.
Usage: python build_concat.py [BOARD_DIR]  (default: ../design_final/project)"""
import re, sys, pathlib
D = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "../design_final/project")
ORDER = ["RTop", "ROpening", "RS1", "RS2", "RS3", "RS4", "RS5", "RClosing", "RDeep",
         "RTopicWhere", "RTopicJobs", "RTopicOutsourcing", "RTopicPaperwork", "RTopicYears", "RData"]
out = []
for b in ORDER:
    s = (D / f"{b}.dc.html").read_text()
    body = s[s.find('<div class="corridor rx"'):s.rfind("</x-dc>")]
    body = re.sub(r"<script[\s\S]*?</script>", "", body)
    body = re.sub(r'<nav class="rx-rail"[\s\S]*?</nav>', "", body)
    out.append(f"<!-- BOARD {b} -->\n{body}")
pathlib.Path("boards_concat.html").write_text("\n".join(out))
print("boards_concat.html", sum(map(len, out)), "chars")
