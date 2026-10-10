"""The project's tables, stored as Parquet.

Every committed table (data/*.parquet and the analysis/*.parquet the scripts
write or that people review by hand) goes through this module. A table keeps
what its old CSV or TSV held, nothing less:

- its cells, each column typed (integer or decimal) only when every value
  prints back as exactly the text it was, else kept as text, with an empty
  cell as null;
- its "#" notes, the source and method lines that used to head the file;
- how the file was laid out (delimiter, header row or none), so text() can
  rebuild the old file byte for byte. digest() hashes that text, which is why
  the snapshot hashes recorded before the move to Parquet still hold.

    frame(path)        pandas table: typed columns, nulls as NaN (what pd.read_csv gave)
    rows(path)         list of dicts of strings, "" for empty (what csv.DictReader gave)
    records(path)      list of lists of strings, header excluded (what csv.reader gave)
    notes(path)        the "#" lines, without the "# "
    write(path, df)    save a pandas table, typing what types losslessly

Edit a table by hand through its CSV:

    python analysis/tables.py show analysis/week06_pairs_read.parquet
    python analysis/tables.py to-csv analysis/week06_pairs_read.parquet pairs.csv
    python analysis/tables.py from-csv pairs.csv analysis/week06_pairs_read.parquet
    python analysis/tables.py edit analysis/week06_pairs_read.parquet   # opens $EDITOR
    python analysis/tables.py text data/week1_nodes.parquet | shasum -a 256   # the snapshot hash

from-csv keeps the notes and layout of the table it replaces. convert turns an
old CSV or TSV into a table next to it, and refuses unless text() rebuilds the
old file exactly.
"""

import argparse
import csv
import hashlib
import io
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

KEY = b"tables"  # Parquet key-value metadata: notes and layout, as JSON


def _layout(path):
    meta = pq.read_schema(path).metadata or {}
    return json.loads(meta.get(KEY, b"{}"))


def _strings(path):
    """Every cell as the text it stands for, "" for null, column by column."""
    table = pq.read_table(path)
    return [[_text(v) for v in col.to_pylist()] for col in table.columns], table.column_names


def _text(v):
    if v is None:
        return ""
    if isinstance(v, float):
        return repr(v)
    return str(v)


def notes(path):
    return list(_layout(path).get("notes", []))


def frame(path, columns=None):
    """A pandas table: typed columns as stored, nulls as NaN, as pd.read_csv gave."""
    df = pq.read_table(path, columns=columns).to_pandas()
    return df.fillna(float("nan")) if len(df) else df


def records(path):
    """Rows as lists of strings, "" for empty; the header row is not one."""
    cols, _ = _strings(path)
    return [list(r) for r in zip(*cols)] if cols else []


def rows(path):
    """Rows as dicts of strings, "" for empty, as csv.DictReader gave."""
    cols, names = _strings(path)
    return [dict(zip(names, r)) for r in zip(*cols)] if cols else []


def _render(path, delim, term, header):
    """The table as delimited text: notes, then the rows, with any note that sat
    between rows put back before the row it preceded."""
    lay = _layout(path)
    cols, names = _strings(path)
    rows = ([names] if header else []) + ([list(r) for r in zip(*cols)] if cols else [])
    if delim == "\t":
        lines = ["\t".join(r) for r in rows]
    else:
        lines = []
        for r in rows:
            buf = io.StringIO()
            csv.writer(buf, lineterminator="").writerow(r)
            lines.append(buf.getvalue())
    shift = 0 if lay.get("header", True) == header else (1 if header else -1)
    for pos, note in sorted(lay.get("inline_notes", []), reverse=True):
        lines.insert(max(0, min(len(lines), pos + shift)), note)
    return "".join(n + "\n" for n in lay.get("notes_raw", [])) + "".join(line + term for line in lines)


def text(path):
    """The old CSV or TSV this table was, rebuilt exactly."""
    lay = _layout(path)
    return _render(path, lay.get("delimiter", ","), lay.get("lineterminator", "\n"), lay.get("header", True))


def digest(path):
    """sha256 of text(path): the old file's hash, for as long as the table is unedited."""
    return hashlib.sha256(text(path).encode("utf-8")).hexdigest()


def _typed(values):
    """A pyarrow array for one column of text: int64 or float64 when every
    non-empty value prints back as itself, else string; "" becomes null."""
    present = [v for v in values if v != ""]
    for kind, parse, show in (("int", int, str), ("float", float, repr)):
        try:
            if present and all(show(parse(v)) == v for v in present):
                return pa.array([parse(v) if v != "" else None for v in values],
                                pa.int64() if kind == "int" else pa.float64())
        except (ValueError, OverflowError, pa.ArrowInvalid):
            continue
    return pa.array([v if v != "" else None for v in values], pa.string())


def _save(target, names, columns, layout):
    table = pa.table(dict(zip(names, columns)))
    table = table.replace_schema_metadata({KEY: json.dumps(layout, ensure_ascii=False).encode()})
    target = Path(target)
    part = target.with_suffix(".parquet.part")
    pq.write_table(table, part, compression="zstd")
    part.rename(target)
    return target


def _cell(v):
    """A value as csv.writer would write it: "" for a blank, repr for a float."""
    if v is None or v is pd.NA or v is pd.NaT or (isinstance(v, float) and v != v):
        return ""
    return repr(v) if isinstance(v, float) else str(v)


def write(path, df, notes=None, keep_layout=True):
    """Save a pandas table. Cells are written as text first, so a column takes a
    number type only when that is lossless. With keep_layout the notes and
    layout of the table already at path carry over unless notes is given."""
    path = Path(path)
    layout = _layout(path) if keep_layout and path.exists() else {"delimiter": ",", "header": True}
    # A rewritten table is no longer the file it was converted from.
    layout.pop("source_sha256", None)
    layout.pop("converted_from", None)
    lines = len(df) + (1 if layout.get("header", True) else 0)
    layout["inline_notes"] = [n for n in layout.get("inline_notes", []) if n[0] <= lines]
    if notes is not None:
        layout["notes"] = list(notes)
        layout["notes_raw"] = [f"# {n}" if n else "#" for n in notes]
    text_cols = [[_cell(v) for v in df[c]] for c in df.columns]
    return _save(path, [str(c) for c in df.columns], [_typed(c) for c in text_cols], layout)


def _parse(raw, delim, header=True, names=None):
    """CSV or TSV text: its leading notes, column names, cells as text, line
    ending, and any notes between rows with the line they came before."""
    lines = raw.split("\n")
    notes_raw = []
    while lines and lines[0].startswith("#"):
        notes_raw.append(lines.pop(0))
    body = "\n".join(lines)
    term = "\r\n" if "\r\n" in body else "\n"
    parts = body.split(term)
    if parts and parts[-1] == "":
        parts.pop()
    inline, data = [], []
    for line in parts:
        if line.startswith("#"):
            inline.append([len(data), line])
        elif line == "":
            raise SystemExit("an empty line inside the table")
        else:
            data.append(line)
    if delim == "\t":
        table = [line.split("\t") for line in data]
    else:
        table = list(csv.reader(io.StringIO(term.join(data) + term, newline="")))
        if len(table) != len(data):
            raise SystemExit("a cell runs over two lines, which tables.py does not keep")
    if header:
        names, table = table[0], table[1:]
    return notes_raw, names, table, term, inline


def save_text(target, raw, delimiter="\t", names=None):
    """Store CSV or TSV text (notes, then a header row unless names is given)
    as a table; refuse unless text() rebuilds it exactly."""
    target = Path(target)
    header = names is None
    notes_raw, names, table, term, inline = _parse(raw, delimiter, header, names)
    width = len(names)
    if any(len(r) != width for r in table):
        raise SystemExit(f"{target.name}: rows of uneven width")
    layout = {"delimiter": delimiter, "header": header, "notes_raw": notes_raw, "lineterminator": term,
              "notes": [n[2:] if n.startswith("# ") else n[1:] for n in notes_raw], "inline_notes": inline,
              "source_sha256": hashlib.sha256(raw.encode("utf-8")).hexdigest()}
    _save(target, names, [_typed([r[i] for r in table]) for i in range(width)], layout)
    if text(target) != raw:
        target.unlink()
        raise SystemExit(f"{target.name}: the table does not rebuild its text exactly")
    return target


def convert(source, target=None, names=None):
    """Write the CSV or TSV <source> as Parquet beside it, exactly (see save_text)."""
    source = Path(source)
    raw = source.read_bytes().decode("utf-8")
    return save_text(target or source.with_suffix(".parquet"), raw,
                     "\t" if source.suffix == ".tsv" else ",", names)


def _as_csv(path):
    """The table as CSV with a header row and its notes, for reading or editing."""
    return _render(path, ",", "\n", True)


def _from_csv(source, path):
    """Replace the table at path with an edited CSV (as _as_csv writes it),
    keeping its delimiter and line ending; notes come from the CSV."""
    path = Path(path)
    layout = _layout(path) if path.exists() else {"delimiter": ",", "header": True}
    notes_raw, names, body, _, inline = _parse(Path(source).read_text(encoding="utf-8"), ",", True)
    if any(len(r) != len(names) for r in body):
        raise SystemExit(f"{source}: rows of uneven width")
    if not layout.get("header", True):
        names = list(pq.read_schema(path).names)
        inline = [[pos - 1, note] for pos, note in inline]
    layout.update(notes_raw=notes_raw, notes=[n[2:] if n.startswith("# ") else n[1:] for n in notes_raw],
                  inline_notes=inline)
    layout.pop("source_sha256", None)
    _save(path, names, [_typed([r[i] for r in body]) for i in range(len(names))], layout)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("show").add_argument("table")
    sub.add_parser("text").add_argument("table")
    p = sub.add_parser("to-csv"); p.add_argument("table"); p.add_argument("csv")
    p = sub.add_parser("from-csv"); p.add_argument("csv"); p.add_argument("table")
    sub.add_parser("edit").add_argument("table")
    p = sub.add_parser("convert"); p.add_argument("source"); p.add_argument("--names", nargs="+")
    a = ap.parse_args()
    if a.cmd == "show":
        sys.stdout.write(_as_csv(a.table))
    elif a.cmd == "text":
        sys.stdout.write(text(a.table))
    elif a.cmd == "to-csv":
        Path(a.csv).write_text(_as_csv(a.table), encoding="utf-8")
    elif a.cmd == "from-csv":
        _from_csv(a.csv, a.table)
    elif a.cmd == "edit":
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8") as fh:
            fh.write(_as_csv(a.table))
        subprocess.run([os.environ.get("EDITOR", "vi"), fh.name], check=True)
        _from_csv(fh.name, a.table)
        os.unlink(fh.name)
    elif a.cmd == "convert":
        print(convert(a.source, names=a.names))


if __name__ == "__main__":
    main()
