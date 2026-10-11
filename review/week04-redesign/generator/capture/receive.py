"""Accept captured boards over POST and write them under build/canvas-capture/:
python review/week04-redesign/generator/capture/receive.py   (port 8768; POST /<name> with the file as the body)"""
import re
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

OUT = Path(__file__).resolve().parents[4] / "build/canvas-capture"
OUT.mkdir(parents=True, exist_ok=True)


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        name = self.path.strip("/")
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,80}", name):
            self.send_response(400)
            self.end_headers()
            return
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        (OUT / name).write_bytes(body)
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        print("wrote", name, len(body), flush=True)


HTTPServer(("127.0.0.1", 8768), Handler).serve_forever()
