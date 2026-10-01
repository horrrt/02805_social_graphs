import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Screen Test · Log–Log Legends",
  description: "Three network models audition to explain the Marvel Wikipedia network, then a degree-preserving shuffle replaces casting with a statistical test. The Week 2 post's companion piece.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={"https://fonts.googleapis.com/css2?family=Archivo:wght@600;800&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap"} />
        <style>{`
        :root{
          color-scheme: light;
          --paper:#fbfaf7; --panel:#ffffff; --ink:#16181c; --muted:#6b6f76;
          --rule:#ddd9d0; --rule-firm:#b9b4a8;
          --marvel:#1b4dd8; --pass:#0f7a4a; --fail:#c1272d; --amber:#b4740c;
          --disp:Archivo,"Helvetica Neue",Arial,sans-serif;
          --serif:"Source Serif 4",Georgia,"Times New Roman",serif;
          --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
        }
        *{box-sizing:border-box}
        body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--serif);
             font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
        .sheet{max-width:1120px;margin:0 auto;padding-inline:24px;padding-block:28px 64px}
        .lbl{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.16em;
             text-transform:uppercase;color:var(--muted)}
        h1{font-family:var(--disp);font-weight:800;font-size:clamp(46px,8.5vw,92px);line-height:.88;
           letter-spacing:-.02em;text-transform:uppercase;margin:12px 0 0}
        h2{font-family:var(--disp);font-weight:800;font-size:clamp(23px,3vw,31px);line-height:1.05;
           letter-spacing:-.01em;text-transform:uppercase;margin:0}
        h3{font-family:var(--disp);font-weight:600;font-size:17px;letter-spacing:.02em;margin:0 0 6px}
        p{margin:0 0 14px;max-width:68ch}
        em.key{font-style:normal;color:var(--marvel);font-weight:600}
        .masthead{border-bottom:3px solid var(--ink);padding-bottom:22px}
        .masthead .deck{font-size:20px;max-width:56ch;margin-top:16px}
        .billing{display:flex;flex-wrap:wrap;gap:6px 26px;margin-top:18px}
        .crumbs{margin-bottom:6px}
        .crumbs a{color:var(--marvel);text-decoration:none}
        .crumbs a:hover{text-decoration:underline}
        .foot-links{margin-top:10px}
        .foot-links a{color:var(--marvel);text-decoration:none}
        .foot-links a:hover{text-decoration:underline}
        
        section.act{display:grid;grid-template-columns:92px 1fr;gap:26px;
                    border-bottom:1px solid var(--rule);padding-block:38px}
        section.act > .rail{position:relative}
        section.act > .rail .no{font-family:var(--disp);font-weight:800;font-size:40px;line-height:1;
                                color:var(--rule-firm)}
        section.act > .rail .tag{margin-top:8px}
        @media(max-width:720px){section.act{grid-template-columns:1fr;gap:14px}
          section.act > .rail{display:flex;align-items:baseline;gap:12px}}
        .act-body > * + *{margin-top:18px}
        
        .card{background:var(--panel);border:1px solid var(--rule);border-radius:2px;padding:18px 20px}
        .vitals{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:0;
                border:1px solid var(--rule);background:var(--panel)}
        .vitals div{padding:13px 15px;border-right:1px solid var(--rule)}
        .vitals div:last-child{border-right:0}
        .vitals dt{font-family:var(--mono);font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}
        .vitals dd{margin:4px 0 0;font-family:var(--mono);font-weight:600;font-size:23px;
                   font-variant-numeric:tabular-nums}
        
        .cast{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        @media(max-width:700px){.cast{grid-template-columns:1fr}}
        .cand{appearance:none;font:inherit;text-align:left;cursor:pointer;background:var(--panel);
              border:1px solid var(--rule-firm);border-radius:2px;padding:13px 15px;
              display:flex;flex-direction:column;gap:3px;transition:background .14s,border-color .14s}
        .cand:hover{border-color:var(--ink)}
        .cand:focus-visible{outline:2px solid var(--marvel);outline-offset:2px}
        .cand[aria-pressed="true"]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
        .cand .nm{font-family:var(--disp);font-weight:800;font-size:19px;text-transform:uppercase;line-height:1.1}
        .cand .mech{font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--muted)}
        .cand[aria-pressed="true"] .mech{color:#b9c4dd}
        
        .reel{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        @media(max-width:680px){.reel{grid-template-columns:1fr}}
        figure{margin:0;border:1px solid var(--rule);background:var(--panel)}
        figure canvas{display:block;width:100%;aspect-ratio:1/0.86}
        figcaption{font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--muted);
                   padding:8px 12px;border-top:1px solid var(--rule);text-transform:uppercase}
        
        table{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:13.5px;
              font-variant-numeric:tabular-nums;background:var(--panel)}
        caption{text-align:left;font-family:var(--mono);font-size:11px;letter-spacing:.14em;
                text-transform:uppercase;color:var(--muted);padding-bottom:7px}
        th,td{border:1px solid var(--rule);padding:9px 11px;text-align:right}
        th:first-child,td:first-child{text-align:left}
        thead th{background:#f3f1ec;font-weight:600;font-size:11px;letter-spacing:.09em;text-transform:uppercase}
        tbody tr[data-real="yes"] td{background:#eef2fd}
        .tw{overflow-x:auto}
        .stamp{font-family:var(--disp);font-weight:800;font-size:12px;letter-spacing:.09em;
               border:2px solid currentColor;border-radius:2px;padding:1px 7px;display:inline-block;
               transform:rotate(-2.5deg)}
        .stamp.p{color:var(--pass)} .stamp.f{color:var(--fail)}
        .z{font-weight:600} .z.hi{color:var(--pass)} .z.no{color:var(--fail)}
        
        .controls{display:flex;flex-wrap:wrap;gap:9px;align-items:center}
        button.go{appearance:none;font-family:var(--disp);font-weight:800;font-size:13px;letter-spacing:.07em;
                  text-transform:uppercase;padding:10px 17px;border-radius:2px;cursor:pointer;
                  background:var(--ink);color:var(--paper);border:1px solid var(--ink)}
        button.go.ghost{background:transparent;color:var(--ink)}
        button.go.ghost:hover{background:#efece5}
        button.go:focus-visible{outline:2px solid var(--marvel);outline-offset:2px}
        button.go[disabled]{opacity:.4;cursor:not-allowed}
        
        .toggle{display:inline-flex;border:1px solid var(--rule-firm);border-radius:2px;overflow:hidden}
        .toggle button{appearance:none;font-family:var(--mono);font-size:11.5px;letter-spacing:.09em;
                       text-transform:uppercase;padding:8px 13px;background:var(--panel);color:var(--muted);
                       border:0;border-right:1px solid var(--rule-firm);cursor:pointer}
        .toggle button:last-child{border-right:0}
        .toggle button[aria-pressed="true"]{background:var(--ink);color:var(--paper)}
        
        .rig{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:14px;align-items:start}
        @media(max-width:760px){.rig{grid-template-columns:1fr}}
        .gauge{border:1px solid var(--rule);background:var(--panel);padding:14px 16px}
        .gauge .big{font-family:var(--mono);font-weight:600;font-size:38px;line-height:1;
                    font-variant-numeric:tabular-nums}
        .gauge .small{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
        .finding{border-left:4px solid var(--marvel);padding:2px 0 2px 16px}
        .finding.warn{border-left-color:var(--amber)}
        .finding p:last-child{margin-bottom:0}
        .draw{display:grid;grid-template-columns:1fr 46px 1fr;gap:12px;align-items:center}
        @media(max-width:620px){.draw{grid-template-columns:1fr}}
        .who{border:1px solid var(--rule);background:var(--panel);padding:13px 15px;min-height:128px}
        .who .nm{font-family:var(--disp);font-weight:800;font-size:19px;text-transform:uppercase;line-height:1.1}
        .who .k{font-family:var(--mono);font-size:12px;color:var(--muted);margin-top:3px}
        .who .bio{font-size:13.5px;color:var(--muted);margin-top:8px;line-height:1.45}
        .arrow{font-family:var(--mono);font-size:22px;color:var(--rule-firm);text-align:center}
        footer{margin-top:30px;font-size:14px;color:var(--muted)}
        footer p{max-width:78ch}
        code{font-family:var(--mono);font-size:12.5px;background:#f0ede6;padding:1px 5px}
        @media(prefers-reduced-motion:reduce){*{transition-duration:.001ms!important}}
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
