// ?variant=deck — the two geographic views in deck.gl.
//
// Swaps the hero globe (a GlobeView with an ArcLayer) and the twin map in
// section 6 (the same layers under a flat MapView). Charts stay on canvas:
// deck.gl is a geospatial renderer and a log-log scatter is not its job.
//
// The reason to want this one is that both views are GPU-drawn from the same
// layer definitions, so the flat map and the globe are genuinely the same
// picture in two projections rather than two pieces of drawing code.

export function install(api, deck) {
  const { state, node, metrics, topEdges, flightEdges, select, $, colours, rgb, arcSpec, textureURL } = api;
  const channels = (hex) => rgb(hex).split(",").map(Number);
  const GlobeView = deck._GlobeView ?? deck.GlobeView;
  if (!GlobeView) throw new Error("this deck.gl build has no GlobeView");

  const decks = new Map();

  function mount(canvasId, view, initialViewState) {
    const canvas = $(canvasId);
    if (!canvas) return null;
    if (decks.has(canvasId)) return decks.get(canvasId);
    let host = document.getElementById(`${canvasId}-deck`);
    if (!host) {
      host = document.createElement("div");
      host.id = `${canvasId}-deck`;
      host.style.position = "relative";
      host.style.width = "100%";
      host.style.height = `${Math.round((canvas.clientWidth || 600) * (canvas.height / canvas.width))}px`;
      canvas.after(host);
      canvas.style.display = "none";
    }
    const instance = new deck.Deck({
      parent: host,
      views: [view],
      initialViewState,
      controller: true,
      parameters: { clearColor: [0.031, 0.102, 0.192, 1] },
      getTooltip: ({ object }) =>
        object?.iso3 ? { text: `${node(object.iso3).name}` } : null,
      onClick: ({ object }) => {
        if (object?.iso3) select(object.iso3);
      },
    });
    decks.set(canvasId, instance);
    return instance;
  }

  function arcData(limit) {
    const edges = topEdges(limit);
    const heaviest = edges[0]?.weight ?? 1;
    const out = [];
    for (const edge of edges) {
      const from = node(state.edges.countries[edge.oi])?.coord;
      const to = node(state.edges.countries[edge.di])?.coord;
      if (!from || !to) continue;
      const share = Math.sqrt(edge.weight / heaviest);
      out.push({
        source: [from[1], from[0]],
        target: [to[1], to[0]],
        width: 0.4 + share * 4,
        alpha: 60 + share * 150,
      });
    }
    return out;
  }

  function flightArcData(limit) {
    const edges = flightEdges(limit);
    const heaviest = edges[0]?.routes ?? 1;
    const out = [];
    for (const edge of edges) {
      const from = node(state.edges.countries[edge.oi])?.coord;
      const to = node(state.edges.countries[edge.di])?.coord;
      if (!from || !to) continue;
      const share = Math.sqrt(edge.routes / heaviest);
      out.push({
        source: [from[1], from[0]],
        target: [to[1], to[0]],
        width: 0.3 + share * 3,
        alpha: 40 + share * 120,
      });
    }
    return out;
  }

  function countryData() {
    const out = [];
    for (const iso3 of state.data.countries) {
      const coord = node(iso3)?.coord;
      const m = metrics(iso3);
      if (!coord || !m) continue;
      out.push({
        iso3,
        position: [coord[1], coord[0]],
        radius: iso3 === state.selected ? 300000 : 30000 + Math.sqrt(m.in_degree) * 11000,
        colour: iso3 === state.selected ? [255, 255, 255, 255] : [214, 234, 252, 140],
      });
    }
    return out;
  }

  const arcLayer = (id, data, hex) => {
    const colour = channels(hex);
    const spec = arcSpec();
    return new deck.ArcLayer({
      id,
      data,
      greatCircle: spec.curvature > 0,
      getHeight: spec.altitude > 0 ? 1 : 0,
      getSourcePosition: (d) => d.source,
      getTargetPosition: (d) => d.target,
      getSourceColor: [...colour, spec.taper ? 220 : 40],
      getTargetColor: (d) => [...colour, spec.taper ? 40 : d.alpha],
      getWidth: (d) => d.width,
      widthUnits: "pixels",
      pickable: false,
    });
  };

  // On a GlobeView a polygon has to be tessellated across the curve, which is
  // what _full3d turns on. Without it the land is drawn flat and disappears
  // behind the sphere, which is why the deck globe came up empty at first.
  // The photograph is a BitmapLayer stretched over the whole world, which lands
  // correctly because the texture is equirectangular.
  const photoLayer = (id) =>
    state.basemap === "photo"
      ? [
          new deck.BitmapLayer({
            id,
            image: textureURL(),
            bounds: [-180, -90, 180, 90],
            opacity: 0.92,
            pickable: false,
          }),
        ]
      : [];

  const landLayer = (id, globeMode) =>
    state.basemap === "outline" && state.world
      ? [
          new deck.GeoJsonLayer({
            id,
            data: state.world,
            stroked: true,
            filled: true,
            getFillColor: [26, 74, 120, 245],
            getLineColor: [178, 215, 248, 160],
            lineWidthMinPixels: 0.6,
            pickable: false,
            ...(globeMode ? { _full3d: true, extruded: false } : {}),
          }),
        ]
      : [];

  const dotLayer = (id) =>
    new deck.ScatterplotLayer({
      id,
      data: countryData(),
      getPosition: (d) => d.position,
      getRadius: (d) => d.radius,
      getFillColor: (d) => d.colour,
      radiusMinPixels: 0.9,
      radiusMaxPixels: 4,
      pickable: true,
    });

  function globe() {
    // GlobeView zoom is logarithmic and framed for a full-screen map; the hero
    // panel is a third of that, so the whole sphere needs a negative zoom.
    const instance = mount("globe-canvas", new GlobeView({ id: "globe" }), {
      longitude: 12,
      latitude: 18,
      zoom: -1.15,
    });
    if (!instance) return;
    instance.setProps({
      layers: [
        new deck.SolidPolygonLayer({
          id: "sphere",
          data: [[[-180, 90], [-90, 90], [0, 90], [90, 90], [180, 90],
                  [180, 0], [180, -90], [90, -90], [0, -90], [-90, -90],
                  [-180, -90], [-180, 0]]],
          getPolygon: (d) => d,
          stroked: false,
          filled: true,
          getFillColor: [13, 43, 76],
          _full3d: true,
        }),
        ...photoLayer("globe-photo"),
        ...landLayer("globe-land", true),
        arcLayer("globe-arcs", arcData(320), colours.PEOPLE),
        dotLayer("globe-dots"),
      ],
    });
  }

  function map() {
    const instance = mount("map-canvas", new deck.MapView({ id: "map", repeat: true }), {
      longitude: 10,
      latitude: 24,
      zoom: -0.55,
    });
    if (!instance) return;
    const layers = [...photoLayer("map-photo"), ...landLayer("map-land", false)];
    if (state.layer !== "flights") layers.push(arcLayer("map-arcs", arcData(420), colours.PEOPLE));
    if (state.layer !== "migration")
      layers.push(arcLayer("map-flights", flightArcData(420), colours.ACCESS));
    layers.push(dotLayer("map-dots"));
    instance.setProps({ layers });
  }

  return {
    globe,
    map,
    setupGlobe() {
      const hint = document.querySelector(".stage-hint");
      if (hint) hint.textContent = "Drag to spin, scroll to zoom. Click a country. (WebGL)";
    },
    setupMap() {
      const toggle = $("map-toggle");
      if (!toggle) return;
      toggle.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-layer]");
        if (!button) return;
        state.layer = button.dataset.layer;
        for (const b of toggle.querySelectorAll("button")) {
          b.setAttribute("aria-pressed", String(b === button));
        }
        map();
      });
    },
  };
}
