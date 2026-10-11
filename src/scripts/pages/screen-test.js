// The model behind /prototypes/screen-test/ (src/features/screen-test/ draws
// it): names, tolerances, the prototype's own colours and fonts, the canvas
// painters, the clustering measure and the live shuffle rig. The prototype
// keeps its own palette and sizes, as it did when its script was inline in
// its page. Pure: no DOM and no fetch; painters draw on the context they get.

export const EN = String.fromCharCode(8211), MID = String.fromCharCode(183), PM = String.fromCharCode(177);
export const NAMES = {marvel:"Marvel", er:"Erd"+String.fromCharCode(337)+"s"+EN+"R"+String.fromCharCode(233)+"nyi",
           ws:"Watts"+EN+"Strogatz", ba:"Barab"+String.fromCharCode(225)+"si"+EN+"Albert"};
export const MECH = {marvel:"the observed network", er:"links thrown at random",
          ws:"a ring, then rewire a fifth", ba:"newcomers prefer the popular"};
export const TOL = {path:.20, clus:.25, kmax:.40};
/** The muted ink of mechanisms, raw values and the axes. */
export const MUTED = "#6b6f76";
/** The CCDF line colours, also each key button's border and text. */
export const CCDF = {marvel:"#1b4dd8", er:"#c1272d", ws:"#b4740c", ba:"#0f7a4a"};

export function f(x,n){ return Number(x).toFixed(n); }
export function commas(x){ return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

/** A candidate's value on one scene against Marvel's, and whether it lands inside the tolerance. */
export function verdictCell(D,model,key){
  var real=D.models.marvel[key], val=D.models[model][key];
  var off=(val-real)/real, ok=Math.abs(off)<=TOL[key];
  return {ok:ok, val:val, off:off};
}
export function fmt(key,v){ return key==="kmax" ? String(v) : f(v, key==="clus"?3:2); }

/* ---- drawing ---- */
/** A painter for a network: get() returns { pos, edges, deg, __real } or nothing. */
export function netPainter(get){
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

/* ---- 02 CCDF ---- */
/** Paint the four degree CCDFs on log axes, skipping the ones in `hidden`. */
export function paintCcdf(D,hidden,c,w,h){
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
  ["er","ws","ba","marvel"].forEach(function(k){
    if(hidden[k]) return;
    var pts=D.nets[k].ccdf;
    c.strokeStyle=CCDF[k]; c.lineWidth=k==="marvel"?2.4:1.5; c.beginPath();
    for(i=0;i<pts.length;i++){
      var x=lx(pts[i][0]), y=ly(pts[i][1]);
      if(i===0) c.moveTo(x,y); else c.lineTo(x,y);
    }
    c.stroke();
  });
}

/* ---- 03 shuffle rig ---- */
export function clustering(adj){
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
/** The live rig: Marvel's links, swapped two at a time with every degree kept. */
export function makeRig(D){
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
}

/** Paint the histogram of null clustering with Marvel's value marked. */
export function paintHist(D,c,w,h){
  var M=D.meta, CL=D.null.clus, realC=D.models.marvel.clus;
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
}
