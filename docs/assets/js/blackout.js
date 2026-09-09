/* All counts are recomputed from edges here, then checked against NetworkX. */
(() => {
  'use strict';
  const root = document.querySelector('[data-blackout-src]');
  if (!root) return;
  const $ = id => document.getElementById(id);
  const svgNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, content = '') => {
    const node = document.createElementNS(svgNS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (content) node.textContent = content;
    return node;
  };
  let data, nodes, current = null, mode = 'real', example = 0;

  function measure(links, removed) {
    const adjacency = new Map(data.nodes.filter(n => n.id !== removed).map(n => [n.id, []]));
    links.forEach(([a, b]) => {
      if (a !== removed && b !== removed) {
        adjacency.get(a).push(b); adjacency.get(b).push(a);
      }
    });
    const seen = new Set(), components = [];
    for (const id of adjacency.keys()) {
      if (seen.has(id)) continue;
      const queue = [id]; seen.add(id);
      for (let i = 0; i < queue.length; i++) {
        for (const neighbor of adjacency.get(queue[i])) {
          if (!seen.has(neighbor)) { seen.add(neighbor); queue.push(neighbor); }
        }
      }
      components.push(queue);
    }
    components.sort((a, b) => b.length - a.length);
    const largest = new Set(components[0]);
    const stranded = [...adjacency.keys()].filter(n => !largest.has(n)).sort();
    return { largest: largest.size, stranded, count: stranded.length };
  }

  function verify(links, outcomes) {
    const degrees = new Map(data.nodes.map(n => [n.id, 0]));
    const unique = new Set();
    for (const [a, b] of links) {
      if (!degrees.has(a) || !degrees.has(b) || a === b) throw Error('Invalid edge');
      const key = [a, b].sort().join('|');
      if (unique.has(key)) throw Error('Duplicate edge');
      unique.add(key); degrees.set(a, degrees.get(a) + 1); degrees.set(b, degrees.get(b) + 1);
    }
    if (links.length !== data.population.edges || measure(links, null).largest !== 277) throw Error('Invalid graph');
    for (const n of data.nodes) if (degrees.get(n.id) !== n.degree) throw Error('Degree mismatch');
    for (const c of data.cases) {
      const actual = measure(links, c.id), expected = outcomes[c.id];
      if (actual.count !== expected.count || actual.largest !== expected.largest ||
          JSON.stringify(actual.stranded) !== JSON.stringify(expected.stranded)) throw Error('Outcome mismatch');
    }
  }

  function draw(links, result) {
    const svg = $('blackout-graph');
    svg.replaceChildren();
    const stranded = new Set(result.stranded);
    const title = el('title', { id: 'blackout-map-title' }, current ? `${current.label} removed: ${result.count} stranded articles` : 'The connected 277-article starting network');
    const description = el('desc', { id: 'blackout-map-description' }, current ?
      `${mode === 'real' ? 'Real' : 'Shuffled'} undirected links. ${result.largest} remaining articles are together; ${result.count} are outside that group. Names of stranded articles are listed beside the map. Yellow cross: removed article. Lilac outlined dots: stranded. Green dots: main group. Positions are kept fixed to compare wiring.` :
      '277 articles and 1,421 undirected links. Choose one of the four hero buttons to remove its article and see the change.');
    svg.append(title, description);
    const edges = el('g', { 'aria-hidden': 'true' });
    for (const [a, b] of links) {
      if (current && (a === current.id || b === current.id)) continue;
      const source = nodes.get(a), target = nodes.get(b), detached = stranded.has(a);
      edges.append(el('line', { x1: source.x, y1: source.y, x2: target.x, y2: target.y,
        stroke: detached ? '#c0b0f2' : '#829469', 'stroke-opacity': detached ? .9 : .17,
        'stroke-width': detached ? 2.7 : .8 }));
    }
    svg.append(edges);
    const dots = el('g', { 'aria-hidden': 'true' });
    for (const n of data.nodes) {
      if (current && n.id === current.id) continue;
      const detached = stranded.has(n.id), candidate = !current && data.cases.some(c => c.id === n.id);
      const radius = detached ? 6.5 : 2.2 + Math.sqrt(n.degree) * .38;
      const circle = el('circle', { cx: n.x, cy: n.y, r: radius,
        fill: detached ? '#c0b0f2' : candidate ? '#e7fa52' : '#a4b98a',
        opacity: detached || candidate ? 1 : .75, stroke: detached ? '#ffffff' : '#141614',
        'stroke-width': detached ? 1.6 : .7 });
      circle.append(el('title', {}, n.name)); dots.append(circle);
      if (detached) dots.append(el('circle', { cx: n.x, cy: n.y, r: 13, fill: 'none', stroke: '#c0b0f2', 'stroke-opacity': .5 }));
    }
    svg.append(dots);
    if (current) {
      const n = nodes.get(current.id), group = el('g', { 'aria-hidden': 'true' });
      group.append(el('circle', { cx: n.x, cy: n.y, r: 13, fill: '#141614', stroke: '#e7fa52', 'stroke-dasharray': '3 3' }));
      group.append(el('path', { d: `M${n.x - 5},${n.y - 5}l10,10m0,-10l-10,10`, stroke: '#e7fa52', 'stroke-width': 2 }));
      group.append(el('text', { x: n.x, y: n.y - 21, 'text-anchor': 'middle', fill: '#e7fa52', 'font-size': 15, class: 'chart-label' }, `${current.label} removed`));
      svg.append(group);
    }
  }

  function render(announce = true) {
    const links = mode === 'real' ? data.links : data.examples[example].links;
    const result = measure(links, current?.id ?? null);
    draw(links, result);
    $('map-prompt').hidden = Boolean(current);
    $('world-controls').hidden = !current;
    $('restore-network').disabled = !current;
    $('damage-count').textContent = current ? result.count : '—';
    $('damage-label').textContent = current ? (result.count === 1 ? 'ARTICLE STRANDED' : 'ARTICLES STRANDED') : 'PICK A HERO';
    $('damage-caption').textContent = current ? `${current.label.toUpperCase()} REMOVED` : 'ONE ARTICLE. ONE DECISION.';
    $('lab-state').textContent = current ? `${mode === 'real' ? 'REAL LINKS' : `SHUFFLED WORLD ${example + 1} / ${data.examples.length}`} · ONE HERO REMOVED` : 'REAL LINKS · EVERYONE IS HERE';
    const labels = result.stranded.map(id => nodes.get(id).name);
    const copy = !current ? 'Pull one of the four heroes above. Watch which articles lose their route to the main group.' :
      result.count === 0 ? `All ${result.largest} other articles still have a route to one another. There are ways around ${current.label}.` :
        `${result.count} other ${result.count === 1 ? 'article loses its' : 'articles lose their'} route to the main group. ${result.largest} articles stay together.`;
    $('damage-copy').textContent = copy;
    $('damage-meta').textContent = current ? `277 at the start · 1 removed · ${result.largest} together · ${result.count} stranded` : '277 at the start · 0 removed · 277 together';
    const list = $('stranded-articles'); list.replaceChildren();
    result.stranded.forEach(id => {
      const li = document.createElement('li'), a = document.createElement('a');
      a.href = nodes.get(id).url; a.textContent = nodes.get(id).name;
      a.target = '_blank'; a.rel = 'noopener noreferrer'; li.append(a); list.append(li);
    });
    document.querySelectorAll('[data-remove]').forEach(button => {
      const selected = button.dataset.remove === current?.id;
      button.setAttribute('aria-pressed', selected);
      button.querySelector('.switch-symbol').textContent = selected ? '×' : '−';
    });
    document.querySelectorAll('[data-wiring]').forEach(button => button.setAttribute('aria-pressed', button.dataset.wiring === mode));
    $('next-world').hidden = mode !== 'shuffle';
    if (current) {
      const nul = current.null;
      $('world-title').textContent = mode === 'real' ? 'NOW CHANGE THE WIRING.' : 'SAME DEGREES. A DIFFERENT WORLD.';
      $('world-copy').textContent = mode === 'real' ?
        `${current.label} starts with ${current.degree} connections. What if every character kept their link count, but connected to different people? Switch worlds and pull the same hero.` :
        `${current.label} still starts with ${current.degree} connections. Every other article keeps its count too. With this wiring, removing the same hero strands ${result.count}.`;
      $('world-note').textContent = `Across all 1,000 shuffled worlds: ${nul.mean.toFixed(2)} stranded on average; the middle 95% ran from ${nul.interval95[0]} to ${nul.interval95[1]}. Real network: ${current.real.count}. ${mode === 'shuffle' ? `Showing one of the first four recorded draws (seed ${data.examples[example].seed}).` : 'The map examples are individual draws; the result uses all 1,000.'}`;
    }
    if (announce) $('blackout-announcement').textContent = `${current ? current.label + ' removed. ' : ''}${mode === 'real' ? 'Real network. ' : 'Shuffled world. '}${copy}${labels.length ? ' Stranded: ' + labels.join(', ') + '.' : ''}`;
  }

  async function init() {
    try {
      const response = await fetch(root.dataset.blackoutSrc);
      if (!response.ok) throw Error('Data unavailable');
      data = await response.json(); nodes = new Map(data.nodes.map(n => [n.id, n]));
      if (data.nodes.length !== 277 || nodes.size !== 277 || data.cases.length !== 4) throw Error('Invalid roster');
      verify(data.links, Object.fromEntries(data.cases.map(c => [c.id, c.real])));
      for (const world of data.examples) verify(world.links, world.outcomes);
      document.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
        current = data.cases.find(c => c.id === button.dataset.remove); render();
      }));
      document.querySelectorAll('[data-wiring]').forEach(button => button.addEventListener('click', () => {
        mode = button.dataset.wiring; render();
      }));
      $('next-world').addEventListener('click', () => { example = (example + 1) % data.examples.length; render(); });
      $('restore-network').addEventListener('click', () => {
        current = null; mode = 'real'; example = 0; render();
        document.querySelector('[data-remove]').focus({ preventScroll: true });
      });
      $('interactive-controls').hidden = false;
      $('interactive-lab').hidden = false;
      $('experiment-fallback').hidden = true;
      render(false);
      root.dataset.ready = 'true';
    } catch (error) {
      $('interactive-controls').hidden = true;
      $('interactive-lab').hidden = true;
      $('experiment-fallback').hidden = false;
      $('experiment-error').textContent = 'The interactive map could not load. The verified results and figure below are still available.';
      root.dataset.ready = 'error';
    }
  }
  init();
})();
