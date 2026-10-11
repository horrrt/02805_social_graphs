import { HeroStat, NetworkView, PostHero } from "log-log-legends-kit";

// Week 5's hero scatter, precomputed at 560px from public/weeks/week05/data/fame.json with
// fameLayout() in src/scripts/week05-frame.js: words on each of the 303 pages against
// 1 + in-degree, both logarithmic, with the fitted line and the two outliers the caption names.
const DOTS: [number, number][] = [[223.7,111.8],[261.2,87.7],[206.8,163.5],[122.1,202.0],[122.1,193.5],[186.2,195.5],[238.0,113.1],[279.8,116.2],[223.7,192.1],[223.7,126.7],[159.6,209.4],[186.2,150.1],[186.2,171.3],[58.0,158.1],[159.6,113.1],[250.3,53.8],[270.9,151.2],[58.0,230.5],[302.1,94.0],[343.9,71.7],[58.0,242.3],[122.1,218.8],[206.8,130.0],[223.7,171.7],[366.2,76.6],[122.1,177.1],[348.0,89.7],[159.6,175.8],[58.0,178.1],[325.3,89.6],[186.2,191.0],[159.6,234.1],[122.1,197.1],[58.0,206.0],[159.6,153.6],[159.6,181.1],[122.1,187.1],[58.0,217.9],[58.0,194.7],[122.1,81.9],[270.9,128.0],[122.1,196.5],[343.9,110.8],[159.6,210.7],[186.2,183.3],[270.9,131.3],[58.0,202.2],[58.0,196.2],[238.0,128.3],[159.6,198.1],[206.8,213.5],[58.0,226.1],[206.8,114.6],[159.6,193.2],[287.8,96.1],[58.0,198.8],[122.1,202.4],[58.0,231.1],[362.8,101.7],[58.0,218.2],[122.1,205.0],[261.2,121.7],[384.1,71.4],[325.3,120.7],[122.1,206.9],[223.7,152.3],[58.0,168.4],[206.8,122.7],[122.1,176.3],[58.0,214.9],[223.7,142.8],[250.3,162.0],[159.6,157.8],[421.6,85.0],[58.0,228.7],[122.1,156.4],[122.1,199.3],[159.6,207.3],[287.8,64.7],[223.7,147.9],[343.9,65.4],[206.8,185.1],[58.0,227.5],[58.0,212.0],[58.0,206.2],[58.0,185.6],[122.1,150.6],[58.0,209.5],[223.7,146.6],[159.6,152.7],[159.6,206.4],[122.1,159.5],[122.1,213.9],[159.6,126.5],[302.1,135.4],[159.6,117.0],[122.1,194.2],[223.7,170.7],[122.1,181.5],[186.2,206.6],[250.3,142.0],[302.1,85.4],[250.3,161.8],[279.8,85.2],[238.0,178.0],[122.1,191.7],[223.7,190.0],[58.0,204.0],[238.0,160.9],[206.8,151.6],[238.0,78.4],[355.7,97.4],[58.0,228.4],[58.0,230.6],[58.0,259.7],[58.0,256.0],[206.8,96.0],[335.1,73.7],[122.1,184.5],[206.8,182.4],[122.1,201.3],[444.1,80.7],[159.6,193.5],[223.7,124.7],[58.0,172.9],[325.3,111.9],[308.4,112.0],[159.6,197.8],[250.3,147.5],[159.6,156.8],[58.0,245.3],[58.0,171.0],[343.9,72.1],[159.6,183.4],[122.1,155.7],[206.8,165.9],[58.0,144.3],[122.1,173.8],[186.2,137.5],[122.1,177.8],[351.9,59.7],[122.1,141.6],[250.3,175.3],[302.1,157.2],[261.2,88.5],[270.9,133.2],[279.8,107.1],[58.0,180.1],[159.6,127.0],[206.8,141.6],[186.2,183.8],[159.6,204.0],[159.6,153.3],[186.2,180.6],[186.2,214.4],[206.8,177.1],[159.6,174.9],[186.2,219.8],[186.2,151.9],[359.3,94.1],[238.0,143.3],[122.1,179.3],[58.0,197.4],[223.7,177.8],[314.4,104.4],[122.1,130.8],[58.0,191.9],[159.6,187.9],[308.4,79.1],[58.0,107.2],[314.4,132.3],[302.1,78.3],[348.0,83.4],[287.8,125.0],[58.0,231.6],[270.9,72.9],[122.1,171.3],[287.8,151.4],[58.0,197.5],[223.7,164.5],[122.1,193.3],[206.8,104.8],[223.7,199.0],[206.8,103.2],[320.0,121.3],[58.0,232.7],[238.0,186.6],[58.0,201.6],[223.7,169.9],[250.3,107.6],[186.2,175.3],[223.7,181.5],[355.7,96.5],[250.3,148.0],[159.6,184.0],[122.1,209.7],[223.7,149.8],[355.7,178.1],[279.8,85.0],[320.0,120.0],[206.8,154.7],[206.8,162.6],[186.2,180.2],[159.6,201.0],[223.7,134.7],[159.6,160.1],[122.1,140.2],[58.0,247.2],[159.6,192.6],[186.2,171.6],[238.0,112.8],[279.8,131.5],[58.0,184.6],[186.2,180.0],[261.2,117.2],[206.8,178.2],[58.0,219.2],[159.6,181.1],[186.2,130.7],[206.8,135.3],[186.2,197.4],[58.0,173.4],[261.2,184.2],[369.4,49.3],[159.6,208.9],[58.0,172.0],[58.0,208.6],[270.9,122.7],[58.0,176.7],[302.1,74.4],[186.2,116.9],[372.6,56.7],[159.6,164.1],[122.1,218.8],[186.2,127.8],[58.0,179.1],[58.0,188.3],[279.8,148.0],[122.1,207.9],[159.6,205.5],[58.0,193.9],[122.1,194.9],[58.0,183.9],[186.2,124.1],[159.6,119.7],[223.7,144.5],[490.2,66.5],[58.0,172.4],[250.3,121.2],[159.6,167.0],[279.8,138.2],[295.2,96.6],[320.0,69.2],[223.7,129.4],[295.2,93.6],[261.2,113.6],[159.6,147.4],[159.6,206.7],[159.6,200.7],[122.1,169.3],[339.6,68.9],[58.0,217.1],[58.0,216.9],[186.2,182.3],[159.6,222.4],[238.0,158.3],[159.6,175.6],[122.1,189.7],[159.6,179.4],[186.2,179.9],[186.2,188.6],[58.0,207.8],[58.0,222.1],[122.1,213.7],[206.8,171.5],[186.2,216.2],[186.2,169.8],[206.8,165.3],[122.1,217.9],[238.0,67.9],[159.6,158.7],[238.0,150.5],[261.2,134.9],[58.0,171.8],[223.7,162.4],[325.3,64.7],[223.7,158.3],[270.9,134.4],[186.2,174.9],[295.2,119.5],[250.3,113.7],[122.1,224.8],[159.6,177.3],[238.0,168.5],[58.0,169.4],[122.1,213.1],[186.2,145.9],[238.0,124.4],[438.2,82.3],[206.8,153.3],[159.6,165.2],[58.0,192.2],[58.0,159.3]];

const label = { fill: "var(--w4-hero-label)", fontSize: "var(--fs-caption)" };
const edge = { stroke: "var(--w4-hero-state-edge)" };

function FameScatter() {
  return (
    <div className="w5-hero-plot" role="img" aria-label="Scatter plot of the 303 pages: words on the page against 1 plus the number of pages linking to it, both on log scales, with the fitted line.">
      <svg viewBox="0 0 560 336" width="100%" aria-hidden="true">
        {[[58, "1"], [270.9, "10"], [483.9, "100"]].map(([x, t]) => (
          <g key={t}>
            <line x1={x} x2={x} y1={12} y2={292} style={edge} />
            <text x={x} y={308} textAnchor="middle" style={label}>{t}</text>
          </g>
        ))}
        {[[292, "100"], [179, "1,000"], [65.9, "10,000"]].map(([y, t]) => (
          <g key={t}>
            <line x1={58} x2={548} y1={y} y2={y} style={edge} />
            <text x={50} y={(y as number) + 4} textAnchor="end" style={label}>{t}</text>
          </g>
        ))}
        <text x={548} y={330} textAnchor="end" style={label}>1 + pages linking to it</text>
        <text x={58} y={10} style={label}>words on the page</text>
        {DOTS.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={3.2} style={{ fill: "var(--w4-hero-body)", fillOpacity: 0.55 }} />
        ))}
        <line x1={58} y1={208.7} x2={548} y2={21.1} style={{ stroke: "var(--w4-hero-ink)", strokeWidth: 1.6 }} />
        <circle cx={122.1} cy={81.9} r={4.5} style={{ fill: "var(--w4-hero-ink)" }} />
        <text x={130.1} y={71.9} style={{ fill: "var(--w4-hero-ink)", fontSize: "var(--fs-small)", fontWeight: 700 }}>Brian Braddock</text>
        <circle cx={355.7} cy={178.1} r={4.5} style={{ fill: "var(--w4-hero-ink)" }} />
        <text x={363.7} y={196.1} style={{ fill: "var(--w4-hero-ink)", fontSize: "var(--fs-small)", fontWeight: 700 }}>Quasar</text>
      </svg>
    </div>
  );
}

// Zachary's karate club, the template's toy hero figure, as public/styleguide/data/graphs.json holds it.
const karate = {"ratio":0.5665,"groups":["Mr. Hi's club","The officer's club"],"nodes":[{"id":"0","label":"0","x":0.6814,"y":0.1765,"group":0},{"id":"1","label":"1","x":0.5601,"y":0.2103,"group":0},{"id":"2","label":"2","x":0.4655,"y":0.2292,"group":0},{"id":"3","label":"3","x":0.5717,"y":0.0915,"group":0},{"id":"4","label":"4","x":0.8469,"y":0.1094,"group":0},{"id":"5","label":"5","x":0.9247,"y":0.0949,"group":0},{"id":"6","label":"6","x":0.9218,"y":0.1369,"group":0},{"id":"7","label":"7","x":0.5591,"y":0.1492,"group":0},{"id":"8","label":"8","x":0.3459,"y":0.2573,"group":0},{"id":"9","label":"9","x":0.2399,"y":0.1515,"group":1},{"id":"10","label":"10","x":0.8738,"y":0.0653,"group":0},{"id":"11","label":"11","x":0.7699,"y":0.1552,"group":0},{"id":"12","label":"12","x":0.6279,"y":0.0,"group":0},{"id":"13","label":"13","x":0.4897,"y":0.1719,"group":0},{"id":"14","label":"14","x":0.0544,"y":0.2934,"group":1},{"id":"15","label":"15","x":0.1272,"y":0.2712,"group":1},{"id":"16","label":"16","x":1.0,"y":0.1021,"group":0},{"id":"17","label":"17","x":0.7754,"y":0.2635,"group":0},{"id":"18","label":"18","x":0.0437,"y":0.4689,"group":1},{"id":"19","label":"19","x":0.5887,"y":0.3155,"group":0},{"id":"20","label":"20","x":0.0025,"y":0.308,"group":1},{"id":"21","label":"21","x":0.6975,"y":0.2749,"group":0},{"id":"22","label":"22","x":0.0911,"y":0.2431,"group":1},{"id":"23","label":"23","x":0.1532,"y":0.4482,"group":1},{"id":"24","label":"24","x":0.254,"y":0.5665,"group":1},{"id":"25","label":"25","x":0.2286,"y":0.5081,"group":1},{"id":"26","label":"26","x":0.0,"y":0.4045,"group":1},{"id":"27","label":"27","x":0.2331,"y":0.4492,"group":1},{"id":"28","label":"28","x":0.368,"y":0.3778,"group":1},{"id":"29","label":"29","x":0.0508,"y":0.4084,"group":1},{"id":"30","label":"30","x":0.2844,"y":0.2488,"group":1},{"id":"31","label":"31","x":0.2911,"y":0.4372,"group":1},{"id":"32","label":"32","x":0.1279,"y":0.3413,"group":1},{"id":"33","label":"33","x":0.21,"y":0.3229,"group":1}],"links":[{"source":"0","target":"1","weight":4},{"source":"0","target":"2","weight":5},{"source":"0","target":"3","weight":3},{"source":"0","target":"4","weight":3},{"source":"0","target":"5","weight":3},{"source":"0","target":"6","weight":3},{"source":"0","target":"7","weight":2},{"source":"0","target":"8","weight":2},{"source":"0","target":"10","weight":2},{"source":"0","target":"11","weight":3},{"source":"0","target":"12","weight":1},{"source":"0","target":"13","weight":3},{"source":"0","target":"17","weight":2},{"source":"0","target":"19","weight":2},{"source":"0","target":"21","weight":2},{"source":"0","target":"31","weight":2},{"source":"1","target":"2","weight":6},{"source":"1","target":"3","weight":3},{"source":"1","target":"7","weight":4},{"source":"1","target":"13","weight":5},{"source":"1","target":"17","weight":1},{"source":"1","target":"19","weight":2},{"source":"1","target":"21","weight":2},{"source":"1","target":"30","weight":2},{"source":"2","target":"3","weight":3},{"source":"2","target":"7","weight":4},{"source":"2","target":"8","weight":5},{"source":"2","target":"9","weight":1},{"source":"2","target":"13","weight":3},{"source":"2","target":"27","weight":2},{"source":"2","target":"28","weight":2},{"source":"2","target":"32","weight":2},{"source":"3","target":"7","weight":3},{"source":"3","target":"12","weight":3},{"source":"3","target":"13","weight":3},{"source":"4","target":"6","weight":2},{"source":"4","target":"10","weight":3},{"source":"5","target":"6","weight":5},{"source":"5","target":"10","weight":3},{"source":"5","target":"16","weight":3},{"source":"6","target":"16","weight":3},{"source":"8","target":"30","weight":3},{"source":"8","target":"32","weight":3},{"source":"8","target":"33","weight":4},{"source":"9","target":"33","weight":2},{"source":"13","target":"33","weight":3},{"source":"14","target":"32","weight":3},{"source":"14","target":"33","weight":2},{"source":"15","target":"32","weight":3},{"source":"15","target":"33","weight":4},{"source":"18","target":"32","weight":1},{"source":"18","target":"33","weight":2},{"source":"19","target":"33","weight":1},{"source":"20","target":"32","weight":3},{"source":"20","target":"33","weight":1},{"source":"22","target":"32","weight":2},{"source":"22","target":"33","weight":3},{"source":"23","target":"25","weight":5},{"source":"23","target":"27","weight":4},{"source":"23","target":"29","weight":3},{"source":"23","target":"32","weight":5},{"source":"23","target":"33","weight":4},{"source":"24","target":"25","weight":2},{"source":"24","target":"27","weight":3},{"source":"24","target":"31","weight":2},{"source":"25","target":"31","weight":7},{"source":"26","target":"29","weight":4},{"source":"26","target":"33","weight":2},{"source":"27","target":"33","weight":4},{"source":"28","target":"31","weight":2},{"source":"28","target":"33","weight":2},{"source":"29","target":"32","weight":4},{"source":"29","target":"33","weight":2},{"source":"30","target":"32","weight":3},{"source":"30","target":"33","weight":3},{"source":"31","target":"32","weight":4},{"source":"31","target":"33","weight":4},{"source":"32","target":"33","weight":5}]};

// Week 5's hero, as src/app/(week05)/weeks/week05/_sections/Hero.tsx writes it.
export const Week5 = () => (
  <PostHero
    id="top"
    eyebrow="Week 5 · The language half · NLP I · Go nuts"
    title="The Marvel network gets language"
    gridClass="w4-hero-grid w5-hero-grid"
    body={
      <>
        <b>Does a character's place in the link network show in the words of its page?</b>
        {" "}
        We read the 303 Marvel Wikipedia pages as text, with this week's tools: tokens,
        counts, n-grams, concordances and the document-term matrix, and asked seven
        questions where the words meet the links.
      </>
    }
    caution="A link is an editor's choice to point to a page, not a friendship in the comics."
    stats={
      <>
        <HeroStat value="713,617" label="words on 303 pages" />
        <HeroStat value="1,784" label="links between the pages" />
      </>
    }
  >
    <figure className="w4-hero-stage w5-hero-stage">
      <FameScatter />
      <figcaption className="w5-hero-caption">
        Each dot is a page; both axes are logarithmic. Pages with more incoming links are longer:
        Pearson r = 0.77 on the logs, against 0.00 ± 0.06 when in-degree is shuffled over the pages.
        {" "}
        <a href="#fame">Section 6</a>
        {" "}
        reads the pages furthest from the line.
      </figcaption>
    </figure>
  </PostHero>
);

// The post template's hero: the same frame with the toy karate-club figure.
export const Template = () => (
  <PostHero
    id="top"
    eyebrow="Week N · Course topic"
    title="A title that states the question"
    gridClass="w4-hero-grid w5-hero-grid"
    body={
      <>
        <b>The one question the whole post answers, in words a visitor can answer after reading?</b>
        {" "}
        One or two sentences on the data and on what the sections below ask.
      </>
    }
    caution="The scope caution: what a link or a count in this data does not mean."
    stats={
      <>
        <HeroStat value="000,000" label="the first number that sets the scale" />
        <HeroStat value="0,000" label="the second number" />
      </>
    }
  >
    <figure className="w4-hero-stage w5-hero-stage">
      <div className="w5-hero-plot" role="img" aria-label="Toy figure: replace with the one figure that answers the question">
        <NetworkView spec={{ theme: "dark", ...karate, labels: "inside", badges: true, legend: true, aria: "Zachary's karate club, 34 members, coloured by the club each joined" }} />
      </div>
      <figcaption className="w5-hero-caption">
        How to read the figure and the one thing to notice, with the number against its baseline.
        Toy figure: Zachary's karate club stands in for your data.
        {" "}
        <a href="#first">Section 1</a>
        {" "}
        has the detail.
      </figcaption>
    </figure>
  </PostHero>
);
