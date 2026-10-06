// Page script for /prototypes/screen-test/, moved out of the page's inline <script type="module">.
import { asset } from "../site.js";
var D = await fetch(asset("assets/data/week02_screentest.json")).then(function(r){
  if(!r.ok) throw new Error("week02_screentest.json did not load");
  return r.json();
});
(function(){
var M=D.meta, $=function(i){return document.getElementById(i);};
var EN=String.fromCharCode(8211), MID=String.fromCharCode(183), PM=String.fromCharCode(177);
var NAMES={marvel:"Marvel", er:"Erd"+String.fromCharCode(337)+"s"+EN+"R"+String.fromCharCode(233)+"nyi",
           ws:"Watts"+EN+"Strogatz", ba:"Barab"+String.fromCharCode(225)+"si"+EN+"Albert"};
var MECH={marvel:"the observed network", er:"links thrown at random",
          ws:"a ring, then rewire a fifth", ba:"newcomers prefer the popular"};
var TOL={path:.20, clus:.25, kmax:.40};
function f(x,n){ return Number(x).toFixed(n); }
function commas(x){ return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

$("snap").textContent = "Snapshot "+M.snapshot;
(function(){
  var v=D.models.marvel, rows=[["Articles",commas(v.n)],["Links",commas(v.m)],
    ["Mean degree",f(M.kbar,2)],["Mean path",f(v.path,2)],["Clustering",f(v.clus,3)],
    ["Largest hub",v.kmax]];
  var dl=$("vitals");
  rows.forEach(function(r){
    var d=document.createElement("div"), dt=document.createElement("dt"), dd=document.createElement("dd");
    dt.textContent=r[0]; dd.textContent=r[1]; d.append(dt,dd); dl.append(d);
  });
})();

/* ---- drawing ---- */
function stage(cv, paint){
  function draw(){
    var r=cv.getBoundingClientRect(); if(!r.width) return;
    var dpr=Math.min(window.devicePixelRatio||1,2);
    cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr);
    var c=cv.getContext("2d"); c.setTransform(dpr,0,0,dpr,0,0);
    paint(c,r.width,r.height);
  }
  new ResizeObserver(draw).observe(cv); cv.__draw=draw; draw(); return draw;
}
function netPainter(get){
  return function(c,w,h){
    var net=get(); c.clearRect(0,0,w,h);
    if(!net) return;
    var pad=13, sx=w-2*pad, sy=h-2*pad, P=net.pos, i;
    var px=function(i){ return [pad+P[i][0]*sx, pad+P[i][1]*sy]; };
    c.lineWidth=.7; c.strokeStyle="rgba(22,24,28,.16)"; c.beginPath();
    for(i=0;i<net.edges.length;i++){
      var a=px(net.edges[i][0]), b=px(net.edges[i][1]);
      c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]);
    }
    c.stroke();
    for(i=0;i<P.length;i++){
      var p=px(i), rad=1.3+Math.sqrt(net.deg[i])*0.52;
      c.beginPath(); c.arc(p[0],p[1],rad,0,6.2832);
      c.fillStyle = net.__real ? "#1b4dd8" : "#16181c"; c.globalAlpha=.78; c.fill(); c.globalAlpha=1;
    }
  };
}
D.nets.marvel.__real=true;
stage($("cv-marvel"), netPainter(function(){ return D.nets.marvel; }));
$("cap-marvel").textContent = "Marvel "+MID+" 277 articles "+MID+" largest hub 106";

/* ---- 01 auditions ---- */
var pick="er";
function verdictCell(model,key){
  var real=D.models.marvel[key], val=D.models[model][key];
  var off=(val-real)/real, ok=Math.abs(off)<=TOL[key];
  return {ok:ok, val:val, off:off};
}
function fmt(key,v){ return key==="kmax" ? String(v) : f(v, key==="clus"?3:2); }
function buildScore(){
  var body=$("score-body"); body.replaceChildren();
  ["marvel","er","ws","ba"].forEach(function(k){
    var tr=document.createElement("tr");
    if(k==="marvel") tr.dataset.real="yes";
    var c1=document.createElement("td"); c1.textContent=NAMES[k];
    var c2=document.createElement("td"); c2.textContent=MECH[k]; c2.style.textAlign="left";
    c2.style.color="#6b6f76"; c2.style.fontSize="12px";
    tr.append(c1,c2);
    ["path","clus","kmax"].forEach(function(key){
      var td=document.createElement("td");
      if(k==="marvel"){ td.textContent=fmt(key,D.models.marvel[key]); td.style.fontWeight="600"; }
      else {
        var r=verdictCell(k,key);
        var s=document.createElement("span"); s.className="stamp "+(r.ok?"p":"f");
        s.textContent=r.ok?"PASS":"FAIL";
        var n=document.createElement("span"); n.style.marginRight="8px"; n.style.color="#6b6f76";
        n.textContent=fmt(key,r.val);
        td.append(n,s);
      }
      tr.append(td);
    });
    body.append(tr);
  });
}
function paintCandidate(){
  $("cv-cand").__draw && $("cv-cand").__draw();
  var v=D.models[pick];
  $("cap-cand").textContent = NAMES[pick]+" "+MID+" "+v.n+" articles "+MID+" largest hub "+v.kmax;
}
stage($("cv-cand"), netPainter(function(){ return D.nets[pick]; }));
(function(){
  var box=$("cast");
  ["er","ws","ba"].forEach(function(k){
    var b=document.createElement("button");
    b.type="button"; b.className="cand"; b.setAttribute("aria-pressed", k===pick?"true":"false");
    var n=document.createElement("span"); n.className="nm"; n.textContent=NAMES[k];
    var mm=document.createElement("span"); mm.className="mech"; mm.textContent=MECH[k];
    b.append(n,mm);
    b.addEventListener("click", function(){
      pick=k;
      [].forEach.call(box.children,function(x,i){
        x.setAttribute("aria-pressed", ["er","ws","ba"][i]===k ? "true":"false"); });
      paintCandidate();
    });
    box.append(b);
  });
})();
buildScore(); paintCandidate();
(function(){
  var n=0;
  ["er","ws","ba"].forEach(function(k){
    if(["path","clus","kmax"].every(function(key){ return verdictCell(k,key).ok; })) n++;
  });
  $("verdict-01").innerHTML = "<p><strong>No candidate passes all three scenes.</strong> Short paths come free to all three, even random links. Random links stop there: clustering falls to "+f(D.models.er.clus,3)+" and its biggest hub reaches only "+D.models.er.kmax+", both far off Marvel's "+f(D.models.marvel.clus,3)+" and "+D.models.marvel.kmax+". Watts"+EN+"Strogatz also buys the clustering scene with a ring lattice, but its biggest hub still reaches only "+D.models.ws.kmax+". Preferential attachment buys the hub scene instead, reaching "+D.models.ba.kmax+", but its clustering falls to "+f(D.models.ba.clus,3)+". Two scenes each is the best any candidate manages, and "+(n===0?"none plays all three":"the combination still escapes them")+".</p>";
})();

/* ---- 02 CCDF ---- */
var hidden={};
stage($("cv-ccdf"), function(c,w,h){
  c.clearRect(0,0,w,h);
  var L=54,R=14,T=14,B=34, pw=w-L-R, ph=h-T-B;
  var kmax=1, i, key;
  for(key in D.nets) kmax=Math.max(kmax, Math.max.apply(null, D.nets[key].deg));
  var lx=function(k){ return L + Math.log10(Math.max(k,1))/Math.log10(kmax)*pw; };
  var pmin=1/277, ly=function(p){ return T + (Math.log10(Math.max(p,pmin))/Math.log10(pmin))*ph; };
  c.strokeStyle="#e4e0d8"; c.lineWidth=1; c.fillStyle="#6b6f76";
  c.font="500 10px 'IBM Plex Mono', monospace";
  [1,2,5,10,20,50,100].forEach(function(k){
    if(k>kmax) return;
    var x=lx(k); c.beginPath(); c.moveTo(x,T); c.lineTo(x,T+ph); c.stroke();
    c.textAlign="center"; c.fillText(String(k), x, T+ph+15);
  });
  [1,.1,.01].forEach(function(p){
    var y=ly(p); c.beginPath(); c.moveTo(L,y); c.lineTo(L+pw,y); c.stroke();
    c.textAlign="right"; c.fillText(p===1?"1":String(p), L-8, y+3);
  });
  c.textAlign="center"; c.fillText("degree k", L+pw/2, h-6);
  c.save(); c.translate(13,T+ph/2); c.rotate(-Math.PI/2);
  c.fillText("P(K >= k)",0,0); c.restore();
  var col={marvel:"#1b4dd8", er:"#c1272d", ws:"#b4740c", ba:"#0f7a4a"};
  ["er","ws","ba","marvel"].forEach(function(k){
    if(hidden[k]) return;
    var pts=D.nets[k].ccdf;
    c.strokeStyle=col[k]; c.lineWidth=k==="marvel"?2.4:1.5; c.beginPath();
    for(i=0;i<pts.length;i++){
      var x=lx(pts[i][0]), y=ly(pts[i][1]);
      if(i===0) c.moveTo(x,y); else c.lineTo(x,y);
    }
    c.stroke();
  });
});
(function(){
  var box=$("ccdf-keys"), col={marvel:"#1b4dd8", er:"#c1272d", ws:"#b4740c", ba:"#0f7a4a"};
  ["marvel","er","ws","ba"].forEach(function(k){
    var b=document.createElement("button");
    b.type="button"; b.className="go ghost"; b.style.borderColor=col[k]; b.style.color=col[k];
    b.textContent=NAMES[k];
    b.addEventListener("click", function(){
      hidden[k]=!hidden[k]; b.style.opacity=hidden[k]?".35":"1"; $("cv-ccdf").__draw();
    });
    box.append(b);
  });
})();

/* ---- 03 shuffle rig ---- */
function clustering(adj){
  var sum=0, v, nb, k, set, links, i, r, j;
  for(v=0; v<adj.length; v++){
    nb=adj[v]; k=nb.length;
    if(k<2) continue;
    set=new Set(nb); links=0;
    for(i=0;i<k;i++){ r=adj[nb[i]]; for(j=0;j<r.length;j++) if(set.has(r[j])) links++; }
    sum += links/(k*(k-1));
  }
  return sum/adj.length;
}
var rig=(function(){
  var base=D.nets.marvel.edges, n=D.nets.marvel.pos.length;
  var E, has, swaps;
  function reset(){
    E=base.map(function(e){ return e.slice(); });
    has=[]; for(var i=0;i<n;i++) has.push(new Set());
    E.forEach(function(e){ has[e[0]].add(e[1]); has[e[1]].add(e[0]); });
    swaps=0;
  }
  function step(times){
    var done=0, tries=0, t;
    while(done<times && tries<times*60){
      tries++;
      var i=(Math.random()*E.length)|0, j=(Math.random()*E.length)|0;
      if(i===j) continue;
      var a=E[i][0],b=E[i][1],cc=E[j][0],dd=E[j][1];
      if(Math.random()<.5){ t=a;a=b;b=t; }
      if(Math.random()<.5){ t=cc;cc=dd;dd=t; }
      if(a===cc||a===dd||b===cc||b===dd) continue;
      if(has[a].has(dd)||has[cc].has(b)) continue;
      has[a].delete(b); has[b].delete(a); has[cc].delete(dd); has[dd].delete(cc);
      has[a].add(dd); has[dd].add(a); has[cc].add(b); has[b].add(cc);
      E[i]=[a,dd]; E[j]=[cc,b]; done++; swaps++;
    }
    return done;
  }
  reset();
  return { reset:reset, step:step, edges:function(){return E;},
           adj:function(){ return has.map(function(s){ return Array.from(s); }); },
           count:function(){ return swaps; } };
})();
function rigNet(){ return { pos:D.nets.marvel.pos, edges:rig.edges(), deg:D.nets.marvel.deg, __real:rig.count()===0 }; }
var drawRig=stage($("cv-rig"), netPainter(rigNet));
function rigReadout(){
  $("rig-c").textContent = f(clustering(rig.adj()),3);
  $("rig-swaps").textContent = commas(rig.count())+" swaps";
}
rigReadout();
var running=false;
$("rig-run").addEventListener("click", function(){
  if(running) return;
  running=true; $("rig-run").disabled=true;
  var target=M.swaps, per=Math.ceil(target/34);
  (function tick(){
    rig.step(per); drawRig(); rigReadout();
    if(rig.count()<target) requestAnimationFrame(tick);
    else { running=false; $("rig-run").disabled=false;
      $("rig-note").textContent="Degrees unchanged. Clustering has fallen to roughly the null mean.";
    }
  })();
});
$("rig-reset").addEventListener("click", function(){
  if(running) return;
  rig.reset(); drawRig(); rigReadout();
  $("rig-note").textContent="Every article keeps its exact number of links.";
});

var CL=D.null.clus, realC=D.models.marvel.clus;
stage($("cv-hist"), function(c,w,h){
  c.clearRect(0,0,w,h);
  var L=42,R=16,T=16,B=32, pw=w-L-R, ph=h-T-B;
  var nlo=Math.min.apply(null,CL), nhi=Math.max.apply(null,CL);
  var lo=nlo-(nhi-nlo)*0.6, hi=realC+(nhi-nlo)*0.6;
  var BINS=46, bins=new Array(BINS).fill(0), i;
  for(i=0;i<CL.length;i++){
    var b=Math.min(BINS-1, Math.floor((CL[i]-lo)/(hi-lo)*BINS)); bins[b]++;
  }
  var top=Math.max.apply(null,bins)||1;
  var x=function(v){ return L+(v-lo)/(hi-lo)*pw; };
  c.fillStyle="#9aa3b2";
  for(i=0;i<BINS;i++){
    var bw=pw/BINS, bh=bins[i]/top*ph;
    if(bh>0) c.fillRect(L+i*bw+0.6, T+ph-bh, bw-1.2, bh);
  }
  c.strokeStyle="#1b4dd8"; c.lineWidth=2.4; c.beginPath();
  c.moveTo(x(realC),T-4); c.lineTo(x(realC),T+ph); c.stroke();
  c.fillStyle="#1b4dd8"; c.font="600 11px 'IBM Plex Mono', monospace"; c.textAlign="right";
  c.fillText("Marvel "+f(realC,3), x(realC)-7, T+11);
  c.strokeStyle="#c9c4b8"; c.lineWidth=1; c.beginPath();
  c.moveTo(L,T+ph); c.lineTo(L+pw,T+ph); c.stroke();
  c.fillStyle="#6b6f76"; c.font="500 10px 'IBM Plex Mono', monospace";
  c.textAlign="center";
  [lo+0.01, (lo+hi)/2, hi-0.01].forEach(function(v){ c.fillText(f(v,2), x(v), T+ph+15); });
  c.textAlign="left"; c.fillText(M.samples+" shuffles", L+2, T+10);
});
$("cap-hist").textContent="Average clustering across "+M.samples+" degree-preserving shuffles "+MID+
  " Marvel's real value marked in blue";

(function(){
  var body=$("null-body");
  D.rows.forEach(function(r){
    var tr=document.createElement("tr");
    function td(t,cls){ var e=document.createElement("td"); e.textContent=t; if(cls) e.className=cls; return e; }
    var dec = (r.key==="paradox" || r.key==="path") ? 3 : 4;
    tr.append(td(r.label), td(f(r.real,dec)), td(f(r.mu,dec)), td(f(r.sd,4)));
    var z=td((r.z>=0?"+":"")+f(r.z,2), "z "+(Math.abs(r.z)>=2?"hi":"no"));
    tr.append(z, td(f(r.p,4)));
    body.append(tr);
  });
  $("null-note").textContent="p is empirical, (runs at least as extreme + 1) / (runs + 1), so "+
    M.samples+" shuffles can never report zero. Its floor here is "+f(1/(M.samples+1),4)+".";
  var cl=D.rows[0], pa=D.rows.filter(function(r){return r.key==="paradox";})[0];
  $("stats-plain").innerHTML="<p>Marvel's clustering of "+f(cl.real,3)+
    " sits "+f(cl.z,1)+" standard deviations above what the shuffle produces ("+f(cl.mu,3)+
    " "+PM+" "+f(cl.sd,3)+"), and not one of "+M.samples+" shuffles came close. The friendship paradox is the exception: "+
    f(pa.real*100,1)+"% against the shuffle's "+f(pa.mu*100,1)+"%, a z of "+f(pa.z,2)+", which is no difference at all.</p>";
  $("verdict-03").innerHTML="<p><strong>Half the clustering is the hubs. Half is not.</strong> Scrambling the wiring while holding every degree fixed drops clustering from "+
    f(cl.real,3)+" to "+f(cl.mu,3)+", so the degree sequence alone accounts for roughly "+
    Math.round(cl.mu/cl.real*100)+"% of it. What is left stands "+f(cl.z,1)+
    " standard deviations clear of chance. Had we compared against plain random links instead, we would have credited the whole amount to the wiring and missed the half the hubs explain.</p>";
})();
$("stats-toggle").addEventListener("click", function(ev){
  var b=ev.target.closest("button"); if(!b) return;
  var full=b.dataset.mode==="full";
  [].forEach.call(this.children,function(x){ x.setAttribute("aria-pressed", x===b?"true":"false"); });
  $("stats-full").hidden=!full; $("stats-plain").hidden=full;
});

/* ---- 04 paradox draw ---- */
var CH=D.chars, ADJ=D.adj, drawn=0, para=0;
function card(el,i,sub){
  el.innerHTML="";
  var nm=document.createElement("p"); nm.className="nm"; nm.textContent=CH[i][0];
  var k=document.createElement("p"); k.className="k";
  k.textContent=CH[i][1]+" links "+MID+" neighbours average "+CH[i][2]+(sub?" "+MID+" "+sub:"");
  var b=document.createElement("p"); b.className="bio"; b.textContent=CH[i][4];
  el.append(nm,k,b);
}
function one(){
  var a=(Math.random()*CH.length)|0, nb=ADJ[a];
  if(!nb.length) return;
  var b=nb[(Math.random()*nb.length)|0];
  drawn++; if(CH[b][1]>=CH[a][1]) para++;
  card($("who-a"),a,"you drew"); card($("who-b"),b, CH[b][1]>=CH[a][1] ? "more popular" : "less popular");
}
function tally(){
  $("draw-tally").textContent = drawn ? commas(drawn)+" draws "+MID+" the drawn neighbour was at least as popular in "+
    f(para/drawn*100,1)+"% of them" : "0 draws";
}
$("draw-one").addEventListener("click", function(){ one(); tally(); });
$("draw-many").addEventListener("click", function(){ for(var i=0;i<200;i++) one(); tally(); });
$("draw-reset").addEventListener("click", function(){
  drawn=0; para=0; tally();
  $("who-a").innerHTML='<p class="nm">&mdash;</p><p class="k">Press draw</p>';
  $("who-b").innerHTML='<p class="nm">&mdash;</p><p class="k">their random neighbour</p>';
});
(function(){
  var pa=D.rows.filter(function(r){return r.key==="paradox";})[0];
  $("verdict-04").innerHTML="<p><strong>The neighbour-average paradox is real, and on its own it tells us nothing about Marvel.</strong> "+
    f(pa.real*100,1)+"% of articles have neighbours more connected than themselves on average. "+
    "Then we ran the same measurement on "+M.samples+" shuffled networks, where the wiring is destroyed and only the degrees survive: "+
    f(pa.mu*100,1)+"%"+", if anything slightly higher. That is a z of "+f(pa.z,2)+" and an empirical p of "+f(pa.p,2)+
    ". In this neighbour-average form the paradox is a consequence of the degree sequence alone; it would appear in any network with these link counts. The single-draw form measured by the handle above is different: it does differ from the shuffle, just slightly weaker than the degrees alone would predict.</p>";
})();

/* ---- 05 receipts ---- */
$("rec-pop").textContent="The connected core of the Marvel Wikipedia snapshot of "+M.snapshot+": "+
  M.n+" articles and "+commas(M.m)+" undirected links, mean degree "+f(M.kbar,2)+
  ". A link exists when either article links to the other. Every measurement on this page runs on that same core.";
$("rec-models").textContent="Random graph G(n, m) at the same node and link count. Watts"+EN+"Strogatz on a ring of degree "+
  M.ws_k+" with rewiring probability 0.2. Barab"+String.fromCharCode(225)+"si"+EN+"Albert attaching "+M.ba_m+
  " links per arriving node. One fixed seed ("+M.seed+") per model, so each is one reproducible draw and not an average over many.";
$("rec-null").textContent=M.samples+" shuffles, each applying "+commas(M.swaps)+
  " degree-preserving double-edge swaps, which is ten per link. Connectivity is not enforced during swapping, so a shuffled network may break into pieces; path length is measured on the largest piece in that case. z is (real "+String.fromCharCode(8722)+
  " null mean) / null SD, and p is empirical.";
$("rec-control").textContent="The largest hub stays at "+D.control.real+" across all "+M.samples+
  " shuffles, standard deviation "+f(D.control.nullSd,1)+". That is not a finding; it is the check that the method did what it claims, since preserving degrees must leave the maximum untouched.";
$("foot").textContent="Prototype for the Week 2 post "+MID+" Log"+EN+"Log Legends "+MID+
  " every figure computed from the frozen snapshot, models and null model in Python with NetworkX, the live rig in the page itself.";
})();
