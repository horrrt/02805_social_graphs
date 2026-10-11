"""HTTP for every script that downloads: one requests session per caller,
with urllib3's retry doing the backoff.

A session retries a dropped connection, a timeout, a 429 and a 5xx, waiting
out the server's Retry-After when it sends one and backing off exponentially
when it does not; anything else (a 404, a 403) raises at once. Each script
keeps its own User-Agent, because the services differ on what they accept:

- Wikipedia, Wikidata and query.wikidata.org want a client name and contact;
- www.sec.gov and bls.gov refuse a browser-looking agent unless it names a
  contact, which agent(contact=True) builds from CONTACT_EMAIL;
- the USCIS hub's Tableau server refuses Python's default agent and nothing else.

    s = fetch.session("my-script/1.0 (contact)")
    data = fetch.json(s, url, params={...})
    fetch.download(url, dest, user_agent="...")   # aria2c when on PATH

download() writes to <name>.part and renames only when the size matches the
server's Content-Length (unknown for a compressed response), so a cut-off
download never sits under the real name. With aria2c on PATH it uses sixteen
connections and resumes; many servers throttle per connection.
"""

import os
import shutil
import subprocess
import time
from pathlib import Path

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

PROJECT = "02805-social-graphs course project (DTU; https://github.com/horrrt/02805_social_graphs)"
RETRY_ON = (429, 500, 502, 503, 504)


def agent(name=PROJECT, contact=False):
    """A User-Agent naming the project, with CONTACT_EMAIL when contact is set
    (and a SystemExit when it is needed but unset)."""
    if not contact:
        return name
    email = os.environ.get("CONTACT_EMAIL")
    if not email:
        raise SystemExit("CONTACT_EMAIL is unset: set CONTACT_EMAIL=you@example.com and rerun.")
    return f"Mozilla/5.0 (research; {email})" if contact == "browser" else f"{name} ({email})"


def session(user_agent=None, headers=None, tries=6, backoff=1.0, min_interval=0.0):
    """A requests session that retries (see the module docstring). min_interval
    spaces its requests out, for APIs that answer 429 above a few a second."""
    s = requests.Session()
    retry = Retry(total=tries, connect=tries, read=tries, status=tries, backoff_factor=backoff,
                  backoff_max=60, status_forcelist=RETRY_ON, allowed_methods=None,
                  respect_retry_after_header=True, raise_on_status=False)
    adapter = HTTPAdapter(max_retries=retry)
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    s.headers["User-Agent"] = user_agent or PROJECT
    s.headers.update(headers or {})
    if min_interval:
        last = [0.0]

        def pace(*_args, **_kwargs):
            gap = time.monotonic() - last[0]
            if gap < min_interval:
                time.sleep(min_interval - gap)
            last[0] = time.monotonic()
        s.hooks["response"].append(pace)
    return s


def get(s, url, timeout=60, **kwargs):
    """GET through session s; raise on any status that is not 2xx after retries."""
    r = s.get(url, timeout=timeout, **kwargs)
    r.raise_for_status()
    return r


def json(s, url, timeout=60, **kwargs):
    return get(s, url, timeout=timeout, **kwargs).json()


def content(s, url, timeout=60, **kwargs):
    return get(s, url, timeout=timeout, **kwargs).content


def download(url, dest, user_agent=None, timeout=120, quiet=False):
    """Fetch url to dest via dest.part; a dest already there is kept as is."""
    dest = Path(dest)
    if dest.exists():
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    part = dest.with_name(dest.name + ".part")
    if not quiet:
        print(f"downloading {url}", flush=True)
    aria = shutil.which("aria2c")
    if aria:
        cmd = [aria, "-x", "16", "-s", "16", "-k", "1M", "-c", "--auto-file-renaming=false",
               "--allow-overwrite=true", "--console-log-level=warn", "--summary-interval=0", "--download-result=hide",
               f"--timeout={timeout}", "-d", str(part.parent), "-o", part.name, url]
        if user_agent:
            # --user-agent, not --header: aria2 sends its own agent beside a header one.
            cmd.insert(1, f"--user-agent={user_agent}")
        subprocess.run(cmd, check=True)
    else:
        with session(user_agent).get(url, timeout=timeout, stream=True) as r:
            r.raise_for_status()
            expected = r.headers.get("Content-Length")
            encoded = r.headers.get("Content-Encoding")
            with open(part, "wb") as fh:
                for chunk in r.iter_content(1 << 20):
                    fh.write(chunk)
        # A compressed response reports its size on the wire, not on disk.
        if expected and not encoded and part.stat().st_size != int(expected):
            raise SystemExit(f"{dest.name}: got {part.stat().st_size} bytes, expected {expected}")
    part.rename(dest)
    return dest
