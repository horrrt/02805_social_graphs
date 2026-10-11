// Pins the pure layer under the Week 4 kit, which the React kit renders from:
// decorationFor() decides what decorate() does to a table, and stripLayout()
// and miniLayout() hold the geometry stripChart() and miniStrip() draw. The
// DOM versions run here on a small stand-in DOM, so the test needs no browser.
import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { builtPage } from "./built-page.mjs";
import { decorate, decorationFor } from "../src/scripts/week04-tables.js";
import { miniLayout, miniStrip, stripChart, stripLayout } from "../src/scripts/week04-strip.js";

// ---- a stand-in DOM: elements, text, a canvas that measures text, tokens

class Text {
  constructor(text) {
    this.nodeType = 3;
    this.textContent = String(text);
    this.parentNode = null;
  }
}

class El {
  constructor(tag) {
    this.nodeType = 1;
    this.tagName = tag;
    this.attrs = new Map();
    this.childNodes = [];
    this.parentNode = null;
    this.dataset = {};
    this.style = {};
    this.classList = {
      add: (c) => {
        const now = this.className.split(" ").filter(Boolean);
        if (!now.includes(c)) this.className = [...now, c].join(" ");
      },
    };
  }
  get className() {
    return this.attrs.get("class") ?? "";
  }
  set className(v) {
    this.attrs.set("class", String(v));
  }
  setAttribute(k, v) {
    this.attrs.set(k, String(v));
  }
  getAttribute(k) {
    return this.attrs.get(k) ?? null;
  }
  get children() {
    return this.childNodes.filter((n) => n.nodeType === 1);
  }
  get firstElementChild() {
    return this.children[0] ?? null;
  }
  get lastElementChild() {
    return this.children.at(-1) ?? null;
  }
  get parentElement() {
    return this.parentNode;
  }
  get isConnected() {
    return false;
  }
  get textContent() {
    return this.childNodes.map((n) => n.textContent).join("");
  }
  set textContent(v) {
    this.replaceChildren(...(v === null || v === undefined || v === "" ? [] : [String(v)]));
  }
  append(...nodes) {
    for (let n of nodes) {
      if (typeof n === "string") n = new Text(n);
      if (n.parentNode) n.parentNode.childNodes = n.parentNode.childNodes.filter((c) => c !== n);
      n.parentNode = this;
      this.childNodes.push(n);
    }
  }
  replaceChildren(...nodes) {
    for (const c of this.childNodes) c.parentNode = null;
    this.childNodes = [];
    this.append(...nodes);
  }
  querySelector(sel) {
    assert.equal(sel, ":scope > .rx-cell", "decorate() asks only for its own wrapper");
    return this.children.find((c) => c.className === "rx-cell") ?? null;
  }
  get tHead() {
    return this.children.find((c) => c.tagName === "THEAD") ?? null;
  }
  get tBodies() {
    return this.children.filter((c) => c.tagName === "TBODY");
  }
  get rows() {
    return this.children.filter((c) => c.tagName === "TR");
  }
  get cells() {
    return this.children.filter((c) => c.tagName === "TD" || c.tagName === "TH");
  }
}

const SIZES = { caption: 11.5, small: 12.5 };
// A deterministic text width: 0.55em a character, bolder text a little wider.
const measure = (text, role = "small", weight = 400) =>
  String(text).length * SIZES[role] * 0.55 * (1 + (Number(weight) - 400) / 2000);

globalThis.getComputedStyle = () => ({
  getPropertyValue: (name) => {
    const role = name.match(/^--fs-(\w+)$/)?.[1];
    if (role) return role in SIZES ? `${SIZES[role]}px` : "";
    return name === "--font-sans" ? " Inter" : ` token(${name})`;
  },
});
globalThis.requestAnimationFrame = () => 0;
globalThis.document = {
  body: new El("BODY"),
  documentElement: new El("HTML"),
  createElement(tag) {
    if (tag !== "canvas") return new El(tag.toUpperCase());
    const ctx = {
      font: "",
      measureText(text) {
        const [, weight, size] = ctx.font.match(/^(\d+) ([\d.]+)px/);
        const role = Object.keys(SIZES).find((r) => SIZES[r] === Number(size));
        return { width: measure(text, role, weight) };
      },
    };
    return { getContext: () => ctx };
  },
  createElementNS: (_, tag) => new El(tag),
};

// ---- tables

// A table under the stand-in DOM: headers and rows of cell text, a cell being
// its text (a <td>) or { text, tag }.
function stubTable({ headers, rows, rxBars }) {
  const cell = (tag, text) => {
    const el = new El(tag.toUpperCase());
    if (text) el.append(text);
    return el;
  };
  const table = new El("TABLE");
  if (rxBars !== undefined) table.dataset.rxBars = rxBars;
  if (headers.length) {
    const head = new El("THEAD");
    const tr = new El("TR");
    tr.append(...headers.map((h) => cell("th", h)));
    head.append(tr);
    table.append(head);
  }
  const body = new El("TBODY");
  for (const row of rows) {
    const tr = new El("TR");
    tr.append(...row.map((c) => (typeof c === "string" ? cell("td", c) : cell(c.tag, c.text))));
    body.append(tr);
  }
  table.append(body);
  return table;
}

// What decorate() left on a stand-in table, in decorationFor()'s shape.
function readDecoration(table) {
  const head = table.tHead ? table.tHead.rows.at(-1).cells : [];
  const rows = table.tBodies.flatMap((b) => b.rows);
  return {
    head: head.map((th) => th.className),
    rows: rows.map((tr) => ({
      rx: tr.dataset.rx === "",
      cells: tr.cells.map((td) => {
        const wrap = td.querySelector(":scope > .rx-cell");
        const bar = wrap && {
          kind: wrap.firstElementChild.className.replace(/^rx-bar ?/, ""),
          width: wrap.firstElementChild.firstElementChild.style.width,
        };
        return { tag: td.tagName.toLowerCase(), className: td.className, bar: bar || null };
      }),
    })),
  };
}

// The text of every table on a built page, as decorate() reads it.
function builtTables(path) {
  const { document } = parseHTML(builtPage(path));
  const text = (el) => el.textContent.replace(/\s+/g, " ").trim();
  return [...document.querySelectorAll("table")].map((t, i) => {
    const head = [...t.querySelectorAll(":scope > thead > tr")].at(-1);
    return {
      page: path,
      table: `table ${i}`,
      rxBars: t.getAttribute("data-rx-bars") ?? undefined,
      headers: head ? [...head.children].map(text) : [],
      rows: [...t.querySelectorAll(":scope > tbody > tr")].map((tr) =>
        [...tr.children].map((c) => (c.tagName === "TD" ? text(c) : { text: text(c), tag: c.tagName.toLowerCase() })),
      ),
    };
  });
}

/*
 * Every table main (08501e3) decorated on Week 4 and Week 5 once the page had
 * loaded, cut with `scripts/parity/capture.mjs --page <p> --select table`:
 * the text decorate() read, and `want`, what main's decorate() left on it.
 * want.head[j] is "num" or ""; want.rows[i][j] is the cell's class, then for
 * a bar its kind ("-" for none) and width as the browser serialised it. Left
 * out: Week 5's 303-row MATTR table (nothing the others lack) and the two
 * tables outside decorateAll()'s root, which main never decorates. kit: the
 * table came from kit.js table(), which sets "num" on numeric columns itself.
 */
const MAIN = [
  {"page":"week04","table":"#place-null-stats","headers":[],"rows":[["Partition shown: found in","65 of 100 Louvain runs"],["Distinct partitions found","2"],["Q of the partition shown","0.049"],["Q of rewired networks, mean ± sd","0.013 ± 0.001"],["z","29.5"],["NMI between two runs, median (lowest)","1.00 (0.64)"],["NMI with Census regions (p)","0.137 (0.099)"],["NMI with Census divisions (p)","0.214 (0.115)"],["Infomap modules (random-walk method)","1: all metros together"]],"want":{"head":[],"rows":[["","soft"],["","soft"],["","soft"],["","soft"],["","soft"],["","soft"],["","soft"],["","soft"],["","soft"]]}},
  {"page":"week04","table":"#where-break-links","headers":["Link","α","Weight","Leading company","Its share"],"rows":[["Dallas–Orlando","0.098","1,844","Deloitte","29%"],["San Jose–Portland","0.098","1,857","Intel","24%"],["Dallas–Minneapolis","0.091","2,903","Cognizant placing firm","11%"],["Dallas–Richmond","0.091","1,725","Capital One","10%"],["Dallas–Detroit","0.089","3,014","Cognizant placing firm","7%"],["Dallas–Columbus","0.083","2,828","JPMorgan Chase","14%"],["New York–Hartford","0.079","2,376","Cognizant placing firm","26%"],["Washington–Baltimore","0.078","1,550","University of Maryland College Park","11%"],["Dallas–Phoenix","0.075","4,499","Cognizant placing firm","7%"],["Dallas–San Antonio","0.071","1,940","HCL placing firm","16%"],["Dallas–Tampa","0.062","3,529","Citigroup","9%"],["New York–Los Angeles","0.061","5,899","Amazon","10%"],["Dallas–Memphis","0.056","873","FedEx","22%"],["New York–Boston","0.050","6,574","Amazon","13%"]],"want":{"head":["","num","num","","num"],"rows":[["","num","num - 28%","soft","num meter 29%"],["","num","num - 28.2%","soft","num meter 24%"],["","num","num - 44.2%","soft","num meter 11%"],["","num","num - 26.2%","soft","num meter 10%"],["","num","num - 45.8%","soft","num meter 7%"],["","num","num - 43%","soft","num meter 14%"],["","num","num - 36.1%","soft","num meter 26%"],["","num","num - 23.6%","soft","num meter 11%"],["","num","num - 68.4%","soft","num meter 7%"],["","num","num - 29.5%","soft","num meter 16%"],["","num","num - 53.7%","soft","num meter 9%"],["","num","num - 89.7%","soft","num meter 10%"],["","num","num - 13.3%","soft","num meter 22%"],["","num","num - 100%","soft","num meter 13%"]]}},
  {"page":"week04","table":"#jobs-linkcom-table","headers":["Occupation","Links","Communities","Per link"],"rows":[["Communications Equipment Operators, All Other","11","5","0.46"],["Electrical Power-Line Installers and Repairers","11","5","0.46"],["Physical Therapist Aides flagged bridge","10","4","0.40"],["Education Administrators, Kindergarten through Secondary","31","12","0.39"],["Education and Childcare Administrators, Preschool and Daycare","11","4","0.36"],["Special Education Teachers, Middle School","40","14","0.35"],["Marriage and Family Therapists","18","6","0.33"],["Licensed Practical and Licensed Vocational Nurses flagged bridge","15","5","0.33"],["Interviewers, Except Eligibility and Loan","19","6","0.32"],["Career/Technical Education Teachers, Middle School","13","4","0.31"],["Special Education Teachers, Secondary School","49","15","0.31"],["Kindergarten Teachers, Except Special Education","43","13","0.30"],["Chefs and Head Cooks","17","5","0.29"],["Elementary School Teachers, Except Special Education","66","19","0.29"],["Credit Counselors flagged bridge","11","3","0.27"]],"want":{"head":["","num","num","num"],"rows":[["","num - 16.7%","num","num"],["","num - 16.7%","num","num"],["","num - 15.2%","num","num"],["","num - 47%","num","num"],["","num - 16.7%","num","num"],["","num - 60.6%","num","num"],["","num - 27.3%","num","num"],["","num - 22.7%","num","num"],["","num - 28.8%","num","num"],["","num - 19.7%","num","num"],["","num - 74.2%","num","num"],["","num - 65.2%","num","num"],["","num - 25.8%","num","num"],["","num - 100%","num","num"],["","num - 16.7%","num","num"]]}},
  {"page":"week04","table":"#who-movers-table","headers":["Client","Filings","Vendors","Group, weighted","Group, unweighted"],"rows":[["Citigroup","2,156","114","Tata Consultancy Services","EY"],["Verizon","1,925","518","Skilltune Technologies","Skilltune Technologies"],["Bank of America","1,819","45","Infosys","IBM"],["Fidelity Investments","1,756","215","Compunnel Software","Skilltune Technologies"],["American Express","1,230","349","IBM","Skilltune Technologies"],["USAA","1,085","235","HCL","Skilltune Technologies"],["Apple","1,020","301","Quest Global Services","Skilltune Technologies"],["T-Mobile","919","339","UST Global","Skilltune Technologies"],["Walmart","871","302","Compunnel Software","Skilltune Technologies"],["AT&T","845","302","Tech Mahindra","Skilltune Technologies"],["CVS Health","688","186","Cognizant","Compunnel Software"],["Charles Schwab","673","101","Wipro","Skilltune Technologies"],["Elevance Health","657","141","UST Global","Saipsit"],["PNC","635","62","Tata Consultancy Services","IBM"],["Johnson & Johnson","602","140","Tata Consultancy Services","Intellectt"]],"want":{"head":["","num","num","",""],"rows":[["","num - 100%","num","soft","soft"],["","num - 89.3%","num","soft","soft"],["","num - 84.4%","num","soft","soft"],["","num - 81.4%","num","soft","soft"],["","num - 57.1%","num","soft","soft"],["","num - 50.3%","num","soft","soft"],["","num - 47.3%","num","soft","soft"],["","num - 42.6%","num","soft","soft"],["","num - 40.4%","num","soft","soft"],["","num - 39.2%","num","soft","soft"],["","num - 31.9%","num","soft","soft"],["","num - 31.2%","num","soft","soft"],["","num - 30.5%","num","soft","soft"],["","num - 29.5%","num","soft","soft"],["","num - 27.9%","num","soft","soft"]]}},
  {"page":"week04","table":"#who-overlap-table","headers":["Client","Filings","First group","Second group","Main vendor"],"rows":[["USAA","1,085","HCL (44%)","Tata Consultancy Services (26%)","HCL"],["Travelers","294","Cognizant (38%)","Tata Consultancy Services (32%)","Cognizant"],["Honda","254","L&T Technology Services (54%)","Tata Consultancy Services (22%)","LTIMindtree"],["Kaiser Permanente","245","Tata Consultancy Services (41%)","Accenture (27%)","Tata Consultancy Services"],["Stellantis","235","L&T Technology Services (46%)","Tata Consultancy Services (34%)","Tata Consultancy Services"],["Discover Financial","233","Capgemini (57%)","Cognizant (21%)","Capgemini"],["Home Depot","200","Tata Consultancy Services (60%)","Compunnel Software (27%)","Tata Consultancy Services"],["Pfizer","192","IBM (31%)","Accenture (21%)","IBM"],["Macy's","184","Cognizant (35%)","Tata Consultancy Services (32%)","Cognizant"],["AIG","183","Cognizant (48%)","Tata Consultancy Services (37%)","Cognizant"],["Liberty Mutual","168","Cognizant (50%)","Tata Consultancy Services (27%)","Cognizant"],["Nationwide","154","Cognizant (55%)","Tata Consultancy Services (34%)","Cognizant"],["Equifax","153","UST Global (54%)","Tata Consultancy Services (22%)","UST Global"],["Centene","142","Skilltune Technologies (44%)","Infosys (28%)","Brillio"],["Prudential","142","IBM (30%)","Tata Consultancy Services (25%)","Tata Consultancy Services"]],"want":{"head":["","num","","",""],"rows":[["","num - 100%","soft","soft","soft"],["","num - 27.1%","soft","soft","soft"],["","num - 23.4%","soft","soft","soft"],["","num - 22.6%","soft","soft","soft"],["","num - 21.7%","soft","soft","soft"],["","num - 21.5%","soft","soft","soft"],["","num - 18.4%","soft","soft","soft"],["","num - 17.7%","soft","soft","soft"],["","num - 17%","soft","soft","soft"],["","num - 16.9%","soft","soft","soft"],["","num - 15.5%","soft","soft","soft"],["","num - 14.2%","soft","soft","soft"],["","num - 14.1%","soft","soft","soft"],["","num - 13.1%","soft","soft","soft"],["","num - 13.1%","soft","soft","soft"]]}},
  {"page":"week04","table":"#place-alpha-table","headers":["α","Edges kept","Giant component"],"rows":[["0.05","25","18"],["0.1","59","32"],["0.2","180","40"],["0.3","419","40"],["0.5","668","40"]],"want":{"head":["","num","num"],"rows":[["","num - 3.7%","num"],["","num - 8.8%","num"],["","num - 26.9%","num"],["","num - 62.7%","num"],["","num - 100%","num"]]}},
  {"page":"week04","table":"table 6","headers":["Client","Sector","Filings","Vendors","Largest vendor","Its share"],"rows":[["Citigroup","Finance and insurance","2,156","114","Tata Consultancy Services","25%"],["Verizon","Information and telecoms","1,925","518","Cognizant","10%"],["Bank of America","Finance and insurance","1,819","45","Randstad","19%"],["Fidelity Investments","Finance and insurance","1,756","215","Compunnel Software","28%"],["Wells Fargo","Finance and insurance","1,547","467","Mphasis","6%"],["American Express","Finance and insurance","1,230","349","Tata Consultancy Services","11%"],["Capital One","Finance and insurance","1,136","446","Compunnel Software","6%"],["JPMorgan Chase","Finance and insurance","1,125","371","Mphasis","13%"],["USAA","Finance and insurance","1,085","235","HCL","29%"],["Apple","Manufacturing","1,020","301","Infosys","13%"],["T-Mobile","Information and telecoms","919","339","HCL","7%"],["Walmart","Retail","871","302","Compunnel Software","11%"],["AT&T","Information and telecoms","845","302","Tech Mahindra","15%"],["Renewal Rehab","Health care","762","2","Grandison Management","100%"],["CVS Health","Retail","688","186","Cognizant","22%"],["Charles Schwab","Finance and insurance","673","101","Mphasis","22%"],["Elevance Health","Finance and insurance","657","141","UST Global","31%"],["Freddie Mac","Finance and insurance","636","306","Hexaware Technologies","24%"],["PNC","Finance and insurance","635","62","CGI Technologies and Solutions","27%"],["Johnson & Johnson","Manufacturing","602","140","Tata Consultancy Services","21%"],["Ford","Manufacturing","587","88","Epitec","10%"],["Charter Communications","Information and telecoms","586","281","Infosys","13%"],["Morgan Stanley","Finance and insurance","582","164","Synechron","13%"],["Toyota","Manufacturing","563","178","Infosys","11%"],["Fiserv","Finance and insurance","544","169","Infinite Computer Solutions","13%"]],"want":{"head":["","","num","num","","num"],"rows":[["","soft","num - 100%","num","soft","num meter 25%"],["","soft","num - 89.3%","num","soft","num meter 10%"],["","soft","num - 84.4%","num","soft","num meter 19%"],["","soft","num - 81.4%","num","soft","num meter 28%"],["","soft","num - 71.8%","num","soft","num meter 6%"],["","soft","num - 57.1%","num","soft","num meter 11%"],["","soft","num - 52.7%","num","soft","num meter 6%"],["","soft","num - 52.2%","num","soft","num meter 13%"],["","soft","num - 50.3%","num","soft","num meter 29%"],["","soft","num - 47.3%","num","soft","num meter 13%"],["","soft","num - 42.6%","num","soft","num meter 7%"],["","soft","num - 40.4%","num","soft","num meter 11%"],["","soft","num - 39.2%","num","soft","num meter 15%"],["","soft","num - 35.3%","num","soft","num meter 100%"],["","soft","num - 31.9%","num","soft","num meter 22%"],["","soft","num - 31.2%","num","soft","num meter 22%"],["","soft","num - 30.5%","num","soft","num meter 31%"],["","soft","num - 29.5%","num","soft","num meter 24%"],["","soft","num - 29.5%","num","soft","num meter 27%"],["","soft","num - 27.9%","num","soft","num meter 21%"],["","soft","num - 27.2%","num","soft","num meter 10%"],["","soft","num - 27.2%","num","soft","num meter 13%"],["","soft","num - 27%","num","soft","num meter 13%"],["","soft","num - 26.1%","num","soft","num meter 11%"],["","soft","num - 25.2%","num","soft","num meter 13%"]]}},
  {"page":"week04","table":"table 7","headers":["","Weighted","Unweighted"],"rows":[["Communities (median run)","70","65"],["Modularity, real network","0.60","0.57"],["Modularity, rewired null (largest piece)","0.74","0.53"],["Modularity, filing counts shuffled","0.75","–"],["NMI between two seeds","0.70","0.50"],["NMI with client industry","0.14","0.16"],["NMI with main vendor","0.69","0.49"],["AMI with client industry","0.07","0.07"],["AMI with main vendor","0.48","0.11"],["Clients in their main vendor's group","86%","47%"]],"want":{"head":["","num","num"],"rows":[["","num","num"],["","num","num"],["","num","num"],["","num","num"],["","num","num"],["","num","num"],["","num","num"],["","num","num"],["","num","num"],["","num","num"]]}},
  {"page":"week04","table":"table 9","rxBars":"1:0.04:placing,2:0.04:direct","headers":["Year","Placing firms","Direct employers","Placing firms counted","Direct employers counted"],"rows":[["2022","2.71%","1.22%","1,057","2,288"],["2023","3.57%","1.48%","873","2,080"],["2024","2.65%","1.28%","884","2,403"],["2025","3.20%","1.56%","933","2,466"],["2026, Oct–Jun","3.35%","1.98%","601","1,863"]],"want":{"head":["","num","num","num","num"],"rows":[["","num placing 67.8%","num direct 30.5%","num","num"],["","num placing 89.2%","num direct 37%","num","num"],["","num placing 66.3%","num direct 32%","num","num"],["","num placing 80%","num direct 39%","num","num"],["","num placing 83.8%","num direct 49.5%","num","num"]]}},
  {"page":"week05","table":"table 1","kit":true,"headers":["Pages","Pairs","Shared words","Largest pair's section"],"rows":[["Black Panther, Cyclops, Jean Grey, Rachel Summers, Storm, Wild Child","6","962","Publication history"],["Mayday Parker, Spider-Girl, Spider-Woman, Spider-Woman (Jessica Drew)","4","895","Publication history"],["Spitfire, Union Jack (Joseph Chapman), Union Jack","3","954","Collected editions"],["Battlestar, U.S. Agent","1","122","Powers and abilities"],["Black Rider, Two-Gun Kid","1","49","Other versions"],["Blue Diamond, Jack Frost","1","177","Publication history"],["Bucky, Rikki Barnes","1","93","Powers and abilities"],["Ch'od, Raza Longknife","1","149","Publication history"],["Eddie Brock, Venom","1","1,023","Publication history"],["Ghost Rider, Ghost Rider (Johnny Blaze)","1","444","Powers and abilities"],["Mockingbird, Quicksilver","1","59","Fictional character biography"],["Rocket Raccoon, Star-Lord","1","201","Lead"]],"want":{"head":["","num","num",""],"rows":[["","num","num","soft"],["","num","num","soft"],["","num","num","soft"],["","num","num","soft"],["","num","num","soft"],["","num","num","soft"],["","num","num","soft"],["","num","num","soft"],["","num","num","soft"],["","num","num","soft"],["","num","num","soft"],["","num","num","soft"]]}},
  {"page":"week05","table":"table 3","kit":true,"headers":["Tokens read","Most-linked first","z","Least-linked first","z","Random mean ± sd (500 orders)"],"rows":[["1,000","464","1.2","414","-0.9","435 ± 24"],["1,179","528","1.2","489","-0.3","496 ± 27"],["1,389","577","0.4","563","-0.1","566 ± 29"],["1,637","640","-0.1","649","0.2","644 ± 33"],["1,929","716","-0.5","731","-0.1","733 ± 36"],["2,273","841","0.2","845","0.3","834 ± 41"],["2,679","967","0.4","968","0.4","947 ± 46"],["3,158","1,086","0.2","1,076","0.0","1,074 ± 51"],["3,721","1,217","-0.0","1,210","-0.2","1,219 ± 55"],["4,386","1,370","-0.1","1,365","-0.2","1,377 ± 61"],["5,169","1,519","-0.5","1,575","0.3","1,556 ± 67"],["6,091","1,566","-2.5","1,805","0.7","1,754 ± 74"],["7,179","1,831","-1.8","2,088","1.4","1,977 ± 80"],["8,460","2,047","-2.0","2,353","1.5","2,224 ± 87"],["9,970","2,387","-1.1","2,640","1.5","2,496 ± 97"],["11,750","2,673","-1.1","2,978","1.6","2,799 ± 111"],["13,848","3,032","-0.8","3,334","1.7","3,133 ± 121"],["16,320","3,400","-0.8","3,711","1.6","3,501 ± 127"],["19,234","3,793","-0.9","4,136","1.7","3,909 ± 134"],["22,667","4,263","-0.7","4,604","1.8","4,355 ± 141"],["26,714","4,775","-0.5","5,223","2.5","4,845 ± 150"],["31,483","5,308","-0.4","5,737","2.3","5,375 ± 159"],["37,103","6,038","0.5","6,400","2.7","5,950 ± 169"],["43,726","6,653","0.4","7,033","2.6","6,577 ± 173"],["51,532","7,407","0.9","7,771","2.9","7,253 ± 179"],["60,732","7,948","-0.2","8,439","2.5","7,983 ± 184"],["71,574","8,704","-0.4","9,198","2.2","8,774 ± 190"],["84,351","9,470","-0.7","10,166","2.8","9,617 ± 196"],["99,409","10,337","-1.0","11,049","2.5","10,536 ± 207"],["117,155","11,098","-2.0","11,906","1.9","11,513 ± 210"],["138,070","12,190","-1.6","13,016","2.1","12,549 ± 218"],["162,718","13,372","-1.3","14,106","2.0","13,669 ± 221"],["191,766","14,687","-0.8","15,234","1.7","14,862 ± 220"],["226,000","15,945","-0.9","16,564","1.9","16,147 ± 219"],["266,346","17,283","-1.1","17,882","1.7","17,513 ± 217"],["313,893","18,541","-2.0","19,252","1.4","18,962 ± 211"],["369,929","19,843","-3.3","20,704","1.0","20,504 ± 202"],["435,969","21,584","-3.1","22,114","-0.2","22,145 ± 181"],["513,797","23,340","-3.7","23,841","-0.4","23,905 ± 154"],["605,520","25,295","-3.9","25,831","0.5","25,771 ± 121"],["713,617","27,754","","27,754","","27,754 ± 0"]],"want":{"head":["num","num","num","num","num",""],"rows":[["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"],["num","num","num","num","num","soft"]]}},
  {"page":"week05","table":"table 4","kit":true,"headers":["Page","In-degree","Words","Predicted","× predicted","Named on","Headings"],"rows":[["Brian Braddock","1","7,226","899","×8.0","1","28"],["Miracleman","0","4,315","546","×7.9","0","15"],["Betsy Braddock","7","12,800","2,444","×5.2","3","48"],["U.S. Agent","6","9,615","2,220","×4.3","8","40"],["Isaiah Bradley","0","2,028","546","×3.7","1","12"],["Quasar","24","1,018","5,559","×0.18","22","9"],["Blue Bullet","2","325","1,205","×0.27","2","3"],["Ch'od","4","495","1,742","×0.28","4","5"],["Lei Kung","3","435","1,483","×0.29","3","4"],["Toxyn","3","468","1,483","×0.32","3","4"]],"want":{"head":["","num","num","num","","num","num"],"rows":[["","num","num","num","soft","num","num"],["","num","num","num","soft","num","num"],["","num","num","num","soft","num","num"],["","num","num","num","soft","num","num"],["","num","num","num","soft","num","num"],["","num","num","num","soft","num","num"],["","num","num","num","soft","num","num"],["","num","num","num","soft","num","num"],["","num","num","num","soft","num","num"],["","num","num","num","soft","num","num"]]}},
  {"page":"week05","table":"table 6","kit":true,"headers":["Rank","Page","Words","z","Rare words","House phrasing","What reading found"],"rows":[["1","Coldblood","667","+2.91","6.3% (5.3%)","3.9% (2.5%)","A short cyborg page whose powers section lists body parts and abilities, each named once, in ordinary words."],["2","Super Rabbit","462","+2.55","13.4% (6.2%)","0.0% (3.4%)","A funny-animal hero from Timely, Marvel's predecessor, so the house lead is missing. The text runs through comic titles, dates and artists."],["3","Ravage 2099","975","+2.50","9.6% (6.4%)","1.4% (2.5%)","Long interview quotes from the artist and the editor, in spoken English the encyclopedia pages do not use."],["4","Paladin (comics)","1,202","+2.33","6.0% (7.3%)","1.3% (1.8%)","A mercenary's record that moves from one team-up to the next, each with a new cast."],["5","Sabra (character)","2,675","+2.26","15.3% (7.4%)","0.6% (1.8%)","Hebrew names, Israeli places and the story of the character's creation, in words few other pages use."],["303","Ms. Marvel","1,753","−4.15","8.7% (7.7%)","10.2% (1.9%)","The name of four heroines. Each part repeats the codename in the same sentence frame, then sales rankings repeat another."],["302","Gorgon (Inhuman)","798","−3.44","7.4% (5.5%)","12.4% (2.5%)","A media list, line after line of \"Gorgon appears in …, voiced by …\", much of it house phrasing."],["301","Hawkeye (comics)","349","−3.38","5.4% (5.2%)","3.1% (3.8%)","A short page about several Hawkeyes that repeats the name in nearly every sentence."],["300","Abomination (character)","3,930","−2.95","8.3% (8.6%)","1.8% (1.2%)","One long record of fights with the Hulk: \"the Abomination\" and \"the Hulk\" return in almost every sentence."],["299","Captain Marvel (Marvel Comics)","2,640","−2.87","5.8% (7.8%)","7.2% (1.7%)","The name of several heroes. Each version opens with the same frame, \"The second Captain Marvel is …\"."]],"want":{"head":["","","num","num","","",""],"rows":[["","soft","num","num","soft","soft","soft"],["","soft","num","num","soft","soft","soft"],["","soft","num","num","soft","soft","soft"],["","soft","num","num","soft","soft","soft"],["","soft","num","num","soft","soft","soft"],["","soft","num","num","soft","soft","soft"],["","soft","num","num","soft","soft","soft"],["","soft","num","num","soft","soft","soft"],["","soft","num","num","soft","soft","soft"],["","soft","num","num","soft","soft","soft"]]}},
];

test("decorationFor gives the classes and bars main's decorate() left on Week 4 and Week 5", () => {
  const flags = { bar: 0, meter: 0, custom: 0, fraction: 0, soft: 0, plain: 0 };
  for (const f of MAIN) {
    const where = `${f.page} ${f.table}`;
    const plan = decorationFor(f);
    assert.ok(plan, `${where}: a table with rows`);
    // kit.js table() writes "num" on a numeric column's head and cells before decorate() runs.
    const num = (got, want, at) => {
      if (got === "num") assert.equal(want, "num", `${at}: num`);
      else assert.ok(want === "" || (f.kit && want === "num"), `${at}: ${want} without decoration`);
    };
    plan.head.forEach((cls, j) => num(cls, f.want.head[j], `${where} head ${j}`));
    plan.rows.forEach((row, i) => {
      assert.equal(row.rx, true);
      row.cells.forEach(({ className, bar }, j) => {
        const at = `${where} row ${i} cell ${j}`;
        const [cls, kind, width] = f.want.rows[i][j].split(" ");
        if (className === "soft" || cls === "soft") assert.equal(className, cls, `${at}: soft`);
        else num(className, cls, at);
        assert.equal(Boolean(bar), Boolean(kind), `${at}: a bar`);
        if (!bar) return;
        assert.equal(bar.kind || "-", kind, `${at}: bar kind`);
        assert.match(bar.width, /^\d+\.\d%$/, `${at}: width to one decimal`);
        assert.equal(parseFloat(bar.width), parseFloat(width), `${at}: bar width`);
        if (bar.kind === "meter") flags.meter++;
        else if (f.rxBars) {
          flags.custom++;
          if (String(f.rows[i][j]).endsWith("%")) flags.fraction++;
        } else flags.bar++;
      });
      flags.soft += row.cells.filter((c) => c.className === "soft").length;
      flags.plain += row.cells.filter((c) => c.className === "num" && !c.bar).length;
    });
  }
  // The fixtures exercise every rule: the automatic bar and meter, data-rx-bars
  // with a percentage read as a fraction, softened text and numbers without a bar.
  for (const [rule, n] of Object.entries(flags)) assert.ok(n > 0, `the fixtures exercise ${rule}`);
});

test("decorate() applies decorationFor to built and decorated tables alike", () => {
  const tables = [
    ...builtTables("out/weeks/week04/index.html"),
    ...builtTables("out/weeks/week05/index.html"),
    ...MAIN,
  ];
  assert.ok(tables.some((t) => t.page.startsWith("out/") && t.rows.length && t.rxBars), "a built table carries data-rx-bars");
  for (const f of tables) {
    const where = `${f.page} ${f.table}`;
    const table = stubTable(f);
    const plan = decorationFor(f);
    const before = readDecoration(table);
    decorate(table);
    if (!plan) {
      assert.deepEqual(readDecoration(table), before, `${where}: a table without rows stays as it was`);
      continue;
    }
    assert.deepEqual(readDecoration(table), plan, where);
    decorate(table);
    assert.deepEqual(readDecoration(table), plan, `${where}: decorating again changes nothing`);
  }
});

test("decorate() takes a bar off a cell whose number went away", () => {
  const f = MAIN.find((t) => t.table === "#where-break-links");
  const table = stubTable(f);
  decorate(table);
  const cell = table.tBodies[0].rows[0].cells[2];
  const own = cell.querySelector(":scope > .rx-cell").lastElementChild;
  own.replaceChildren("n/a");
  const rows = f.rows.map((r, i) => (i === 0 ? r.map((c, j) => (j === 2 ? "n/a" : c)) : r));
  const plan = decorationFor({ ...f, rows });
  assert.deepEqual(plan.rows[0].cells[2], { tag: "td", className: "num", bar: null });
  decorate(table);
  assert.equal(cell.querySelector(":scope > .rx-cell"), null, "the bar is gone");
  assert.equal(cell.textContent, "n/a");
  assert.deepEqual(readDecoration(table).rows[0].cells[2], plan.rows[0].cells[2]);
});

test("decorationFor reads data-rx-bars and leaves a table without rows alone", () => {
  const headers = ["Year", "Placing", "Direct"];
  const rows = [
    ["2022", "2.7%", "1.5"],
    ["2023", "0.01%", "3"],
    ["2024", "5%", "1"],
    ["2025", "1%", "0.5"],
    ["2026", "2%", "n/a"],
  ];
  assert.equal(decorationFor({ headers, rows: [] }), null);
  const plan = decorationFor({ headers, rows, rxBars: "1:0.04:placing,2:2" });
  assert.deepEqual(plan.head, ["", "num", "num"]);
  assert.deepEqual(plan.rows[0].cells[1].bar, { kind: "placing", width: "67.5%" });
  assert.deepEqual(plan.rows[1].cells[1].bar, { kind: "placing", width: "2.0%" });
  assert.deepEqual(plan.rows[0].cells[2].bar, { kind: "", width: "75.0%" });
  assert.deepEqual(plan.rows[2].cells[1].bar, { kind: "placing", width: "100.0%" });
  assert.deepEqual(plan.rows[4].cells[2], { tag: "td", className: "num", bar: null });
  // A data-rx-bars with no valid column still turns the automatic bars off.
  const links = decorationFor({ headers: ["Name", "Links"], rows: [["a", "12"], ["b", "3"]], rxBars: "x:y" });
  assert.equal(links.rows[0].cells[1].bar, null);
  assert.ok(decorationFor({ headers: ["Name", "Links"], rows: [["a", "12"], ["b", "3"]] }).rows[0].cells[1].bar);
  // A column is numeric when 80% of its filled cells are numbers.
  const share = (cells) => decorationFor({ headers: ["", "n"], rows: cells.map((c, i) => [`r${i}`, c]) }).rows[0].cells[1].className;
  assert.equal(share(["1", "2", "3", "4", "n/a"]), "num");
  assert.equal(share(["1", "2", "3", "n/a", "-"]), "soft");
  assert.equal(share(["1", "2", "3", "4", ""]), "num");
  // A body <th> counts for its column but gains nothing; raw text is squashed.
  const th = decorationFor({ headers: ["", "Edges"], rows: [[{ text: "a", tag: "TH" }, { text: " 1,200\n", tag: "td" }], ["b", "300"]] });
  assert.deepEqual(th.rows[0].cells[0], { tag: "th", className: "", bar: null });
  assert.deepEqual(th.rows[0].cells[1].bar, { kind: "", width: "100.0%" });
  assert.deepEqual(th.rows[1].cells[1].bar, { kind: "", width: "25.0%" });
});

// ---- strip charts

const fmt = (v) => v.toFixed(2);
const ROWS = [
  { label: "Real network", sub: "giant component", real: 0.42, realLabel: "0.42", realTip: "real", base: [0.2, 0.05], baseLabel: "random 0.20", baseTip: "band", ci: [0.38, 0.47], ciTip: "ci", badge: "2.1× random", bold: true },
  { label: "Null model", real: 0.01, realLabel: "0.01 at the far left", hollow: true, color: "--people", base: [0.3, 0.0001], baseLabel: "band", ref: [0.95, "a reference at the end"], divider: true },
  { label: "A very long row label that needs room", sub: "with a sub", real: 0.99, realLabel: "0.99", badge: "x", ci: [0.9, 1.2] },
  { label: "No real value", real: null, base: [0.5, 0.1] },
];
const OPTS = { domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1], fmt, axisTitle: "share", aria: "strip", zeroLine: 0.1, ref: [0.6, "global ref"] };
const MINIS = [
  { domain: [0, 1], real: 0.3, realLabel: "0.30 real", base: [0.5, 0.1], baseLabel: "random", aria: "m1" },
  { domain: [0, 10], real: 9.9, realLabel: "9.9 near the end", ref: 1, refLabel: "ref", ci: [8.123, 10.5], aria: "m2" },
  { domain: [-5, 5], real: 2, realLabel: "2", base: [0, 0.01], ref: 0, aria: "m3" },
];

const all = (el, tag) => [...(el.tagName === tag ? [el] : []), ...el.children.flatMap((c) => all(c, tag))];
const num = (el, k) => Number(el.getAttribute(k));
const at = (el, ...keys) => keys.map((k) => num(el, k));

// Every label a layout places, as [x, y, anchor, text].
function placed(labels) {
  return labels.filter(Boolean).map((l) => [l.x, l.y, l.anchor, String(l.text)]);
}
const bandLine = (b) => [b.mean, b.y1, b.mean, b.y2];
const ciLines = (c) => [
  [c.lo, c.y, c.hi, c.y],
  [c.lo, c.y1, c.lo, c.y2],
  [c.hi, c.y1, c.hi, c.y2],
];
const texts = (svg) => all(svg, "text").map((t) => [num(t, "x"), num(t, "y"), t.getAttribute("text-anchor"), t.textContent]);

test("stripChart draws the geometry stripLayout gives", () => {
  let seen = { above: 0, beside: 0, start: 0, end: 0 };
  for (const width of [300, 420, 556, 800]) {
    for (const [rows, opts] of [
      [ROWS, OPTS],
      [ROWS.slice(0, 2), { domain: [-1, 2], ticks: [-1, 0, 2], fmt: (v) => `${v}×`, aria: "b", labelW: 120, rowH: 48, badgeW: 90, top: 4, ref: [1.5, ""] }],
    ]) {
      const where = `${opts.aria} at ${width}`;
      const L = stripLayout(rows, opts, width, measure);
      const svg = stripChart(rows, { ...opts, width });
      seen[L.above ? "above" : "beside"]++;
      assert.deepEqual(at(svg, "width", "height"), [L.width, L.height], where);
      assert.equal(svg.getAttribute("viewBox"), `0 0 ${L.width} ${L.height}`);
      const across = (x) => [x, L.gridTop, x, L.ybot];
      const lines = [
        ...L.ticks.map((t) => across(t.x)),
        ...(L.zero !== undefined ? [across(L.zero)] : []),
        ...(L.ref ? [across(L.ref.x)] : []),
        ...L.rows.flatMap((r) => [
          ...(r.divider !== null ? [[0, r.divider, L.width, r.divider]] : []),
          [L.x0, r.cy, L.x1, r.cy],
          ...(r.base ? [bandLine(r.base.band)] : []),
          ...(r.ref ? [[r.ref.x, r.ref.y1, r.ref.x, r.ref.y2]] : []),
          ...(r.ci ? ciLines(r.ci) : []),
        ]),
      ];
      assert.deepEqual(all(svg, "line").map((l) => at(l, "x1", "y1", "x2", "y2")), lines, `${where}: lines`);
      const dots = L.rows.filter((r) => r.real).map((r) => [r.real.dot.cx, r.real.dot.cy, r.real.dot.r]);
      assert.deepEqual(all(svg, "circle").map((c) => at(c, "cx", "cy", "r")), dots, `${where}: dots`);
      const rects = all(svg, "rect");
      const bands = L.rows.filter((r) => r.base).map(({ base: { band: b } }) => [b.x, b.y, b.width]);
      assert.deepEqual(rects.filter((r) => num(r, "height") === 12).map((r) => at(r, "x", "y", "width")), bands, `${where}: bands`);
      const badges = L.rows.filter((r) => r.badge).map(({ badge: b }) => [b.x, b.y, b.width]);
      assert.deepEqual(rects.filter((r) => num(r, "height") === 22).map((r) => at(r, "x", "y", "width")), badges, `${where}: badges`);
      const want = [
        ...L.ticks.map((t) => [t.x, t.y, "middle", t.label]),
        ...placed([L.ref?.label]),
        ...L.rows.flatMap((r, i) => [
          [r.label.x, r.label.y, null, rows[i].label],
          ...(r.sub ? [[r.sub.x, r.sub.y, null, rows[i].sub]] : []),
          ...placed([r.base?.label, r.ref?.label, r.real?.label]),
          ...(r.badge ? [[r.badge.textX, r.badge.textY, "middle", rows[i].badge]] : []),
        ]),
        ...(L.axisTitle ? [[L.axisTitle.x, L.axisTitle.y, "end", L.axisTitle.text]] : []),
      ];
      const got = texts(svg);
      assert.equal(got.length, want.length, `${where}: label count`);
      for (const t of want) assert.ok(got.some((g) => JSON.stringify(g) === JSON.stringify(t)), `${where}: label ${JSON.stringify(t)}`);
      for (const [, , anchor] of got) if (anchor === "start" || anchor === "end") seen[anchor]++;
    }
  }
  for (const [what, n] of Object.entries(seen)) assert.ok(n > 0, `the specs exercise ${what}`);
});

test("miniStrip draws the geometry miniLayout gives", () => {
  for (const width of [120, 300, 333.3]) {
    for (const spec of MINIS) {
      const where = `${spec.aria} at ${width}`;
      const L = miniLayout(spec, width, measure);
      const svg = miniStrip({ ...spec, width });
      assert.deepEqual(at(svg, "width", "height"), [L.width, L.height], where);
      assert.deepEqual(all(svg, "circle").map((c) => at(c, "cx", "cy", "r")), [[L.real.dot.cx, L.real.dot.cy, L.real.dot.r]]);
      const bands = L.base ? [[L.base.band.x, L.base.band.y, L.base.band.width]] : [];
      assert.deepEqual(all(svg, "rect").map((r) => at(r, "x", "y", "width")), bands, `${where}: band`);
      const lines = [
        [L.x0, L.cy, L.x1, L.cy],
        ...(L.base ? [bandLine(L.base.band)] : []),
        ...(L.ref ? [[L.ref.x, L.ref.y1, L.ref.x, L.ref.y2]] : []),
        ...(L.ci ? ciLines(L.ci) : []),
      ];
      assert.deepEqual(all(svg, "line").map((l) => at(l, "x1", "y1", "x2", "y2")), lines, `${where}: lines`);
      if (L.ci) assert.equal(all(svg, "title").some((t) => t.textContent === L.ci.tip), true, `${where}: ci tip`);
      assert.deepEqual(texts(svg), placed([L.base?.label, L.ref?.label, L.real.label]), `${where}: labels`);
    }
  }
});

test("the layouts measure text with the function they are given", () => {
  const wide = (text, role, weight) => 3 * measure(text, role, weight);
  assert.equal(stripLayout(ROWS, OPTS, 800, measure).above, false);
  assert.equal(stripLayout(ROWS, OPTS, 800, wide).above, true);
  assert.equal(miniLayout(MINIS[0], 120, measure).real.label.anchor, "middle");
  assert.equal(miniLayout(MINIS[0], 120, wide).real.label.anchor, "start");
});
