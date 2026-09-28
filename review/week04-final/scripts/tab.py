import re,pathlib,html
S=pathlib.Path("v73/project"); O=pathlib.Path("tab/project")
CSS="""/* tables */
.rx main table{width:100%;border-collapse:separate;border-spacing:0;font-size:12.5px;line-height:1.4;background:#fff;border:1px solid #dce5f0;border-radius:10px;overflow:hidden;margin-top:6px}
.rx main table caption{caption-side:top;text-align:left;font-size:13px;font-weight:700;color:#0f2340;padding:0 2px 8px}
.rx main table th{background:#f7fafd;color:#46618a;font-size:11.5px;font-weight:600;text-align:left;padding:9px 12px;border-bottom:1px solid #dce5f0;white-space:nowrap}
.rx main table td{padding:8px 12px;border-top:1px solid #eef3f9;color:#0f2340;vertical-align:middle}
.rx main table tbody tr:first-child td{border-top:none}
.rx main table tbody tr:hover td{background:#f7fafd}
.rx main table td:first-child{font-weight:600}
.rx main table th.num,.rx main table td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.rx main table td.soft{color:#46618a}
.rx .rx-cell{display:flex;align-items:center;justify-content:flex-end;gap:10px}
.rx .rx-bar{flex:none;width:72px;height:6px;border-radius:999px;background:#eef3f9;overflow:hidden;display:flex;justify-content:flex-start}
.rx .rx-bar i{display:block;height:100%;border-radius:999px;background:#14618f}
.rx .rx-bar.meter i{background:#7fa9cf}
.rx .rx-table-block{margin-top:18px}
.rx .rx-table-block h4{margin:0 0 4px;font-size:13px;font-weight:700;color:#0f2340}
.rx .rx-table-block p{margin:0 0 6px;font-size:12px;color:#46618a}
"""
NUM=re.compile(r'^[−\-+]?[\d,]+(\.\d+)?(%|×)?$|^[−\-+]?\d*\.\d+(\s*±\s*\d*\.?\d+)?$')
BARHDR=re.compile(r'filings|links|weight|registrations|certified|clients|vendors|firms|edges',re.I)
def txt(c): return html.unescape(re.sub(r'<[^>]+>','',c)).strip()
def val(s): return float(s.replace(',','').replace('%','').replace('−','-').replace('×','').split('±')[0])
def do_table(tb):
    head=re.search(r'<thead>.*?</thead>',tb,re.S)
    ths=re.findall(r'<th([^>]*)>(.*?)</th>',head.group(0),re.S) if head else []
    body=re.search(r'<tbody>(.*?)</tbody>',tb,re.S) or re.search(r'</thead>(.*)$',tb,re.S) or re.search(r'^(.*)$',tb,re.S)
    rows=re.findall(r'<tr[^>]*>(.*?)</tr>',body.group(1),re.S)
    cells=[re.findall(r'<td([^>]*)>(.*?)</td>',r,re.S) for r in rows]
    ncol=max((len(c) for c in cells),default=0)
    numcol=[]; 
    for j in range(ncol):
        col=[txt(r[j][1]) for r in cells if len(r)>j and txt(r[j][1])]
        numcol.append(bool(col) and j>0 and sum(bool(NUM.match(x)) for x in col)>=0.8*len(col))
    hdr=[txt(h[1]) for h in ths]
    barj=next((j for j in range(ncol) if numcol[j] and j<len(hdr) and BARHDR.search(hdr[j]) and not re.match(r'\d{4}',hdr[j]) and not any(txt(r[j][1]).endswith('%') for r in cells if len(r)>j)),None)
    meters=[j for j in range(ncol) if numcol[j] and j<len(hdr) and re.search(r'share|placed',hdr[j],re.I) and all(txt(r[j][1]).endswith('%') for r in cells if len(r)>j and txt(r[j][1]))][:1]
    mx=max((val(txt(r[barj][1])) for r in cells if len(r)>barj and NUM.match(txt(r[barj][1]))),default=0) if barj is not None else 0
    def cls(attrs,add):
        if 'class="' in attrs: return re.sub(r'class="([^"]*)"',lambda m:f'class="{m.group(1)} {add}"' if add not in m.group(1).split() else m.group(0),attrs,1)
        return attrs+f' class="{add}"'
    # header
    if head:
        hs=head.group(0); k=[0]
        def th_sub(m):
            j=k[0]; k[0]+=1
            a=m.group(1)
            if j<ncol and numcol[j]: a=cls(a,'num')
            return f'<th{a}>{m.group(2)}</th>'
        tb=tb.replace(hs,re.sub(r'<th([^>]*)>(.*?)</th>',th_sub,hs,flags=re.S))
    # body cells
    def tr_sub(m):
        row=m.group(0); k=[0]
        def td_sub(mm):
            j=k[0]; k[0]+=1; a=mm.group(1); c=mm.group(2); tv=txt(c)
            if j<ncol and numcol[j]:
                a=cls(a,'num')
                if j==barj and mx>0 and NUM.match(tv):
                    w=max(2,100*val(tv)/mx); c=f'<span class="rx-cell"><span class="rx-bar"><i style="width: {w:.1f}%"></i></span><span>{c.strip()}</span></span>'
                elif j in meters and NUM.match(tv):
                    w=min(100,max(2,val(tv))); c=f'<span class="rx-cell"><span class="rx-bar meter"><i style="width: {w:.1f}%"></i></span><span>{c.strip()}</span></span>'
            elif j>0 and j<ncol and not numcol[j]: a=cls(a,'soft')
            return f'<td{a}>{c}</td>'
        return re.sub(r'<td([^>]*)>(.*?)</td>',td_sub,row,flags=re.S)
    tb=re.sub(r'<tr[^>]*>.*?</tr>',tr_sub,tb,flags=re.S)
    return tb,barj,meters
report={}
for f in sorted(S.glob("R*.dc.html")):
    t=f.read_text()
    if '<table' not in t: continue
    # the 25-largest table: a titled block instead of an open expander
    m=re.search(r'<details open="open">\s*<summary>The 25 largest clients as a table</summary>(.*?)</details>',t,re.S)
    if m: t=t[:m.start()]+'<div class="rx-table-block"><h4>The 25 largest clients</h4><p>Filings placed at each client in the year, how many outsourcing firms supply it, and its largest supplier\'s share.</p>'+m.group(1)+'</div>'+t[m.end():]
    out=[]; pos=0; info=[]
    for mt in re.finditer(r'(<table[^>]*>)(.*?)(</table>)',t,re.S):
        new,barj,met=do_table(mt.group(2)); info.append((barj,met))
        out.append(t[pos:mt.start()]+mt.group(1)+new+mt.group(3)); pos=mt.end()
    t="".join(out)+t[pos:]
    t=t.replace("</style>\n</helmet>",CSS+"</style>\n</helmet>",1)
    assert t.count('<td')==t.count('</td>')
    (O/f.name).write_text(t); report[f.name]=info
for k,v in report.items(): print(k,v)
