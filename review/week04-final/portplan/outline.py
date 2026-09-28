import sys,re
from bs4 import BeautifulSoup, NavigableString, Tag
def txt(el,n=70):
    t=re.sub(r'\s+',' ',el.get_text(' ',strip=True))
    return t[:n]+('…' if len(t)>n else '')
def walk(el,depth,out):
    for c in el.children:
        if not isinstance(c,Tag): continue
        cls=' '.join(c.get('class',[])); i=c.get('id')
        tag=c.name
        key=None
        if tag in('script','style','svg','img','tbody','option','datalist'):
            if tag=='svg' and depth<12: out.append('  '*depth+f'<svg {("#"+i) if i else ""}>')
            continue
        if tag=='header' and 'w4-q' in cls:
            num=c.find(class_='w4-num'); h=c.find(['h2','h3']); a=c.find(class_='w4-answer')
            out.append('  '*depth+f'[Q {num.get_text(strip=True) if num else "-"}] {txt(h,90) if h else ""} || {txt(a,80) if a else ""}'); continue
        if tag=='header' and 'w4-opener' in cls:
            out.append('  '*depth+f'[OPENER] {txt(c,120)}'); continue
        if tag=='details':
            s=c.find('summary'); out.append('  '*depth+f'<details .{cls} #{i}> «{txt(s,70) if s else ""}»')
            walk(c,depth+1,out); continue
        if tag=='p' or (tag=='div' and 'notice' in cls.split()):
            out.append('  '*depth+f'<{tag} .{cls}{" #"+i if i else ""}> {txt(c,60)}'); continue
        if tag in('h2','h3','h4','figcaption'):
            out.append('  '*depth+f'<{tag}> {txt(c,90)}'); continue
        if tag=='summary': continue
        if tag=='button':
            out.append('  '*depth+f'<button{" #"+i if i else ""} {c.get("data-panel") or ""} pressed={c.get("aria-pressed")}> {txt(c,40)}'); continue
        if tag=='span' and 'w4-term' in cls: continue
        interesting = i or any(k.startswith('rx-') for k in cls.split()) or tag in ('section','article','figure','table','nav','ul','ol','label','select','input') or cls.split() and cls.split()[0] in ('card','plot','w4-two','w4-figure','chart-host','w4-figure-body','axis-modes','w4m','w4m-panel','staffing','w4-reveals','w4-tip','longhaul-stack','qa-body','w4-q-block','select-row','w4-example')
        if interesting:
            extra=' '.join(f'{k}={v}' for k,v in c.attrs.items() if k.startswith('data-'))
            out.append('  '*depth+f'<{tag} .{cls}{" #"+i if i else ""} {extra}>')
            walk(c,depth+1,out)
        else:
            walk(c,depth,out)
f=sys.argv[1]
s=open(f).read()
soup=BeautifulSoup(s,'html.parser')
root=soup.find('main') or soup
start=None
if len(sys.argv)>2:
    root=soup.find(id=sys.argv[2])
out=[]
walk(root,0,out)
print('\n'.join(out))
