import json,re,html,pathlib
# USCIS "Historical Data" table, H-1B Electronic Registration Process page, read 2026-09-28
U=[("March 2020",269424,28125,124415),("March 2021",301447,90143,131924),("March 2022",474421,165180,127600),
   ("March 2023",758994,408891,188400),("March 2024",470342,47314,135137),("March 2025",343981,7828,120141)]
per=[e/s for _,e,_,s in U]; multi=[100*m/e for _,e,m,_ in U]
HL={"March 2022","March 2023"}
W,H=556,250; L,R,T,B=44,20,30,56
xs=[L+i*(W-L-R)/(len(U)-1) for i in range(len(U))]
ymax=4.5; y=lambda v: T+(H-T-B)*(1-v/ymax)
s=[f'<svg viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="Eligible registrations per selected registration, every draw from March 2020 to March 2025" style="display:block;max-width:100%">']
x0=xs[2]-26; x1=xs[3]+26
s.append(f'<rect x="{x0:.1f}" y="{T-18}" width="{x1-x0:.1f}" height="{H-B-T+18}" rx="8" fill="#eef3f9"/>')
s.append(f'<text x="{(x0+x1)/2:.1f}" y="{T-6}" text-anchor="middle" font-size="11" font-weight="700" fill="#14618f">The draws this box splits by employer</text>')
for v in (0,1,2,3,4):
    s.append(f'<line x1="{L}" x2="{W-R}" y1="{y(v):.1f}" y2="{y(v):.1f}" stroke="#eaf0f7"/><text x="{L-8}" y="{y(v)+4:.1f}" text-anchor="end" font-size="10.5" fill="#7a8fac">{v}</text>')
s.append(f'<polyline points="{" ".join(f"{xs[i]:.1f},{y(p):.1f}" for i,p in enumerate(per))}" fill="none" stroke="#0f2340" stroke-width="2.4" stroke-linejoin="round"/>')
for i,(lab,e,m,se) in enumerate(U):
    hl=lab in HL
    s.append(f'<g><title>{lab}: {e:,} eligible registrations, {se:,} selected, {per[i]:.1f} per selection; {multi[i]:.0f}% for workers registered more than once</title><circle cx="{xs[i]:.1f}" cy="{y(per[i]):.1f}" r="{5 if hl else 4}" fill="{"#0f2340" if hl else "#ffffff"}" stroke="#0f2340" stroke-width="2"/></g>')
    s.append(f'<text x="{xs[i]:.1f}" y="{y(per[i])-10:.1f}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#0f2340">{per[i]:.1f}</text>')
    mon,yr=lab.split()
    s.append(f'<text x="{xs[i]:.1f}" y="{H-B+18}" text-anchor="middle" font-size="11" font-weight="{"700" if hl else "500"}" fill="{"#0f2340" if hl else "#46618a"}">{mon[:3]} {yr}</text>')
    s.append(f'<text x="{xs[i]:.1f}" y="{H-B+34}" text-anchor="middle" font-size="10.5" fill="#7a8fac">{multi[i]:.0f}% multi</text>')
xr=xs[4]
s.append(f'<line x1="{(xs[3]+xs[4])/2:.1f}" x2="{(xs[3]+xs[4])/2:.1f}" y1="{T}" y2="{H-B}" stroke="#7a8fac" stroke-dasharray="3 3"/>')
s.append(f'<text x="{(xs[3]+xs[4])/2+6:.1f}" y="{H-B-8}" font-size="10.5" fill="#46618a">one entry per worker from here</text>')
s.append('</svg>')
FIG1=("<figure class=\"w4-figure\"><figcaption><b>Every draw since 2020</b><span>Eligible registrations per selected registration, from USCIS's published totals; the line under each date is the share of registrations for a worker registered more than once. From March 2024 USCIS drew by person, not by registration.</span></figcaption>"
      f'<div class="w4-figure-body">{"".join(s)}</div></figure>')
# the by-employer slopegraph, labels on the correct sides
d=json.load(open("/Users/gyula/Documents/Projects/code/02805-social-graphs/.claude/worktrees/week-4-design-6991bf/docs/weeks/week04/data/more.json"))["lottery"]
col={"All employers":"#0f2340","Placing firms":"#f2820c","Direct employers":"#1f8fd6"}
W2,H2=556,210; xa,xb=190,366; lo,hi=3.5,10
yy=lambda v: 16+(H2-50)*(1-(v-lo)/(hi-lo))
g=[f'<svg viewBox="0 0 {W2} {H2}" width="{W2}" height="{H2}" role="img" aria-label="Registrations per approved petition by kind of employer, {d["draws"][0]} against {d["draws"][1]}" style="display:block;max-width:100%">',
   f'<line x1="{xa}" x2="{xa}" y1="8" y2="{H2-30}" stroke="#eaf0f7"/><line x1="{xb}" x2="{xb}" y1="8" y2="{H2-30}" stroke="#eaf0f7"/>',
   f'<text x="{xa}" y="{H2-10}" text-anchor="middle" font-size="12" font-weight="600" fill="#46618a">{d["draws"][0]}</text><text x="{xb}" y="{H2-10}" text-anchor="middle" font-size="12" font-weight="600" fill="#46618a">{d["draws"][1]}</text>']
for sr in d["series"]:
    a,b=sr["values"]; c=col[sr["label"]]
    g.append(f'<g><title>{sr["label"]}: {a:.1f} registrations per approval in {d["draws"][0]}, {b:.1f} in {d["draws"][1]}</title><line x1="{xa}" x2="{xb}" y1="{yy(a):.1f}" y2="{yy(b):.1f}" stroke="{c}" stroke-width="2.4"/><circle cx="{xa}" cy="{yy(a):.1f}" r="4.5" fill="{c}"/><circle cx="{xb}" cy="{yy(b):.1f}" r="4.5" fill="{c}"/></g>')
    g.append(f'<text x="{xa-10}" y="{yy(a)+4:.1f}" text-anchor="end" font-size="12" font-weight="700" fill="{c}">{sr["label"]} {a:.1f}</text>')
    g.append(f'<text x="{xb+10}" y="{yy(b)+4:.1f}" font-size="12" font-weight="700" fill="{c}">{b:.1f}</text>')
g.append('</svg>')
p=pathlib.Path("v72/project/RTopicPaperwork.dc.html"); t=p.read_text()
a=t.index('<div class="rx-panel" style="display: {{d2}}">'); b=t.index('<div class="rx-panel" style="display: {{d3}}">'); panel=t[a:b]
fig_old=re.search(r'<figure class="w4-figure">\s*<figcaption><b>Registrations per approved petition</b>.*?</figure>',panel,re.S).group(0)
fig2=re.sub(r'<svg.*?</svg>',"".join(g).replace('\\','\\\\'),fig_old,flags=re.S).replace("Each line joins one kind of employer across the two draws.","Each line joins one kind of employer across the two draws Bloomberg's USCIS files cover.")
new_right=f'<div style="display: flex; flex-direction: column; gap: 22px">{FIG1}{fig2}</div>'
panel=panel.replace(fig_old,new_right)
todo=re.search(r'<div class="notice rx-todo">.*?</div>',panel,re.S).group(0)
first,peak,last=per[0],per[3],per[5]
note=(f'<div class="notice"><span class="ico">💡</span><span><b>What to notice</b> The two draws this box can split by employer were the most crowded: '
      f'registrations per selection rose from {first:.1f} in March 2020 to {peak:.1f} in March 2023, then fell to {last:.1f} by March 2025 once each worker counted once.</span></div>')
panel=panel.replace(todo,note)
t=t[:a]+panel+t[b:]
pathlib.Path("lot/project/RTopicPaperwork.dc.html").write_text(t)
print([round(x,2) for x in per],[round(x) for x in multi])
