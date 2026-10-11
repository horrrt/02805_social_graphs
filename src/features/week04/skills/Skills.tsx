"use client";
// The deep dive's O*NET box (#cut-skills), which week04-skills.js and
// week04-skills-radar.js filled on main once the box first opened: box 3
// (hired together, alike in skills), box 4 (whole clusters) and box 5, the
// radar that puts up to five occupations side by side. Until skills.json
// loads the box shows its status line; the radar card follows boxes 3 and 4,
// or the status line when they fail.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { Drawer } from "@/components/post/Drawer";
import { Drawers } from "@/components/post/Drawers";
import { StripChart, TermText } from "@/kit";
import type { StripOptions, StripRow } from "@/kit/StripChart";
import { island, useIslandReady } from "@/lib/island";
import type { EChartsInstance } from "@/lib/useEChart";
import { useHydrated } from "@/lib/useHydrated";
import { useOwnedRef } from "@/lib/useOwnedRef";
import { useTokens, useTypeScale } from "@/lib/useTypeScale";
import { INTRO, card1, card2 } from "@/scripts/week04-skills.js";
import {
  GROUP_ORDER,
  MAX_SELECTED,
  RADAR_METHOD,
  RADAR_TOKENS,
  radarNotice,
  radarOption,
  searchIndex,
  seriesToken,
  spokeTip,
} from "@/scripts/week04-skills-radar.js";
import { W4Chart } from "../W4Chart";
import { segKeyDown, segTab } from "../seg";
import { W4, useW4Data } from "../useW4Data";

type Strip = { rows: StripRow[]; opts: StripOptions };

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="notice">
      <span className="ico">💡</span>
      <span>
        <b>What to notice</b>
        <span>{children}</span>
      </span>
    </div>
  );
}

function Plot({ title, note, strip }: { title: string; note: string; strip: Strip }) {
  return (
    <div className="plot">
      <h3>{title}</h3>
      <p className="axis-note">{note}</p>
      <div className="w4-figure-body">
        <StripChart rows={strip.rows} opts={strip.opts} />
      </div>
    </div>
  );
}

function Box3({ c, descriptors }: { c: any; descriptors: number }) {
  const m = useMemo(() => card1(c, descriptors), [c, descriptors]);
  return (
    <div className="card w4-card" id="cut-skills-direct">
      <header className="w4-q">
        <span className="w4-num">3</span>
        <div>
          <h2>Do occupations the same companies hire together also need similar skills?</h2>
          <p className="w4-answer">Yes. The more companies two occupations share, the more alike their skills, and not only because they sit in the same official job group.</p>
        </div>
      </header>
      <div className="w4-two">
        <div>
          <p className="sub">
            <TermText
              text={m.lead}
              phrase="O*NET"
              definition="The US Department of Labor's database of what each occupation involves, rated from surveys of workers and analysts."
              id="w4-term-cut-skills-direct-onet"
            />
          </p>
          <Notice>
            <TermText text={m.notice} phrase="similarity" definition="The cosine of two occupations' O*NET ratings, from -1 to 1. Higher means more alike skills." id="w4-term-cut-skills-direct-similarity" />
          </Notice>
          <Drawers variant="foot">
            <Drawer label="Background">
              <p>{m.background}</p>
            </Drawer>
            <Drawer label="Method">
              <div>
                {m.method.map((t: string, i: number) => (
                  <p key={i}>
                    <span>{t}</span>
                  </p>
                ))}
              </div>
            </Drawer>
            <Drawer label="More numbers">
              <div>
                <p>{m.more[0]}</p>
                <p>
                  <span>{m.more[1]}</span>
                </p>
              </div>
            </Drawer>
          </Drawers>
        </div>
        <Plot
          title="Skill similarity by how often companies hire both"
          note={`Mean O*NET similarity of the pairs in each quarter of lift. The dashed line is a random pair of the same ${m.occupations}.`}
          strip={m.strip as Strip}
        />
      </div>
    </div>
  );
}

function Box4({ c }: { c: any }) {
  const m = useMemo(() => card2(c), [c]);
  return (
    <div className="card w4-card" id="cut-skills-cluster">
      <header className="w4-q">
        <span className="w4-num">4</span>
        <div>
          <h2>Does that agreement hold for whole hiring clusters, not just direct ties?</h2>
          <p className="w4-answer">Mostly. Occupations in the same hiring cluster need more alike skills than pairs in different clusters, even without a direct tie.</p>
        </div>
      </header>
      <div className="w4-two">
        <div>
          <p className="sub">
            {`Section 2 groups the ${m.occupations} occupations into hiring clusters with Louvain. This box asks whether those clusters also share skills, leaving out the pairs section 2 draws as links.`}
          </p>
          <Notice>{m.notice}</Notice>
          <Drawers variant="foot">
            <Drawer label="Method">
              <div>
                {m.method.map((t: string, i: number) => (
                  <p key={i}>
                    <span>{t}</span>
                  </p>
                ))}
              </div>
            </Drawer>
            <Drawer label="More numbers">
              <p>{m.more}</p>
            </Drawer>
          </Drawers>
        </div>
        <Plot
          title="Skill similarity by cluster membership"
          note="Mean O*NET similarity per group of pairs; the dashed line is the random-pair baseline from box 3's chart."
          strip={m.strip as Strip}
        />
      </div>
    </div>
  );
}

// ---- box 5, the radar

type Tip = { x: number; y: number; name: string; rows: { token: string; title: string; value: string }[] } | null;

function Radar({ data }: { data: any }) {
  const hydrated = useHydrated();
  const card = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const scale = useTypeScale();
  const tokens = useTokens(RADAR_TOKENS as string[]);
  const token = useMemo(() => (name: string) => tokens?.[name] ?? "", [tokens]);
  const byCode = useMemo(() => new Map<string, any>(data.occupations.map((o: any) => [o.code, o])), [data]);
  const index = useMemo(() => searchIndex(data.occupations) as Map<string, string>, [data]);
  const [selected, setSelected] = useState<string[]>([...data.default]);
  const [group, setGroup] = useState("skills");
  const [status, setStatus] = useState("");
  const [tip, setTip] = useState<Tip>(null);
  const [chart, setChart] = useState<EChartsInstance | null>(null);
  const [size, setSize] = useState<[number, number] | null>(null);
  const groups = data.meta.groups;
  const descriptors = Object.values(groups).reduce((n: number, g: any) => n + g.ids.length, 0);
  const full = selected.length >= MAX_SELECTED;

  // The host can be laid out after init (the card lands while its <details>
  // is still opening), so the chart is sized from its host whenever it changes.
  useEffect(() => {
    if (!chart) return;
    const read = () => setSize((s) => (s && s[0] === chart.getWidth() && s[1] === chart.getHeight() ? s : [chart.getWidth(), chart.getHeight()]));
    read();
    const observer = new ResizeObserver(() => {
      chart.resize();
      read();
    });
    observer.observe(chart.getDom());
    return () => observer.disconnect();
  }, [chart]);

  const showTip = (event: MouseEvent, axisIndex: number) => {
    const box = wrap.current?.getBoundingClientRect();
    if (!box) return;
    const t = spokeTip(data, byCode, selected, group, axisIndex);
    setTip({ x: event.clientX - box.left + 14, y: event.clientY - box.top + 10, name: t.name, rows: t.rows });
  };
  const hideTip = () => setTip(null);
  const tipRef = useRef({ showTip, hideTip });
  tipRef.current = { showTip, hideTip };

  const option = useMemo(() => {
    if (!scale || !tokens || !size) return null;
    return radarOption(data, byCode, selected, group, size[0], size[1], token, scale, (e: MouseEvent, i: number) => tipRef.current.showTip(e, i), () => tipRef.current.hideTip());
  }, [data, byCode, selected, group, size, token, scale, tokens]);
  const events = useMemo(
    () => ({
      mouseover: (params: any) => {
        if (params.componentType === "radar" && params.targetType === "axisName") tipRef.current.showTip(params.event.event, params.axisIndex);
      },
      mouseout: (params: any) => {
        if (params.componentType === "radar" && params.targetType === "axisName") tipRef.current.hideTip();
      },
    }),
    [],
  );

  const commit = () => {
    const el = input.current;
    if (!el) return;
    const title = el.value.trim();
    if (!title) return;
    if (selected.length >= MAX_SELECTED) {
      setStatus("Five occupations are already on the radar. Remove one to add another.");
      return;
    }
    const code = index.get(title);
    if (!code) {
      setStatus(`No occupation named "${title}" in the list.`);
      return;
    }
    if (selected.includes(code)) {
      setStatus(`${title} is already on the radar.`);
      el.value = "";
      return;
    }
    setSelected((s) => [...s, code]);
    el.value = "";
    setStatus(`Added ${title}.`);
  };
  const commitRef = useRef(commit);
  commitRef.current = commit;
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    const controller = new AbortController();
    el.addEventListener("change", () => commitRef.current(), { signal: controller.signal });
    return () => controller.abort();
  }, []);

  const notice = radarNotice(data, byCode, selected, group);
  return (
    <div className="card w4-card" id="cut-skills-radar" ref={card}>
      <header className="w4-q">
        <span className="w4-num">5</span>
        <div>
          <h2>How do two occupations' day-to-day skills actually compare?</h2>
          <p className="w4-answer">Put up to five H-1B occupations on one radar and see where their O*NET profiles pull apart.</p>
        </div>
      </header>
      <div className="w4-two">
        <div>
          <p className="sub">
            {`O*NET rates how much each of ${descriptors} skills, knowledge areas and work activities matters to an occupation, from 1 (not important) to 5 (extremely important). Each spoke is one of them: further out means it matters more.`}
          </p>
          <Drawers variant="foot">
            <Drawer label="Method">
              <p>
                {RADAR_METHOD.map((t: string, i: number) => (
                  <span key={i}>{t}</span>
                ))}
              </p>
            </Drawer>
          </Drawers>
        </div>
        <div className="plot">
          <h3>Compare occupations' O*NET profiles</h3>
          <p className="axis-note">
            Search adds up to five occupations; the toggle picks skills, knowledge areas or work activities. Hover a spoke's label for each occupation's value there.
          </p>
          <div className="w4-radar-controls">
            <div className="w4-radar-search-row">
              <label className="w4-sr-only" htmlFor="w4-radar-search">
                Add an occupation to the radar
              </label>
              <input
                ref={input}
                type="text"
                id="w4-radar-search"
                list="w4-radar-datalist"
                autoComplete="off"
                placeholder={full ? "Five selected, remove one to add another" : "Add an occupation…"}
                disabled={full}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commit();
                  }
                }}
              />
              <datalist id="w4-radar-datalist">
                {[...index.keys()].map((title) => (
                  <option key={title} value={title}></option>
                ))}
              </datalist>
            </div>
            <p className="w4-radar-search-status" aria-live="polite">
              {status}
            </p>
            <div className="w4-radar-chips" role="list" aria-label="Occupations on the radar">
              {selected.map((code, i) => {
                const occ = byCode.get(code);
                const canRemove = selected.length > 1;
                return (
                  <span className="w4-radar-chip" role="listitem" key={code}>
                    <i style={{ background: token(seriesToken(i)) }}></i>
                    <span title={occ.title}>{occ.title}</span>
                    <button
                      type="button"
                      aria-label={canRemove ? `Remove ${occ.title}` : `${occ.title} is the only occupation left; add another before removing it`}
                      disabled={!canRemove}
                      onClick={() => setSelected((s) => (s.length <= 1 ? s : s.filter((c) => c !== code)))}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="rx-seg-row">
              <span className="rx-seg-label" id="w4-radar-group-label">
                Compare by
              </span>
              <div className="rx-seg" role="group" aria-labelledby="w4-radar-group-label" ref={useOwnedRef()} onKeyDown={segKeyDown}>
                {GROUP_ORDER.map((g: string) => (
                  <button key={g} type="button" id={`w4-radar-group-${g}`} data-group={g} aria-pressed={g === group ? "true" : "false"} tabIndex={segTab(hydrated, g === group)} onClick={() => setGroup(g)}>
                    {groups[g].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="notice w4-radar-notice">
            <span className="ico">💡</span>
            <span>
              <span>{notice.lead}</span>
              <ul className="w4-radar-notice-list">
                {notice.lines.map((line: string, i: number) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </span>
          </div>
          <p className="w4-sr-only" aria-live="polite">
            {notice.live}
          </p>
        </div>
      </div>
      <div className="plot w4-radar-full">
        <div className="w4-figure-body w4-radar-host-wrap" ref={wrap}>
          <W4Chart className="w4-radar-host" option={option} onEvents={events} onChart={setChart} eager />
          <div className="w4-radar-tip" role="tooltip" hidden={!tip} style={tip ? { left: `${tip.x}px`, top: `${tip.y}px` } : undefined}>
            {tip ? (
              <>
                <b>{tip.name}</b>
                {tip.rows.map((r, i) => (
                  <div className="w4-radar-tip-row" key={i}>
                    <i style={{ background: token(r.token) }}></i>
                    {r.title}: <b>{r.value}</b>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- the box

const LOADING = "Loading the O*NET comparison…";

function StatusLine({ text }: { text: string }) {
  return (
    <p aria-live="polite" className="status-line" id="skills-status">
      {text}
    </p>
  );
}

function Server() {
  return <StatusLine text={LOADING} />;
}

function SkillsView() {
  // Built once #cut-skills first opens, or at once if it is open already.
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const box = document.getElementById("cut-skills") as HTMLDetailsElement | null;
    if (!box) return;
    if (box.open) setOpened(true);
    const controller = new AbortController();
    box.addEventListener("toggle", () => box.open && setOpened(true), { signal: controller.signal });
    return () => controller.abort();
  }, []);
  const skills = useW4Data(W4.data("skills"), "week04-skills", { enabled: opened });
  const radar = useW4Data(W4.data("skills_radar"), "week04-skills-radar", { enabled: opened });
  const c = skills.data?.cohiring;
  useIslandReady(Boolean(skills.data || radar.data));
  const radarCard = radar.data ? <Radar data={radar.data} /> : null;
  if (c) {
    return (
      <>
        <p className="w4-box-intro">{INTRO}</p>
        <Box3 c={c} descriptors={skills.data.meta.descriptors} />
        <Box4 c={c} />
        {radarCard}
      </>
    );
  }
  const text = skills.status === "error" ? "Could not load the O*NET comparison." : radar.status === "error" ? "Could not load the O*NET radar." : LOADING;
  return (
    <>
      <StatusLine text={text} />
      {skills.status === "error" ? radarCard : null}
    </>
  );
}

/** <Skills />: the content of #skills-body. */
export const Skills = island("week04/skills/Skills", SkillsView, Server, {
  roots: ["#skills-status", "#cut-skills-direct", "#cut-skills-cluster", "#cut-skills-radar"],
});
