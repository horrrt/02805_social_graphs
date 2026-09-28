import json,re,pathlib
R="/Users/gyula/Documents/Projects/code/02805-social-graphs/.claude/worktrees/week-4-design-6991bf/"
d=json.load(open(R+"docs/weeks/week04/data/staffing_clients.json"))
used=sorted({i for y in d["years"].values() for c in y["shown"] for i,_ in c["top"]})
remap={i:k for k,i in enumerate(used)}
firms=[d["firms"][i] for i in used]
years={y:[[c["name"],c["filings"],c["vendors"],[[remap[i],n] for i,n in c["top"]],c["rest"]] for c in v["shown"]] for y,v in d["years"].items()}
DATA=json.dumps({"firms":firms,"years":years,"months":{y:v["months"] for y,v in d["years"].items()}},separators=(",",":"),ensure_ascii=False)
print("data bytes",len(DATA))
N=9
rows="".join(f'<path d="{{{{r{k}.d}}}}" fill="none" stroke="#f2820c" stroke-width="{{{{r{k}.sw}}}}" opacity="{{{{r{k}.op}}}}" visibility="{{{{r{k}.vis}}}}"><title>{{{{r{k}.tip}}}}</title></path>'
             f'<text x="0" y="{{{{r{k}.ty}}}}" font-size="12" font-weight="{{{{r{k}.fw}}}}" fill="{{{{r{k}.fill}}}}" visibility="{{{{r{k}.vis}}}}">{{{{r{k}.name}}}}</text>'
             f'<text x="192" y="{{{{r{k}.ty}}}}" font-size="12" font-weight="600" fill="#46618a" text-anchor="end" visibility="{{{{r{k}.vis}}}}">{{{{r{k}.n}}}}</text>' for k in range(N))
SVG=(f'<svg viewBox="0 0 460 236" width="460" height="236" role="img" aria-label="{{{{egoAria}}}}" style="display:block;max-width:100%">{rows}'
     '<circle cx="398" cy="110" r="30" fill="#0f2340"></circle>'
     '<text x="398" y="{{egoL1y}}" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">{{egoL1}}</text>'
     '<text x="398" y="123" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">{{egoL2}}</text>'
     '<text x="398" y="160" font-size="11.5" font-weight="700" fill="#0f2340" text-anchor="middle">{{egoFilings}}</text></svg>')
CTRL=('<div class="rx-ego-ctrl"><div class="rx-seg" role="group" aria-label="Year">'
      + "".join(f'<button type="button" aria-pressed="{{{{egoOn{y}}}}}" onClick="{{{{egoPick{y}}}}}">{y}</button>' for y in years)
      + '</div><label class="rx-ego-search"><span>Client</span><input type="search" value="{{egoQ}}" onChange="{{egoOnQ}}" placeholder="Type any client, e.g. Apple" aria-label="Find a client" /></label></div>'
      '<sc-if value="{{egoHasMatches}}" hint-placeholder-val="{{false}}"><div class="rx-ego-matches"><sc-for list="{{egoMatches}}" as="m" hint-placeholder-count="4"><button type="button" onClick="{{m.pick}}">{{m.name}}<span>{{m.filings}}</span></button></sc-for></div></sc-if>'
      '<sc-if value="{{egoNoMatch}}" hint-placeholder-val="{{false}}"><p class="rx-ego-none">No client with 20 or more placed filings matches in {{egoYear}}.</p></sc-if>')
CSS=""".rx .rx-ego-ctrl{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;margin:2px 0 10px}
.rx .rx-ego-search{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:700;color:#46618a}
.rx .rx-ego-search input{font:inherit;font-size:13px;font-weight:500;color:#0f2340;border:1px solid #dce5f0;border-radius:999px;padding:6px 12px;width:210px;background:#fff}
.rx .rx-ego-search input:focus{outline:2px solid #14618f;outline-offset:1px}
.rx .rx-ego-matches{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
.rx .rx-ego-matches button{font:inherit;font-size:12.5px;font-weight:600;color:#0f2340;background:#fff;border:1px solid #dce5f0;border-radius:999px;padding:5px 11px;cursor:pointer;display:inline-flex;gap:6px;align-items:baseline}
.rx .rx-ego-matches button:hover{background:#d9ecf9;border-color:#14618f}
.rx .rx-ego-matches button span{color:#7a8fac;font-size:11.5px;font-weight:500}
.rx .rx-ego-none{margin:0 0 10px;font-size:12.5px;color:#7a8fac}
"""
JS='''class Component extends DCLogic {
constructor(props) { super(props); this.state = { egoYear: "2025", egoClient: "Bank of America", egoQ: "" }; }
renderVals() {
const D = EGO_DATA, st = this.state, year = st.egoYear, list = D.years[year] || [];
const num = (v) => Number(v).toLocaleString("en-US");
let c = list.find((x) => x[0] === st.egoClient) || list[0];
const [name, filings, vendors, top, rest] = c;
const rows = top.map(([i, n]) => [D.firms[i], n, false]);
const others = vendors - rows.length;
if (others > 0) rows.push([num(others) + " other firms", rest, true]);
const h = 220, t0 = 14, gap = rows.length > 1 ? (h - 2 * t0) / (rows.length - 1) : 0, cx = 398, cy = 110, xEnd = 200;
const vmax = Math.max(...rows.map((r) => r[1]), 1);
const out = {};
for (let k = 0; k < 9; k++) {
  const r = rows[k];
  if (!r) { out["r" + k] = { d: "M0 0", sw: 0, op: 0, vis: "hidden", tip: "", ty: 0, fw: 600, fill: "#0f2340", name: "", n: "" }; continue; }
  const y = t0 + k * gap, lab = r[0].length > 24 ? r[0].slice(0, 23) + "…" : r[0];
  out["r" + k] = { d: "M" + xEnd + " " + y.toFixed(1) + " C" + (xEnd + 90) + " " + y.toFixed(1) + " " + (cx - 90) + " " + cy + " " + (cx - 30) + " " + cy,
    sw: (1 + 9 * r[1] / vmax).toFixed(1), op: r[2] ? 0.3 : 0.62, vis: "visible", tip: r[0] + ": " + num(r[1]) + " filings",
    ty: (y + 4).toFixed(1), fw: r[2] ? 400 : 600, fill: r[2] ? "#46618a" : "#0f2340", name: lab, n: num(r[1]) };
}
const words = name.split(" "); let best = [name, ""];
if (words.length > 1) { let bd = 1e9; for (let i = 0; i < words.length - 1; i++) { const a = words.slice(0, i + 1).join(" "), b = words.slice(i + 1).join(" "); if (Math.abs(a.length - b.length) < bd) { bd = Math.abs(a.length - b.length); best = [a, b]; } } }
const cut = (s) => s.length > 13 ? s.slice(0, 12) + "…" : s;
const q = st.egoQ.trim().toLowerCase();
const matches = q.length >= 2 ? list.filter((x) => x[0].toLowerCase().includes(q)).slice(0, 6) : [];
const v = { ...out, egoYear: year, egoClientName: name, egoQ: st.egoQ,
  egoL1: cut(best[0]), egoL2: cut(best[1]), egoL1y: best[1] ? 107 : 114, egoFilings: num(filings) + " filings",
  egoVendors: num(vendors), egoMonths: D.months[year] === 12 ? "" : " (October to June only)",
  egoAria: name + " and the " + num(vendors) + " firms that place H-1B workers there in " + year,
  egoOnQ: (e) => this.setState({ egoQ: e.target.value }),
  egoMatches: matches.map((x) => ({ name: x[0], filings: num(x[1]), pick: () => this.setState({ egoClient: x[0], egoQ: "" }) })),
  egoHasMatches: matches.length > 0, egoNoMatch: q.length >= 2 && matches.length === 0 };
Object.keys(D.years).forEach((y) => { v["egoOn" + y] = String(y === year); v["egoPick" + y] = () => this.setState({ egoYear: y }); });
return v;
}
}'''
t=pathlib.Path("v83/project/RS3.dc.html").read_text()
i=t.index('<figcaption><b>One client, many vendors</b>')
fig_end=t.index('</svg></div>',i)+len('</svg></div>')
newfig=('<figcaption><b>One client, many vendors</b><span>{{egoClientName}}\'s largest staffing firms by filings in {{egoYear}}{{egoMonths}}, {{egoVendors}} firms in all; link width is filings placed there. Pick a year or type any client.</span></figcaption>'
        f'<div class="w4-figure-body">{CTRL}{SVG}</div>')
t=t[:i]+newfig+t[fig_end:]
t=t.replace("</style>\n</helmet>",CSS+"</style>\n</helmet>",1)
old='class Component extends DCLogic {\nrenderVals() { return {}; }\n}'
assert old in t
t=t.replace(old,"const EGO_DATA = "+DATA+";\n"+JS)
pathlib.Path("ego/project/RS3.dc.html").write_text(t); print("ok", len(t))
