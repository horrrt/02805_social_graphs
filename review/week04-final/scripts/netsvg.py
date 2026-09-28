import json,math,html
import networkx as nx
d=json.load(open("/Users/gyula/Documents/Projects/code/02805-social-graphs/.claude/worktrees/week-4-design-6991bf/docs/weeks/week04/data/jobs.json"))
PAL={0:"#1f8fd6",1:"#ea6a33",2:"#1aab7a",3:"#8a63d2"}   # the page's own cluster colours (legend order)
pos_of={c["id"]:i for i,c in enumerate(d["clusters"])}
G=nx.Graph()
for n in d["nodes"]: G.add_node(n["id"])
for e in d["edges"]: G.add_edge(e["source"],e["target"],weight=1+math.log(e["weight"]))
comps=sorted(nx.connected_components(G),key=len,reverse=True)
main=G.subgraph(comps[0]).copy()
pos=nx.kamada_kawai_layout(main)
# expand the dense core: pull radii toward uniform
cx=sum(p[0] for p in pos.values())/len(pos); cy=sum(p[1] for p in pos.values())/len(pos)
for k,(x,y) in list(pos.items()):
    dx,dy=x-cx,y-cy; r=math.hypot(dx,dy)
    if r>0:
        s=r**0.55/r; pos[k]=(cx+dx*s*1.0,cy+dy*s)
W,H=700,580; ml,mr,mt,mb=20,20,40,74
xs=[p[0] for p in pos.values()]; ys=[p[1] for p in pos.values()]
X=lambda v:ml+(W-ml-mr-150)*(v-min(xs))/(max(xs)-min(xs))+75; Y=lambda v:mt+(H-mt-mb)*(v-min(ys))/(max(ys)-min(ys))
P={k:(X(v[0]),Y(v[1])) for k,v in pos.items()}
# other components: small rings in the bottom-right corner
ox,oy=W-60,H-mb-60
for comp in comps[1:]:
    sub=list(comp)
    for i,k in enumerate(sub):
        a=2*math.pi*i/len(sub); P[k]=(ox+34*math.cos(a),oy+34*math.sin(a))
    ox-=110
node={n["id"]:n for n in d["nodes"]}
SHORT={"Software Quality Assurance Analysts and Testers":"Software QA Testers","Market Research Analysts and Marketing Specialists":"Market Research Analysts",
 "Computer and Information Research Scientists":"Computer Research Scientists","Medical and Clinical Laboratory Technologists":"Lab Technologists",
 "Computer and Information Systems Managers":"IT Managers","Network and Computer Systems Administrators":"Network Administrators",
 "Health Specialties Teachers, Postsecondary":"Health Teachers (college)","Engineering Teachers, Postsecondary":"Engineering Teachers (college)",
 "Business Teachers, Postsecondary":"Business Teachers (college)","Architects, Except Landscape and Naval":"Architects",
 "Web and Digital Interface Designers":"Web Designers","General and Operations Managers":"General Managers",
 "Architectural and Engineering Managers":"Engineering Managers","Bioengineers and Biomedical Engineers":"Bioengineers",
 "Electronics Engineers, Except Computer":"Electronics Engineers","Elementary School Teachers, Except Special Education":"Elementary Teachers",
 "Secondary School Teachers, Except Special and Career/Technical Education":"Secondary Teachers","Medical Scientists, Except Epidemiologists":"Medical Scientists",
 "Financial and Investment Analysts":"Financial Analysts","Computer Occupations, All Other":"Computer Occupations (other)","Physicians, All Other":"Physicians (other)"}
short=lambda t:SHORT.get(t,t.replace(", All Other"," (other)").replace(" and "," & ").split(",")[0])
size=lambda f:max(4.5,min(14,3.5+math.sqrt(f)/14))
out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="100%" role="img" aria-label="Occupations linked by the companies that file for both; colour is the hiring cluster" style="display:block;height:auto;font-family:inherit">']
maxw=max(e["weight"] for e in d["edges"])
for e in sorted(d["edges"],key=lambda e:e["weight"]):
    (x1,y1),(x2,y2)=P[e["source"]],P[e["target"]]
    w=0.6+2.2*math.sqrt(e["weight"]/maxw)
    out.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="#9fb4cf" stroke-opacity="0.28" stroke-width="{w:.2f}"/>')
for n in sorted(d["nodes"],key=lambda n:n["filings"]):
    x,y=P[n["id"]]; r=size(n["filings"]); c=PAL[pos_of[n["cluster"]]]
    out.append(f'<g><title>{html.escape(n["title"])}: {n["filings"]:,} filings</title><circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{c}" stroke="#ffffff" stroke-width="1.5"/></g>')
# labels: largest first, first free spot wins
boxes=[(P[k][0]-size(node[k]["filings"]),P[k][1]-size(node[k]["filings"]),P[k][0]+size(node[k]["filings"]),P[k][1]+size(node[k]["filings"])) for k in P]
placed=[]; shown=0; missed=[]
def free(b):
    if b[0]<2 or b[2]>W-2 or b[1]<2 or b[3]>H-mb+6: return False
    for q in placed:
        if not(b[2]<q[0] or b[0]>q[2] or b[3]<q[1] or b[1]>q[3]): return False
    for q in boxes:
        if not(b[2]<q[0]+1 or b[0]>q[2]-1 or b[3]<q[1]+1 or b[1]>q[3]-1): return False
    return True
for n in sorted(d["nodes"],key=lambda n:-n["filings"]):
    x,y=P[n["id"]]; r=size(n["filings"]); t=short(n["title"]); big=n["filings"]>=30000
    fs=12 if big else 10.5; tw=len(t)*fs*0.56; th=fs+2
    for dx,dy,anc in [(r+4,0,"start"),(-r-4,0,"end"),(0,-r-4,"middle"),(0,r+th,"middle"),(r+4,-7,"start"),(r+4,7,"start"),(-r-4,-7,"end"),(-r-4,7,"end"),(r+3,-r-2,"start"),(-r-3,-r-2,"end"),(r+3,r+th-2,"start"),(-r-3,r+th-2,"end")]:
        lx=x+dx; ly=y+dy
        x0=lx if anc=="start" else (lx-tw if anc=="end" else lx-tw/2)
        yb=ly+ (th/2-2 if dy==0 else 0)
        b=(x0-2,yb-th+1,x0+tw+2,yb+3)
        if free(b) and (abs(dy)<1 or True):
            placed.append(b); shown+=1
            out.append(f'<text x="{lx:.1f}" y="{yb:.1f}" text-anchor="{anc}" font-size="{fs}" font-weight="{700 if big else 600}" fill="#0f2340" paint-order="stroke" stroke="#ffffff" stroke-width="3" stroke-linejoin="round">{html.escape(t)}</text>')
            lab_ids.add(n['id']) if False else None
            break
    else:
        key={c["label"] for c in d["clusters"]}
        if n["filings"]>=5000 or n["title"] in key:
            for dx,dy,anc in [(r+4,0,"start"),(-r-4,0,"end"),(0,-r-4,"middle"),(0,r+th,"middle"),(r+4,-9,"start"),(-r-4,-9,"end"),(r+4,9,"start"),(-r-4,9,"end")]:
                lx=x+dx; ly=y+dy
                x0=lx if anc=="start" else (lx-tw if anc=="end" else lx-tw/2)
                yb=ly+(th/2-2 if dy==0 else 0); b=(x0-2,yb-th+1,x0+tw+2,yb+3)
                if b[0]>=2 and b[2]<=W-2 and b[1]>=2 and all(b[2]<q[0] or b[0]>q[2] or b[3]<q[1] or b[1]>q[3] for q in placed):
                    placed.append(b); shown+=1
                    out.append(f'<text x="{lx:.1f}" y="{yb:.1f}" text-anchor="{anc}" font-size="{fs}" font-weight="{700 if big else 600}" fill="#0f2340" paint-order="stroke" stroke="#ffffff" stroke-width="3" stroke-linejoin="round">{html.escape(t)}</text>')
                    break
            else: missed.append((n['filings'],n['title']))
        else: missed.append((n['filings'],n['title']))
# legend
lx=0; ly=H-mb+40
for c in d["clusters"]:
    lab=f'{short(c["label"])} cluster ({c["occupations"]})'
    out.append(f'<circle cx="{lx+6}" cy="{ly-4}" r="5" fill="{PAL[pos_of[c["id"]]]}"/><text x="{lx+16}" y="{ly}" font-size="11.5" fill="#46618a">{html.escape(lab)}</text>')
    lx+=16+len(lab)*6.3+18
    if lx>W-150: lx=0; ly+=18
out.append("</svg>")
open("net.svg","w").write("".join(out))
lab_ids=set()

print("labels",shown,"of",len(d["nodes"])); print(sorted(missed,reverse=True)[:12])
