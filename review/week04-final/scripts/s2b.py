import json,re,html,pathlib
R="/Users/gyula/Documents/Projects/code/02805-social-graphs/.claude/worktrees/week-4-design-6991bf/"
q=json.load(open(R+"docs/weeks/week04/data/jobs_split.json"))["q2"]; qa=json.load(open(R+"analysis/week04_jobs_split.json"))["q2"]
top=q["top15_by_communities_per_link"]; flag=set(q["bridges"]["in_top15"])
e=html.escape
SH={"Education Administrators, Kindergarten through Secondary":"School administrators","Education and Childcare Administrators, Preschool and Daycare":"Preschool administrators",
 "Communications Equipment Operators, All Other":"Communications operators","Electrical Power-Line Installers and Repairers":"Power-line installers",
 "Special Education Teachers, Middle School":"Special ed., middle school","Licensed Practical and Licensed Vocational Nurses":"Practical nurses",
 "Interviewers, Except Eligibility and Loan":"Interviewers","Career/Technical Education Teachers, Middle School":"Career teachers, middle school",
 "Special Education Teachers, Secondary School":"Special ed., secondary","Kindergarten Teachers, Except Special Education":"Kindergarten teachers",
 "Elementary School Teachers, Except Special Education":"Elementary teachers","Marriage and Family Therapists":"Family therapists"}
sh=lambda t:SH.get(t,t)
# chart 1: where the links go (share of the largest community from the page's own text: 85%)
share=0.85; nl=28155; small=qa["link_clusters"]-1; three=qa["link_clusters_of_3_or_more"]
W,H=520,150; bx,bw,by,bh=0,520,46,34
c1=[f'<svg viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="Share of the {nl:,} links in the largest link community" style="display:block;height:auto">',
 f'<rect x="{bx}" y="{by}" width="{bw*share-2:.1f}" height="{bh}" rx="5" fill="#0f2340"/>',
 f'<rect x="{bx+bw*share:.1f}" y="{by}" width="{bw*(1-share):.1f}" height="{bh}" rx="5" fill="#a7c5e0"/>',
 f'<text x="10" y="{by+22}" font-size="13" font-weight="700" fill="#ffffff">One community: {share*100:.0f}% of links</text>',
 f'<text x="{bx+bw*share+bw*(1-share)/2:.1f}" y="{by+22}" text-anchor="middle" font-size="12" font-weight="700" fill="#0f2340">{(1-share)*100:.0f}%</text>',
 f'<text x="0" y="24" font-size="12" fill="#46618a">All {nl:,} links between occupations, split by link community</text>',
 f'<text x="{bw}" y="{by+bh+22}" text-anchor="end" font-size="12" fill="#46618a">{small} smaller communities share the rest;</text>',
 f'<text x="{bw}" y="{by+bh+38}" text-anchor="end" font-size="12" fill="#46618a">only {three} hold three links or more</text>','</svg>']
C1="".join(c1)
# chart 2: links vs communities for the top 15
W,H=520,330; L,Rr,T,B=40,150,16,40
xmax,ymax=70,20
x=lambda v:L+(W-L-Rr)*v/xmax; y=lambda v:T+(H-T-B)*(1-v/ymax)
c2=[f'<svg viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="Links against link communities for the 15 jobs with the most communities per link" style="display:block;height:auto">']
for v in (0,5,10,15,20): c2.append(f'<line x1="{L}" x2="{W-Rr}" y1="{y(v):.1f}" y2="{y(v):.1f}" stroke="#eaf0f7"/><text x="{L-8}" y="{y(v)+4:.1f}" text-anchor="end" font-size="11" fill="#7a8fac">{v}</text>')
for v in (0,10,20,30,40,50,60,70): c2.append(f'<text x="{x(v):.1f}" y="{H-B+18}" text-anchor="middle" font-size="11" fill="#7a8fac">{v}</text>')
c2.append(f'<text x="{(L+W-Rr)/2:.1f}" y="{H-6}" text-anchor="middle" font-size="11.5" fill="#46618a">links (other occupations it shares employers with)</text>')
c2.append(f'<text x="{L-30}" y="{T-4}" font-size="11.5" fill="#46618a">communities</text>')
for r,lab in ((0.4,"1 community per 2.5 links"),(1/3,"1 per 3"),(0.25,"1 per 4")):
    xe=min(xmax,ymax/r); c2.append(f'<line x1="{x(0):.1f}" y1="{y(0):.1f}" x2="{x(xe):.1f}" y2="{y(r*xe):.1f}" stroke="#b9cadf" stroke-dasharray="3 3"/>')
    if r==0.4: c2.append(f'<text x="{x(xe)-6:.1f}" y="{y(r*xe)+4:.1f}" text-anchor="end" font-size="10.5" fill="#7a8fac">{lab}</text>')
    else: c2.append(f'<text x="{x(xe)+4:.1f}" y="{y(r*xe)+4:.1f}" font-size="10.5" fill="#7a8fac">{lab}</text>')
labelled={"Elementary School Teachers, Except Special Education","Special Education Teachers, Secondary School","Education Administrators, Kindergarten through Secondary","Physical Therapist Aides"}|{o["title"] for o in top if o["id"] in flag}
off={"Physical Therapist Aides":(0,-14,"middle"),"Electrical Power-Line Installers and Repairers":(0,22,"middle"),"Interviewers, Except Eligibility and Loan":(8,4,"start")}
for o in top:
    fl=o["id"] in flag; cx,cy=x(o["links"]),y(o["communities"])
    c2.append(f'<g><title>{e(o["title"])}: {o["communities"]} communities over {o["links"]} links ({o["communities_per_link"]:.2f} per link){" · flagged bridge" if fl else ""}</title><circle cx="{cx:.1f}" cy="{cy:.1f}" r="5.5" fill="{"#ffffff" if fl else "#0f2340"}" stroke="#0f2340" stroke-width="{2.2 if fl else 1}"/></g>')
    LEAD={"Physical Therapist Aides":(30,3.6),"Electrical Power-Line Installers and Repairers":(30,1.8)}
    if o["title"] in LEAD:
        lx,ly=x(LEAD[o["title"]][0]),y(LEAD[o["title"]][1])
        c2.append(f'<line x1="{cx+5:.1f}" y1="{cy:.1f}" x2="{lx-4:.1f}" y2="{ly-4:.1f}" stroke="#7a8fac" stroke-width="1"/>')
        c2.append(f'<text x="{lx:.1f}" y="{ly:.1f}" font-size="11" font-weight="{700 if fl else 600}" fill="#0f2340">{e(sh(o["title"]))}{" (bridge)" if fl else ""}</text>')
    elif o["title"] in labelled:
        dx,dy,anc=off.get(o["title"],(8,4,"start"))
        c2.append(f'<text x="{cx+dx:.1f}" y="{cy+dy:.1f}" text-anchor="{anc}" font-size="11" font-weight="{700 if fl else 600}" fill="#0f2340" paint-order="stroke" stroke="#ffffff" stroke-width="3">{e(sh(o["title"]))}{" (bridge)" if fl else ""}</text>')
c2.append('</svg>')
C2="".join(c2)
FIG=(f'<div class="w4-two" style="margin-top: 16px; align-items: start">'
     f'<figure class="w4-figure"><figcaption><b>Where the links go</b><span>Link communities pour almost every link into one community.</span></figcaption><div class="w4-figure-body">{C1}</div></figure>'
     f'<figure class="w4-figure"><figcaption><b>The 15 jobs with the most communities per link</b><span>Each dot is a job; dashed lines mark equal rates. Rings: the two jobs section 2\'s first test flagged as bridges.</span></figcaption><div class="w4-figure-body">{C2}</div></figure></div>')
t=pathlib.Path("v82/project/RS2.dc.html").read_text()
a=t.index('<div class="card w4-card" id="jobs-linkcom">')
seg=t[a:]
k=seg.index('<div class="rx-drawers rx-inline">')
t=t[:a]+seg[:k]+FIG+seg[k:]
# fix the stale bridge flags in the table
seg=t[t.index('id="jobs-linkcom"'):]
def fixrow(m):
    name=m.group(1).replace(' flagged bridge','').strip()
    full={o["title"]:o for o in top}
    return m.group(0)
t=t.replace('Physical Therapist Aides flagged bridge','Physical Therapist Aides').replace('Credit Counselors flagged bridge','Credit Counselors')
for o in top:
    if o["id"] in flag:
        n=o["title"]; assert f'<td>{n}</td>' in t or f'<td>{html.escape(n)}</td>' in t, n
        t=t.replace(f'<td>{n}</td>',f'<td>{n} <span class="tag">flagged bridge</span></td>',1)
pathlib.Path("s2b/project/RS2.dc.html").write_text(t); print("ok", small, three)
