import re,sys
from bs4 import BeautifulSoup, Tag
h=open('boards_concat.html').read()
parts=re.split(r'<!-- BOARD (\w+) -->',h)
rows=[]
def label(el):
    c=el.get('class',[]); i=el.get('id')
    if el.name=='header' and 'w4-q' in c: return None
    if 'rx-drawers' in c:
        return 'drawers['+' | '.join(s.get_text(' ',strip=True) for s in el.select(':scope > details > summary'))+']'
    if el.name=='p': 
        cl=(c[0] if c else 'p')
        return {'sub':'lead','w4-box-intro':'intro','axis-note':'note','fineprint':'fineprint','w4-scope-note':'scope-note'}.get(cl,cl)
    if 'notice' in c: return 'notice'
    if 'plot' in c or el.name=='figure':
        t=el.find(['h3','figcaption'])
        host=el.select_one('[id].chart-host, .chart-host[id], [id].w4-figure-body, [data-strip], [data-more], figure[id]')
        hid=''
        if host is not None:
            hid=host.get('id') or ('strip:'+host['data-strip'] if host.get('data-strip') else ('more:'+host['data-more'] if host.get('data-more') else ''))
        if el.get('id'): hid=el.get('id')
        tt=(t.find('b').get_text(strip=True) if t and t.name=='figcaption' and t.find('b') else (t.get_text(' ',strip=True) if t else ''))
        return f'fig«{tt[:40]}»{("#"+hid) if hid else ""}'
    if 'rx-seg-row' in c or 'axis-modes' in c or 'rx-seg' in c: return 'seg'
    if el.name=='table': return 'table'
    if el.name=='h3': return 'h3«'+el.get_text(strip=True)[:30]+'»'
    if 'rx-groups' in c: return 'groups'
    if 'longhaul-stack' in c: return 'stack['+', '.join(filter(None,(label(x) for x in el.find_all(recursive=False) if isinstance(x,Tag))))+']'
    if el.name=='div' and not c: return None
    return el.name+('.'+c[0] if c else '')+(('#'+i) if i else '')
def col(el):
    out=[]
    for x in el.find_all(recursive=False):
        if not isinstance(x,Tag): continue
        l=label(x)
        if l is None and x.name=='div' and not x.get('class'):
            out+=col(x); continue
        if l: out.append(l)
    return out
for k in range(1,len(parts),2):
    board=parts[k]; soup=BeautifulSoup(parts[k+1],'html.parser')
    for card in soup.select('.w4-card, .w4-intro'):
        blk=card.select_one(':scope > .w4-q-block[id]')
        sec=card.find_parent('section')
        cid=card.get('id') or (blk.get('id') if blk else ('intro card of #'+(sec.get('id') if sec else '?')))
        if cid.startswith('intro card') and card.select_one('#w4m-root'): cid='#cut-methods panel (w4m tab)'
        if 'w4-intro' in card.get('class',[]): cid='(intro) '+(card.find_parent('section').get('id') if card.find_parent('section') else '')
        num=card.select_one('header.w4-q .w4-num'); num=num.get_text(strip=True) if num else ''
        two=card.select_one(':scope > .w4-two') or (card if 'w4-two' in card.get('class',[]) else None)
        if two is None:
            inner=card.select_one(':scope > .w4-q-block > .w4-two')
            two=inner
        left=right=''
        if two is not None:
            cols=[x for x in two.find_all(recursive=False) if isinstance(x,Tag)]
            if len(cols)>=2:
                left=', '.join(col(cols[0]) if cols[0].name=='div' and not cols[0].get('class') else [label(cols[0]) or cols[0].name])
                right=', '.join(col(cols[1]) if cols[1].name=='div' and not cols[1].get('class') else [label(cols[1]) or cols[1].name])
        figrow=card.select_one('.rx-fig-row')
        fr=', '.join(col(figrow)) if figrow else ''
        rest=', '.join(x for x in col(card) if not x.startswith('div.w4-two')) if two is None else ''
        rows.append((board,cid,num,left,right,fr,rest))
print('| Board | Card | No. | Left column, in order | Right column | Figure row | Single column (no .w4-two) |')
print('|---|---|---|---|---|---|---|')
for r in rows: print('| '+' | '.join(x.replace('|','/') for x in r)+' |')
