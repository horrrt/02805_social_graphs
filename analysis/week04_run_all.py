"""Rerun every week 4 analysis script at once, as separate processes.

The scripts share no state except their inputs in build/, aside from the real
dependencies listed in AFTER below (each maps a script to the ones whose
output it reads: week04_staffing_figure.py and week04_staffing_moves.py read
week04_staffing.py's; week04_where_who.py and week04_explore.py read
week04_where.py's; week04_years.py reads week04_staffing.py, week04_staffing_figure.py,
week04_shift.py, week04_countries.py and week04_lottery.py's; week04_roles.py
reads week04_years.py's and week04_staffing.py's, to check its own totals
against them; week04_skills.py and week04_skills_radar.py read week04_jobs.py's,
its own 60-occupation network; week04_more_page.py reads week04_perm.py,
week04_countries.py, week04_oews.py, week04_ties.py and week04_lottery.py's;
week04_staffing_deep_page.py reads week04_staffing.py, week04_lottery.py,
week04_shift.py, week04_lawfirms.py and week04_ties.py's). week04_pagerank.py imports
week04_jobs.py's and week04_where.py's functions directly and recomputes the
projection and backbone itself, so it reads no file either writes and needs
no entry here. Everything else starts immediately, so a full rerun takes
about as long as the slowest script (week04_lawfirms.py, about 7 minutes)
instead of the sum (about 21 for the first eleven scripts). At most one
script per core runs at a time. Each script's output goes to
build/logs/<script>.log; a line prints as each one finishes, with the time so far.

    python analysis/week04_run_all.py                  # everything
    python analysis/week04_run_all.py staffing lottery # just these (the week04_ prefix is optional)

Run it after changing week04_names.py or either name table, then rerun the
site tests: tests/week04-prose.test.mjs names every sentence whose number moved.
"""

import os
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
LOGS = HERE.parent / "build" / "logs"
SCRIPTS = ["week04_where", "week04_where_who", "week04_jobs", "week04_jobs_split", "week04_staffing",
           "week04_staffing_figure", "week04_staffing_moves", "week04_lottery", "week04_perm", "week04_countries",
           "week04_ties", "week04_shift", "week04_lawfirms", "week04_oews", "week04_beyond", "week04_footprint",
           "week04_explore", "week04_years", "week04_roles", "week04_pagerank", "week04_skills", "week04_skills_radar",
           "week04_more_page", "week04_staffing_deep_page"]
# script -> the scripts whose output it reads (the moves and where_who scripts check theirs reproduces).
AFTER = {"week04_staffing_figure": ("week04_staffing",), "week04_staffing_moves": ("week04_staffing",),
         "week04_where_who": ("week04_where",), "week04_explore": ("week04_where",),
         "week04_years": ("week04_staffing", "week04_shift", "week04_countries", "week04_lottery",
                           "week04_staffing_figure"),
         "week04_roles": ("week04_years", "week04_staffing"),
         "week04_skills": ("week04_jobs",), "week04_skills_radar": ("week04_jobs",),
         "week04_more_page": ("week04_perm", "week04_countries", "week04_oews", "week04_ties", "week04_lottery"),
         "week04_staffing_deep_page": ("week04_staffing", "week04_lottery", "week04_shift", "week04_lawfirms",
                                       "week04_ties")}
# One process per core: each loads a few hundred MB of filings.
MAX_PARALLEL = os.cpu_count() or 4


def span(seconds):
    m, s = divmod(int(seconds), 60)
    return f"{m}m{s}s" if m else f"{s}s"


def main():
    wanted = [a if a.startswith("week04_") else f"week04_{a}" for a in sys.argv[1:]] or SCRIPTS
    unknown = [w for w in wanted if w not in SCRIPTS]
    if unknown:
        raise SystemExit(f"unknown scripts: {unknown}; choose from {SCRIPTS}")
    LOGS.mkdir(parents=True, exist_ok=True)
    started, running, waiting, failed = time.time(), {}, list(wanted), []

    def launch(name):
        log = open(LOGS / f"{name}.log", "w")
        running[name] = (subprocess.Popen([sys.executable, str(HERE / f"{name}.py")], stdout=log,
                                          stderr=subprocess.STDOUT, cwd=HERE.parent), log)

    print(f"running {len(wanted)} scripts in parallel; logs in {LOGS.relative_to(HERE.parent)}/", flush=True)
    done = set()
    while waiting or running:
        ready = [w for w in waiting if not any(d in waiting or d in running for d in AFTER.get(w, ()))]
        for name in ready[:max(0, MAX_PARALLEL - len(running))]:
            waiting.remove(name)
            launch(name)
        time.sleep(2)
        for name, (proc, log) in list(running.items()):
            if proc.poll() is None:
                continue
            log.close()
            del running[name]
            done.add(name)
            status = "ok" if proc.returncode == 0 else f"FAILED ({proc.returncode}), see build/logs/{name}.log"
            if proc.returncode:
                failed.append(name)
            print(f"{len(done)}/{len(wanted)} {name}: {status}, {span(time.time() - started)} elapsed; "
                  f"still running: {', '.join(running) or 'nothing'}", flush=True)
    print(f"all done in {span(time.time() - started)}" + (f"; failed: {failed}" if failed else ""))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
