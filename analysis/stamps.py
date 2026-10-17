"""Stamp a derived JSON file with the inputs it was computed from.

A script reads each input through Inputs.read(), which hashes the exact bytes
it hands back, and writes the stamp into its output:

    inputs = stamps.Inputs(__file__)
    corridors = json.loads(inputs.read(DATA / "week03_corridors.json"))
    ...
    payload.update(inputs.stamp())   # "inputs": {path: sha256}, "rerun": "python analysis/..."

tests/derived-inputs.test.mjs re-hashes every stamped input inside npm test
and names the script to rerun when one changed, so an output can no longer
trail the files it was computed from. Paths are relative to the repository
root. An input under build/ (gitignored) is checked only where it exists.
"""

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Inputs:
    def __init__(self, script):
        self.script = Path(script).resolve().relative_to(ROOT).as_posix()
        self.seen = {}

    def read(self, path):
        """The file's bytes, hashed as read."""
        path = Path(path).resolve()
        data = path.read_bytes()
        self.seen[path.relative_to(ROOT).as_posix()] = hashlib.sha256(data).hexdigest()
        return data

    def add(self, path):
        """Stamp a file the script reads some other way (a table, a line-by-line read)."""
        self.read(path)
        return path

    def stamp(self):
        return {"inputs": dict(sorted(self.seen.items())), "rerun": f"python {self.script}"}
