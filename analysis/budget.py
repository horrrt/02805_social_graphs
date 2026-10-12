"""A run's share of the machine.

CPU_SHARE (an environment variable, default 0.8) is the share of the cores an
analysis run may keep busy, and cores() is that many. The runners count a
plain script as one core and a script with a worker pool (their POOLED set) as
cores(), and start a script only while the total fits; every worker pool sizes
itself with cores(). The runners also lower their own priority, which their
scripts inherit, so a run yields to whatever else the machine is doing.

    CPU_SHARE=0.5 python analysis/week04_run_all.py   # half the machine
"""

import os

SHARE = float(os.environ.get("CPU_SHARE", "0.8"))


def cores():
    """Workers a run may keep busy: CPU_SHARE of the cores, at least one."""
    return max(1, int((os.cpu_count() or 4) * SHARE))


def cost(name, pooled):
    """Cores a script keeps busy: all of the budget for one with a worker pool."""
    return cores() if name in pooled else 1


def fits(name, running, pooled):
    """Whether starting `name` beside the scripts in `running` stays in budget.
    Anything may start on an idle run, so a pooled script never waits forever."""
    used = sum(cost(r, pooled) for r in running)
    return used == 0 or used + cost(name, pooled) <= cores()


def lower_priority(step=10):
    """Run below everything else on the machine (children inherit it)."""
    try:
        os.nice(step)
    except OSError:
        pass
