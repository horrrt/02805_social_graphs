import json,re,html,pathlib
X=json.load(open("jobs_crosstab.json"))
J=json.load(open("/Users/gyula/Documents/Projects/code/02805-social-graphs/.claude/worktrees/week-4-design-6991bf/docs/weeks/week04/data/jobs.json"))
Q=J["quality"]
MAJ={"11":"Management","13":"Business and financial","15":"Computer and mathematical","17":"Architecture and engineering","19":"Life, physical and social science","21":"Community and social service","23":"Legal","25":"Education and library","27":"Arts, design and media","29":"Healthcare practitioners","31":"Healthcare support","33":"Protective service","35":"Food preparation","37":"Building and grounds","39":"Personal care","41":"Sales","43":"Office and administrative","47":"Construction","49":"Installation and repair","51":"Production","53":"Transportation"}
e=html.escape
big=[c for c in X["clusters"] if c["size"]>2]; small=[c for c in X["clusters"] if c["size"]<=2]
RAMP=["#14618f","#5b95c2","#a7c5e0"]; REST="#dde4ec"
W=640; rowh=92; H=len(big)*rowh+40; extra=[]
s=[f'<svg viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="Official major groups inside each hiring cluster" style="display:block;height:auto">']
for i,c in enumerate(big):
    y=i*rowh+sum(extra); n=c["size"]
    items=sorted(c["majors"].items(),key=lambda kv:-kv[1]); top=items[:3]; rest=sum(v for _,v in items[3:])
    name=c["largest"] if len(c["largest"])<44 else c["largest"][:42]+"…"
    s.append(f'<text x="0" y="{y+14}" font-size="13" font-weight="700" fill="#0f2340">{e(name)} <tspan font-weight="400" fill="#46618a">cluster, {n} occupations</tspan></text>')
    x=0; bw=W
    segs=[(MAJ.get(k,"Other codes"),v,RAMP[j]) for j,(k,v) in enumerate(top)]+([("All other groups",rest,REST)] if rest else [])
    for lab,v,col in segs:
        w=bw*v/n
        s.append(f'<g><title>{e(lab)}: {v} of {n} occupations ({100*v/n:.0f}%)</title><rect x="{x:.1f}" y="{y+22}" width="{max(w-2,1):.1f}" height="24" rx="4" fill="{col}"/></g>')
        if w>=40: s.append(f'<text x="{x+w/2-1:.1f}" y="{y+38}" text-anchor="middle" font-size="11.5" font-weight="700" fill="{"#ffffff" if col in ("#14618f","#5b95c2") else "#0f2340"}">{100*v/n:.0f}%</text>')
        x+=w
    lx=0; ly=y+64
    for lab,v,col in segs:
        piece=f"{lab} {v}"; wpiece=14+len(piece)*6.4
        if lx+wpiece>W: lx=0; ly+=18
        s.append(f'<rect x="{lx}" y="{ly-9}" width="10" height="10" rx="2" fill="{col}"/><text x="{lx+14}" y="{ly}" font-size="11.5" fill="#46618a">{e(piece)}</text>')
        lx+=wpiece+16
    extra.append(ly-(y+64))
H=len(big)*rowh+sum(extra)
s[0]=re.sub(r'viewBox="0 0 \d+ \d+"',f'viewBox="0 0 {W} {H}"',s[0])
s.append("</svg>")
COMP="".join(s)
nmi=Q["nmi"]; sm=Q["nmi_shuffled"]["mean"]; sx=Q["nmi_shuffled"]["max"]; info=Q["infomap"]["nmi_with_soc"]
W2,H2=410,170; a,b=14,396; xv=lambda v:a+(b-a)*v; axy=96
t=[f'<svg viewBox="0 0 {W2} {H2}" width="100%" role="img" aria-label="Match between hiring clusters and official major groups, from 0 to 1" style="display:block;height:auto">',
   f'<line x1="{a}" x2="{b}" y1="{axy}" y2="{axy}" stroke="#dce5f0" stroke-width="6" stroke-linecap="round"/>']
for v in (0,0.25,0.5,0.75,1):
    t.append(f'<line x1="{xv(v):.1f}" x2="{xv(v):.1f}" y1="{axy+6}" y2="{axy+12}" stroke="#b9cadf"/><text x="{xv(v):.1f}" y="{axy+26}" text-anchor="middle" font-size="11" fill="#7a8fac">{v:g}</text>')
t.append(f'<text x="{a}" y="{axy+46}" font-size="11" fill="#7a8fac">unrelated</text><text x="{b}" y="{axy+46}" text-anchor="end" font-size="11" fill="#7a8fac">the same groups</text>')
t.append(f'<g><title>Shuffled official labels: mean {sm:.2f}, highest of {Q["nmi_shuffled"]["runs"]} shuffles {sx:.2f}</title><rect x="{xv(0):.1f}" y="{axy-8}" width="{xv(sx)-xv(0):.1f}" height="16" rx="8" fill="#b9c6d4"/></g>')
t.append(f'<line x1="{xv(sm):.1f}" x2="{xv(sm):.1f}" y1="{axy-8}" y2="{axy-30}" stroke="#b9c6d4"/><text x="{xv(sm)+6:.1f}" y="{axy-34}" font-size="11.5" fill="#46618a">Shuffled labels {sm:.2f}</text>')
t.append(f'<line x1="{xv(nmi):.1f}" x2="{xv(nmi):.1f}" y1="{axy-9}" y2="{axy-62}" stroke="#f2820c"/><text x="{xv(nmi)-4:.1f}" y="{axy-66}" font-size="12.5" font-weight="700" fill="#0f2340">Hiring clusters {nmi:.2f}</text>')
t.append(f'<line x1="{xv(info):.1f}" x2="{xv(info):.1f}" y1="{axy-8}" y2="{axy-20}" stroke="#0f2340"/><text x="{xv(info)+8:.1f}" y="{axy-22}" font-size="11.5" fill="#0f2340">Infomap {info:.2f}</text>')
t.append(f'<g><title>Shuffled official labels: highest of the shuffles {sx:.2f}</title></g>')
t.append(f'<g><title>Infomap clusters against official groups: NMI {info:.2f}</title><circle cx="{xv(info):.1f}" cy="{axy}" r="6" fill="#ffffff" stroke="#0f2340" stroke-width="2"/></g>')
t.append(f'<g><title>Louvain hiring clusters against official groups: NMI {nmi:.2f}</title><circle cx="{xv(nmi):.1f}" cy="{axy}" r="7.5" fill="#f2820c"/></g>')
t.append("</svg>")
SCALE="".join(t)
p=pathlib.Path("v74/project/RTopicJobs.dc.html"); T=p.read_text()
a0=T.index('<div class="rx-panel" style="display: {{d1}}">'); b0=T.index('<div class="rx-panel" style="display: {{d2}}">'); P=T[a0:b0]
m1=re.search(r'<div class="plot">\s*<h3>Cluster × official major group</h3>.*?</div>\s*</div>',P,re.S)
m2=re.search(r'<div class="plot">\s*<h3>Observed match versus shuffled labels</h3>.*?</div>\s*</div>',P,re.S)
assert m1 and m2, (bool(m1),bool(m2))
tiny=" and ".join(f'{c["largest"]} ({c["size"]})' for c in small)
new1=(f'<div class="plot"><h3>What each hiring cluster holds, by official group</h3><p class="axis-note">Every occupation in a cluster of two or more, {X["occupations"]} in all, split by its official major group: the three largest named, the rest grey. Two more clusters hold two occupations each: {e(tiny)}.</p>'
      f'<div class="w4-figure-body">{COMP}</div></div>')
new2=(f'<div class="plot"><h3>How closely the clusters match the official groups</h3><p class="axis-note">Normalised mutual information from 0 (unrelated) to 1 (the same groups). Orange: the hiring clusters. Ring: Infomap\'s clusters. Grey: the official labels shuffled 100 times over the same clusters, up to their highest score.</p>'
      f'<div class="w4-figure-body">{SCALE}</div></div>')
P=P[:m1.start()]+new1+P[m1.end():]
m2=re.search(r'<div class="plot">\s*<h3>Observed match versus shuffled labels</h3>.*?</div>\s*</div>',P,re.S)
P=P[:m2.start()]+new2+P[m2.end():]
P=P.replace("The shuffled bars keep the clusters fixed and scramble\n                only the official labels.","The shuffled labels keep the clusters fixed and scramble only the official groups.")
T=T[:a0]+P+T[b0:]
pathlib.Path("grp/project/RTopicJobs.dc.html").write_text(T); print("ok")
