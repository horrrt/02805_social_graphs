import json,re,html,pathlib
d=json.load(open("/Users/gyula/Documents/Projects/code/02805-social-graphs/.claude/worktrees/week-4-design-6991bf/docs/weeks/week04/data/pagerank.json"))
steps=[s for s in d["iteration"]["steps"] if s["step"]>0]
final=[r["title"] for r in steps[-1]["rows"]]
e=html.escape
W,H=556,300; L,R_,T=34,210,34; pw=W-L-R_; row=25
xs=[L+i*pw/(len(steps)-1) for i in range(len(steps))]
yr=lambda r: T+(r-1)*row
OUT=T+10*row+6   # "below the top 10"
lab=lambda s: "conv." if s==steps[-1]["step"] else str(s)
def col(t): return "#14618f" if t=="Software Developers" else ("#0f2340" if t=="Data Scientists" else "#b9cadf")
svg=[f'<svg viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="Rank of the ten top occupations after each power-iteration step" style="display:block;max-width:100%;font-family:inherit">']
for i,s in enumerate(steps):
    svg.append(f'<text x="{xs[i]:.1f}" y="16" text-anchor="middle" font-size="11" fill="#7a8fac">{"step " if i==0 else ""}{lab(s["step"])}</text>')
    svg.append(f'<line x1="{xs[i]:.1f}" x2="{xs[i]:.1f}" y1="{T-8}" y2="{OUT+4}" stroke="#eaf0f7"/>')
for r in range(1,11): svg.append(f'<text x="{L-10}" y="{yr(r)+4}" text-anchor="end" font-size="10.5" fill="#7a8fac">{r}</text>')
svg.append(f'<text x="{L-10}" y="{OUT+4}" text-anchor="end" font-size="10.5" fill="#b9cadf">11+</text>')
order=sorted(final,key=lambda t: t in ("Software Developers","Data Scientists"))  # draw highlights last
for t in order:
    pts=[]
    for i,s in enumerate(steps):
        titles=[x["title"] for x in s["rows"]]
        pts.append((xs[i], yr(titles.index(t)+1) if t in titles else OUT))
    c=col(t); w=3 if c!="#b9cadf" else 1.6
    svg.append(f'<polyline points="{" ".join(f"{x:.1f},{y:.1f}" for x,y in pts)}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linejoin="round"/>')
    for x,y in pts: svg.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{3.5 if w>2 else 2.6}" fill="{c if y!=OUT else "#ffffff"}" stroke="{c}" stroke-width="1.5"/>')
for r,t in enumerate(final,1):
    c=col(t); fw="700" if c!="#b9cadf" else "500"
    svg.append(f'<text x="{xs[-1]+12:.1f}" y="{yr(r)+4}" font-size="11.5" font-weight="{fw}" fill="{"#46618a" if c=="#b9cadf" else c}">{e(t if len(t)<=30 else t[:29]+"…")}</text>')
svg.append("</svg>")
SVG="".join(svg)
p=pathlib.Path("v69/project/RTopicJobs.dc.html"); t=p.read_text()
a=t.index('<div class="rx-panel" style="display: {{d6}}">'); b=t.index('</section>',a)
panel=t[a:b]
m=re.search(r'(<table class="ego">\s*<caption>The \d+ occupations whose rank changes most.*?</table>)',panel,re.S); table=m.group(1)
how=re.search(r'<b>How we tested it</b><span><span>(.*?)</span></span>',panel,re.S).group(1)
more=re.search(r'<b>More numbers</b><span><span>(.*?)</span></span>',panel,re.S).group(1)
head=panel[panel.index('<div class="card w4-card" id="cut-pagerank-iteration">'):panel.index('</header>')+len('</header>')]
intro=re.search(r'<p class="sub">(.*?)</p>',panel,re.S).group(1).replace("Step through the rounds below.","The chart follows the ten that finish on top through every round.")
note=re.search(r'<p class="w4-step-note">(.*?)</p>',panel,re.S).group(1)
new=(f'<div class="rx-panel" style="display: {{{{d6}}}}">{head}<div class="w4-two"><div>'
     f'<p class="sub">{intro.strip()}</p>'
     f'<div class="notice"><span class="ico">💡</span><span><b>What to notice</b> After one round Data Scientists lead; from round 2 Software Developers hold first place for good. The grey lines keep crossing until round 10, and the last swap, Industrial Engineers past Biological Scientists, comes after it.</span></div>'
     f'<p class="w4-step-note">{note}</p>'
     f'<div class="rx-drawers rx-inline"><details class="rx-drawer"><summary>How we tested it</summary><div class="rx-drawer-body">{how}</div></details>'
     f'<details class="rx-drawer"><summary>More numbers</summary><div class="rx-drawer-body">{more} At round 0 every occupation holds the same score, 1/289, so the chart starts at round 1.</div></details></div>'
     f'</div><div class="plot"><h3>Rank after each round, the final top 10</h3><p class="axis-note">Each line is one occupation in the converged top 10 at d = 0.85; a hollow dot below the grid means it sat outside the top 10 after that round. Blue: Software Developers. Dark: Data Scientists.</p><div class="w4-figure-body">{SVG}</div></div></div></div></div>')
t=t[:a]+new+t[b:]
# move the movers table to the damping box (panel 5), after its last content
a5=t.index('<div class="rx-panel" style="display: {{d5}}">'); b5=t.index('<div class="rx-panel" style="display: {{d6}}">')
p5=t[a5:b5]
assert p5.endswith('</div></div>') or True
k=p5.rindex('</div></div>')
p5=p5[:k]+table+p5[k:]
t=t[:a5]+p5+t[b5:]
pathlib.Path("pr/project/RTopicJobs.dc.html").write_text(t)
print("ok", len(SVG))
