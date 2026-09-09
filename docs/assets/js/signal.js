/* Hypothetical additions never mutate the source graph. Reach is computed locally. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const NS = 'http://www.w3.org/2000/svg';
  const edits = {snapshot: [], out: [['Baymax', 'Spider-Man']], in: [['Spider-Man', 'Baymax']], both: [['Baymax', 'Spider-Man'], ['Spider-Man', 'Baymax']]};
  const palette = {to: '#e7fa52', from: '#c0b0f2', both: '#f4f5ef', none: '#53594c'};
  let graph, scenarios, nodes, positions, mapDots, addedLayer, map;
  let phase = 1, mode = 'snapshot';
  const svg = (tag, attrs = {}, text) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (text !== undefined) el.textContent = text;
    return el;
  };
  function reachable(adjacency) {
    const seen = new Set(['Baymax']), queue = ['Baymax'];
    for (let index = 0; index < queue.length; index++) {
      for (const id of adjacency.get(queue[index])) if (!seen.has(id)) { seen.add(id); queue.push(id); }
    }
    seen.delete('Baymax');
    return seen;
  }
  function buildScenarios() {
    const result = {};
    for (const [key, additions] of Object.entries(edits)) {
      const forward = new Map(nodes.map(n => [n.id, new Set()]));
      const reverse = new Map(nodes.map(n => [n.id, new Set()]));
      for (const [source, target] of [...graph.links.map(e => [e.s, e.t]), ...additions]) {
        forward.get(source).add(target); reverse.get(target).add(source);
      }
      const to = reachable(reverse), from = reachable(forward);
      const roundTrip = [...to].filter(id => from.has(id)).length;
      const expected = graph.signal?.[key];
      if (!expected || expected.to !== to.size || expected.from !== from.size || expected.roundTrip !== roundTrip || expected.added !== additions.length) throw new Error('Scenario verification failed: ' + key);
      result[key] = {to, from, roundTrip};
    }
    return result;
  }
  function drawScene() {
    map = $('#signal-map');
    map.replaceChildren(svg('title', {id: 'signal-map-title'}), svg('desc', {id: 'signal-map-desc'}));
    const defs = svg('defs');
    for (const kind of ['to', 'from']) {
      const marker = svg('marker', {id: 'arrow-' + kind, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse'});
      marker.append(svg('path', {d: 'M 0 0 L 10 5 L 0 10 z', fill: palette[kind]})); defs.append(marker);
    }
    map.append(defs);
    positions = new Map();
    let islandIndex = 0, isolateIndex = 0;
    for (const node of nodes) {
      let point;
      if (node.id === 'Baymax') point = [150, 260];
      else if (node.grp === 'giant') point = [360 + (node.x - 55) / 605 * 575, 70 + (node.y - 60) / 520 * 370];
      else if (node.grp === 'island') { const angle = islandIndex++ * Math.PI * 2 / 9; point = [828 + 43 * Math.cos(angle), 548 + 43 * Math.sin(angle)]; }
      else { point = [370 + isolateIndex % 8 * 30, 530 + Math.floor(isolateIndex / 8) * 28]; isolateIndex++; }
      positions.set(node.id, point);
    }
    const background = svg('g', {'aria-hidden': 'true'}), dots = svg('g', {'aria-hidden': 'true'});
    const seen = new Set();
    for (const edge of graph.links) {
      const key = [edge.s, edge.t].sort().join('|'); if (seen.has(key)) continue; seen.add(key);
      const a = positions.get(edge.s), b = positions.get(edge.t);
      background.append(svg('line', {x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#5a624f', 'stroke-width': .6, opacity: .25}));
    }
    mapDots = new Map();
    for (const node of nodes) {
      const [cx, cy] = positions.get(node.id);
      const radius = node.id === 'Baymax' ? 22 : node.id === 'Spider-Man' ? 11 : 2.6 + Math.sqrt(node.kin) * .45;
      const dot = svg('circle', {cx, cy, r: radius, class: 'scene-node', fill: palette.none, 'data-scene-node': node.id});
      dot.append(svg('title', {}, node.name)); dots.append(dot); mapDots.set(node.id, dot);
    }
    addedLayer = svg('g', {'aria-hidden': 'true'});
    map.append(background, addedLayer, dots);
    map.append(svg('circle', {cx: 150, cy: 260, r: 42, fill: 'none', stroke: '#f4f5ef', 'stroke-width': 1}));
    map.append(svg('text', {x: 150, y: 337, 'text-anchor': 'middle', class: 'baymax-label'}, 'BAYMAX'));
    map.append(svg('text', {x: 150, y: 363, 'text-anchor': 'middle', class: 'scene-label', id: 'baymax-scene-status'}, 'NO WAY IN. NO WAY OUT.'));
    const spider = positions.get('Spider-Man');
    map.append(svg('circle', {cx: spider[0], cy: spider[1], r: 17, fill: 'none', stroke: '#f4f5ef', 'stroke-width': 1}));
    map.append(svg('text', {x: spider[0] + 24, y: spider[1] + 5, class: 'spider-label'}, 'Spider-Man'));
    map.append(svg('text', {x: 360, y: 34, class: 'scene-label'}, 'THE ORIGINAL GROUP / 277 ARTICLES'));
    map.append(svg('text', {x: 355, y: 602, class: 'scene-label'}, '16 OTHER ISOLATES'));
    map.append(svg('text', {x: 735, y: 622, class: 'scene-label'}, 'THE ISLAND / 9'));
  }
  function feedback(kicker, copy, success = false) {
    const container = $('#mission-feedback'); container.classList.toggle('success', success);
    container.querySelector('.feedback-kicker').textContent = kicker;
    container.querySelector('p').textContent = copy;
  }
  function render(nextMode) {
    mode = nextMode;
    const state = scenarios[mode];
    $('#reach-to').textContent = state.to.size; $('#reach-from').textContent = state.from.size;
    $('#edit-label').textContent = edits[mode].length ? `WHAT IF / ${edits[mode].length} IMAGINED LINK${edits[mode].length === 1 ? '' : 'S'} ADDED` : 'REAL SNAPSHOT / NO EDITS';
    $('#baymax-scene-status').textContent = {snapshot: 'NO WAY IN. NO WAY OUT.', out: 'A WAY OUT. NOBODY CAN ENTER.', in: 'A WAY IN. NO WAY BACK.', both: 'CONNECTED IN BOTH DIRECTIONS.'}[mode];
    $('#signal-map-title').textContent = `${state.to.size} articles can reach Baymax; Baymax can reach ${state.from.size}.`;
    $('#signal-map-desc').textContent = `${edits[mode].length} hypothetical links added to the frozen graph. Yellow dots can reach Baymax; purple dots are reachable from Baymax; white dots have paths both ways; muted dots have neither. ${state.roundTrip} articles have paths both ways. Bright dashed arrows are hypothetical additions. Muted background connections omit arrowheads for readability.`;
    for (const node of nodes) {
      const to = state.to.has(node.id), from = state.from.has(node.id);
      mapDots.get(node.id).setAttribute('fill', node.id === 'Baymax' ? palette.both : to && from ? palette.both : to ? palette.to : from ? palette.from : palette.none);
    }
    addedLayer.replaceChildren();
    for (const [source, target] of edits[mode]) {
      const a = positions.get(source), b = positions.get(target);
      const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
      const startGap = source === 'Baymax' ? 44 : 20, endGap = target === 'Baymax' ? 45 : 21;
      const start = [a[0] + dx / length * startGap, a[1] + dy / length * startGap];
      const end = [b[0] - dx / length * endGap, b[1] - dy / length * endGap];
      const bend = mode === 'both' ? 50 : 0;
      const control = [(a[0] + b[0]) / 2 - dy / length * bend, (a[1] + b[1]) / 2 + dx / length * bend];
      const kind = source === 'Baymax' ? 'from' : 'to';
      addedLayer.append(svg('path', {d: `M${start} Q${control} ${end}`, class: 'added-link signal-pulse', stroke: palette[kind], 'marker-end': `url(#arrow-${kind})`}));
    }
    $$('[data-edit]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.edit === mode)));
    $$('[data-replay]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.replay === mode)));
  }
  function choose(nextMode) {
    if (phase !== 1) return;
    render(nextMode);
    const found = mode === 'in';
    $('#next-mission').hidden = !found;
    $('#progress-found').classList.toggle('complete', found);
    $('#progress-found span').textContent = found ? '✓' : '01';
    if (found) feedback('MISSION 01 COMPLETE', '274 articles can now reach Baymax. But he still cannot reach a single one of them. Getting found is only half a conversation.', true);
    else feedback('HE CAN LEAVE. NOBODY CAN FIND HIM.', 'Baymax can now reach 231 articles, but 0 can reach him. Your arrow points away from his page. Try writing the link on Spider-Man’s page.');
  }
  function restart() {
    phase = 1; render('snapshot');
    $('#mission-label').textContent = 'MISSION 01 / BE FOUND';
    $('#mission-title').textContent = 'PUT HIM ON THE MAP.';
    $('#mission-copy').textContent = 'Help a reader elsewhere in the network find Baymax. You have one imagined link. Which page should it go on?';
    $('#first-choices').hidden = false;
    ['next-mission', 'add-return', 'mission-finish', 'replay-controls', 'restart-mission'].forEach(id => $('#' + id).hidden = true);
    for (const [id, label] of [['progress-found', '01'], ['progress-reply', '02']]) { $('#' + id).classList.remove('complete'); $('#' + id + ' span').textContent = label; $('#' + id).removeAttribute('aria-current'); }
    $('#progress-found').setAttribute('aria-current', 'step');
    feedback('THE CATCH', 'A link is a one-way door. Writing about someone doesn’t make them link back.');
    $$('[data-edit]')[0].focus({preventScroll: true});
  }
  async function init() {
    try {
      const response = await fetch(document.body.dataset.signalSrc);
      if (!response.ok) throw new Error('Data unavailable');
      graph = await response.json(); nodes = graph.nodes;
      if (nodes.length !== 303 || graph.links.length !== 1784 || !nodes.some(n => n.id === 'Baymax' && n.kin === 0 && n.kout === 0)) throw new Error('Unexpected snapshot');
      scenarios = buildScenarios(); drawScene(); render('snapshot');
      $$('[data-edit]').forEach(button => { button.disabled = false; button.addEventListener('click', () => choose(button.dataset.edit)); });
      $('#next-mission').addEventListener('click', () => {
        phase = 2;
        $('#first-choices').hidden = true; $('#next-mission').hidden = true; $('#add-return').hidden = false; $('#restart-mission').hidden = false;
        $('#progress-found').removeAttribute('aria-current'); $('#progress-reply').setAttribute('aria-current', 'step');
        $('#mission-label').textContent = 'MISSION 02 / ANSWER BACK'; $('#mission-title').textContent = 'LET HIM ANSWER.';
        $('#mission-copy').textContent = 'Keep the link that lets others find him. Now give Baymax a link back to Spider-Man. What changes?';
        feedback('ONE MORE EDIT', 'A link from Spider-Man to Baymax cannot be followed backwards. Add the return direction and watch the two counts.');
        $('#add-return').focus({preventScroll: true});
      });
      $('#add-return').addEventListener('click', () => {
        phase = 3; render('both');
        $('#add-return').hidden = true; $('#mission-finish').hidden = false; $('#replay-controls').hidden = false;
        $('#progress-reply').classList.add('complete'); $('#progress-reply span').textContent = '✓'; $('#progress-reply').removeAttribute('aria-current');
        $('#mission-label').textContent = 'BOTH MISSIONS COMPLETE'; $('#mission-title').textContent = 'A WAY THERE. AND BACK.';
        $('#mission-copy').textContent = 'Two imagined links. Baymax now has a round trip to 229 other articles. Try removing a direction below to see what disappears.';
        feedback('229 ROUND-TRIP DESTINATIONS', '274 articles can reach him. He can reach 231. The 229 in both groups have a route there and back. Connections are not automatically mutual.', true);
        $('#mission-finish').focus({preventScroll: true});
      });
      $$('[data-replay]').forEach(button => button.addEventListener('click', () => {
        render(button.dataset.replay);
        const state = scenarios[mode];
        $('#mission-label').textContent = 'EXPERIMENT COMPLETE / REPLAY';
        $('#mission-title').textContent = 'FLIP THE ARROW.';
        $('#mission-copy').textContent = 'Compare the alternatives. The original graph stays the same; only your imagined link directions change.';
        feedback(mode === 'snapshot' ? 'BACK TO THE REAL SNAPSHOT' : 'REPLAYING AN IMAGINED EDIT', `${state.to.size} articles can reach Baymax. He can reach ${state.from.size}. ${state.roundTrip} have a route both ways.`, mode === 'both');
      }));
      $('#restart-mission').addEventListener('click', restart);
      $('#signal-load').textContent = '';
    } catch (error) {
      console.error('Baymax experiment:', error);
      $('#signal-load').textContent = 'The interactive network could not load. The verified findings below are still available.';
      $('#first-choices').hidden = true;
    }
  }
  init();
})();
