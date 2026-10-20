"""Rerun every analysis script for weeks 1 to 3 and 5 to 7 at once, then list what moved.

Week 4 has its own runner, analysis/week04_run_all.py; this one does the same
for the other weeks, Cold Read's data included. Each script starts once the scripts whose output it
reads have finished (AFTER below), at most one per core, and logs to
build/logs/<script>.log. week03_country_networks.py is the slowest at about 16
minutes (week03_reciprocity.py about as long), so a full run takes about that
long instead of about an hour.

    python analysis/run_all.py                  # weeks 1 to 3 and 5 to 7
    python analysis/run_all.py week02           # one week
    python analysis/run_all.py week03_gravity   # one script, and nothing it depends on

When the run ends it prints every committed file under analysis/ and public/ that
changed. Run it before you change a script: an empty list means the committed
JSON still reproduces. On 27 September 2026 it was not empty for three week 3
files, and the page still quoted the stale versions.

week03_corridor_control.py reads its country names from the Wikidata snapshot
in build/raw/wikidata_countries.json. Only `week03_corridor_control.py
--refresh` queries Wikidata again, and Wikidata wants a contact in the
User-Agent: set CONTACT_EMAIL first, as the week 4 downloads do.

tests/run-all.test.mjs fails if an analysis/weekNN_*.py script is in no
runner's SCRIPTS and not in its EXCLUDED list, which says why each one stays
out (live API snapshots, shared modules, one-off patches).
"""

import os
import subprocess
import sys
import time
from pathlib import Path
import budget

ROOT = Path(__file__).resolve().parents[1]
LOGS = ROOT / "build" / "logs"
SCRIPTS = {
    "week01_facts": "analysis/week01_facts.py",
    "week01_presentation": "analysis/week01_presentation.py",
    "arcade_data": "analysis/arcade_data.py",
    "week01_packs": "analysis/week01_packs.py",
    "week01_figures": "analysis/week01_figures.py",
    "week02_resilience": "analysis/week02_resilience.py",
    "week02_nullmodels": "analysis/week02_nullmodels.py",
    "week02_transit": "analysis/week02_transit.py",
    "week02_figures": "analysis/week02_figures.py",
    "analyse_week2_models": "scripts/analyse_week2_models.py",
    "week03_corridor_control": "analysis/week03_corridor_control.py",
    "week03_cartography": "analysis/week03_cartography.py",
    "week03_gravity": "analysis/week03_gravity.py",
    "week03_communities": "analysis/week03_communities.py",
    "week03_tails": "analysis/week03_tails.py",
    "week03_asylum": "analysis/week03_asylum.py",
    "week03_closures": "analysis/week03_closures.py",
    "week03_passengers": "analysis/week03_passengers.py",
    "week03_country_networks": "analysis/week03_country_networks.py",
    "week03_migration_centrality": "analysis/week03_migration_centrality.py",
    "week03_reciprocity": "analysis/week03_reciprocity.py",
    "build_world_outline": "scripts/migration/build_world_outline.py",
    "course_reference": "analysis/course_reference.py",
    "week05_communities": "analysis/week05_communities.py",
    "week05_relations": "analysis/week05_relations.py",
    "week05_copying": "analysis/week05_copying.py",
    "week05_autocomplete": "analysis/week05_autocomplete.py",
    "week05_network": "analysis/week05_network.py",
    "week05_search": "analysis/week05_search.py",
    "week05_fame": "analysis/week05_fame.py",
    "week05_heaps": "analysis/week05_heaps.py",
    "week05_weird": "analysis/week05_weird.py",
    "week06_lookalikes": "analysis/week06_lookalikes.py",
    "week06_essentials": "analysis/week06_essentials.py",
    "week06_lean": "analysis/week06_lean.py",
    "week06_cold_read": "analysis/week06_cold_read.py",
    "week06_whose_line": "analysis/week06_whose_line.py",
    "week06_mix_desk": "analysis/week06_mix_desk.py",
    "week06_hot_cold": "analysis/week06_hot_cold.py",
    "week06_tezguino": "analysis/week06_tezguino.py",
    "week07_comention": "analysis/week07_comention.py",
}
WEEK = {name: ("week02" if name == "analyse_week2_models" else
               "week03" if name == "build_world_outline" else
               "week01" if name in ("arcade_data", "course_reference") else name[:6]) for name in SCRIPTS}
# script -> the scripts whose output it reads.
AFTER = {
    "week01_presentation": ("week01_facts",),
    "arcade_data": ("week01_facts", "week01_presentation"),
    "week01_packs": ("week01_facts", "week01_presentation"),
    "week02_resilience": ("week01_presentation",),
    "week02_transit": ("week02_resilience",),
    "week02_figures": ("week02_resilience", "week02_nullmodels"),
    "analyse_week2_models": ("arcade_data",),
    "week03_cartography": ("week03_corridor_control",),
    "week03_gravity": ("week03_corridor_control",),
    "week03_communities": ("week03_corridor_control",),
    "week03_tails": ("week03_corridor_control",),
    "week03_asylum": ("week03_corridor_control",),
    "week03_passengers": ("week03_corridor_control",),
    "course_reference": ("week01_facts", "week02_nullmodels", "week06_lookalikes", "week07_comention"),
    "week05_autocomplete": ("week05_communities",),
    "week05_network": ("week05_communities", "week05_relations"),
    "week06_whose_line": ("week05_communities",),
    "week06_tezguino": ("week06_hot_cold",),
}
# NLTK data and tiktoken encodings download on first use; keep them in build/.
CACHES = {"NLTK_DATA": "build/nltk_data", "TIKTOKEN_CACHE_DIR": "build/tiktoken"}
# Checks rerun whenever a script they read reruns, so their JSON never trails it.
CHECKS = ("course_reference",)
# At most budget.cores() busy cores (CPU_SHARE, default 80%): a plain script
# counts one, a script with its own worker pool counts the whole budget.
POOLED = {"week03_tails", "week07_comention"}


def span(seconds):
    m, s = divmod(int(seconds), 60)
    return f"{m}m{s}s" if m else f"{s}s"


def run(commands, wanted):
    """Run wanted scripts in dependency order, as many at once as the CPU budget allows."""
    started, running, waiting, done, failed = time.time(), {}, list(wanted), set(), []
    while waiting or running:
        ready = [w for w in waiting if not any(d in waiting or d in running for d in AFTER.get(w, ()))]
        for name in ready:
            if not budget.fits(name, running, POOLED):
                if name in POOLED:
                    break  # hold new starts until the pooled script fits, so it is not starved
                continue
            waiting.remove(name)
            log = open(LOGS / f"{name}.log", "w")
            env = {**{k: str(ROOT / v) for k, v in CACHES.items()}, **os.environ}
            running[name] = (subprocess.Popen([sys.executable, str(ROOT / commands[name])], stdout=log,
                                              stderr=subprocess.STDOUT, cwd=ROOT, env=env), log)
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
    return failed


def main():
    args = sys.argv[1:]
    unknown = [a for a in args if a not in SCRIPTS and a not in WEEK.values()]
    if unknown:
        raise SystemExit(f"unknown: {unknown}; choose a week ({sorted(set(WEEK.values()))}) or a script "
                         f"({list(SCRIPTS)})")
    wanted = [n for n in SCRIPTS if not args or n in args or WEEK[n] in args]
    wanted += [c for c in CHECKS if c not in wanted and set(AFTER[c]) & set(wanted)]
    LOGS.mkdir(parents=True, exist_ok=True)
    started = time.time()
    budget.lower_priority()
    print(f"running {len(wanted)} scripts, at most {budget.cores()} cores busy; logs in build/logs/", flush=True)
    failed = run(SCRIPTS, wanted)
    print(f"all done in {span(time.time() - started)}" + (f"; failed: {failed}" if failed else ""))
    git = subprocess.run(["git", "status", "--porcelain", "--", "analysis", "public"], cwd=ROOT,
                         capture_output=True, text=True)
    if git.returncode:
        print(f"could not ask git what changed: {git.stderr.strip()}")
    elif git.stdout.strip():
        print("files under analysis/ and public/ that differ from the last commit:\n" + git.stdout.rstrip())
    else:
        print("every committed file reproduced")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
