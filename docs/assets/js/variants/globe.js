// ?variant=globe — the hero globe in WebGL, via globe.gl (which bundles three.js).
//
// Swaps one visual: the spinning globe in the hero. The twin map in section 6
// and every chart stay on the canvas renderer, because globe.gl only draws
// globes. Arcs rise off the sphere and animate along their length, which the
// 2D version cannot do; the trade is a megabyte of library and no crisp
// country labels.

const NO_TEXTURE = null;

export function install(api, Globe) {
  const { state, node, metrics, topEdges, select, $, colours, rgb, arcSpec, textureURL } = api;
  let world = null;
  let host = null;

  function mount() {
    const canvas = $("globe-canvas");
    if (!canvas) return null;
    if (!host) {
      host = document.createElement("div");
      host.id = "globe-gl";
      host.style.width = "100%";
      host.style.aspectRatio = "1 / 0.86";
      canvas.after(host);
      canvas.style.display = "none";
    }
    if (!world) {
      const width = host.clientWidth || 520;
      world = Globe()(host)
        .width(width)
        .height(Math.round(width * 0.86))
        .backgroundColor("rgba(0,0,0,0)")
        .globeImageUrl(NO_TEXTURE)
        .showAtmosphere(true)
        .atmosphereColor("#7fb2e5")
        .atmosphereAltitude(0.16)
        .showGraticules(true)
        .polygonCapColor(() => "rgba(36,95,146,0.98)")
        .polygonSideColor(() => "rgba(45,116,173,0.4)")
        .polygonStrokeColor(() => "rgba(178,215,248,0.65)")
        .polygonAltitude(0.006)
        .polygonLabel((d) => d.properties.name)
        .arcStartLat((d) => d.startLat)
        .arcStartLng((d) => d.startLng)
        .arcEndLat((d) => d.endLat)
        .arcEndLng((d) => d.endLng)
        .arcColor((d) => d.colour)
        .arcAltitudeAutoScale(0.42)
        .arcStroke((d) => d.stroke)
        .arcDashLength(0.55)
        .arcDashGap(0.25)
        .arcDashAnimateTime((d) => d.speed)
        .pointLat((d) => d.lat)
        .pointLng((d) => d.lng)
        .pointColor((d) => d.colour)
        .pointAltitude(0.005)
        .pointRadius((d) => d.radius)
        .pointLabel((d) => d.label)
        .onPointClick((d) => select(d.iso3));

      try {
        world.globeMaterial().color.set("#0d2b4c");
      } catch {
        // An older build without a material accessor still renders; the sphere
        // is just the library default colour.
      }
      const controls = world.controls();
      controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches;
      controls.autoRotateSpeed = 0.28;
      controls.enableZoom = true;
      world.pointOfView({ lat: 22, lng: 12, altitude: 2.3 }, 0);
    }
    return world;
  }

  function draw() {
    const globe = mount();
    if (!globe) return;

    const tint = rgb(colours.PEOPLE);
    const spec = arcSpec();
    const edges = topEdges(320);
    const heaviest = edges[0]?.weight ?? 1;
    const arcs = [];
    for (const edge of edges) {
      const from = node(state.edges.countries[edge.oi])?.coord;
      const to = node(state.edges.countries[edge.di])?.coord;
      if (!from || !to) continue;
      const share = Math.sqrt(edge.weight / heaviest);
      arcs.push({
        startLat: from[0],
        startLng: from[1],
        endLat: to[0],
        endLng: to[1],
        stroke: 0.18 + share * 0.9,
        speed: 5200 - share * 2600,
        colour: [`rgba(${tint},${0.12 + share * 0.3})`, `rgba(${tint},${0.5 + share * 0.5})`],
      });
    }

    const points = [];
    for (const iso3 of state.data.countries) {
      const coord = node(iso3)?.coord;
      const m = metrics(iso3);
      if (!coord || !m) continue;
      const chosen = iso3 === state.selected;
      points.push({
        iso3,
        lat: coord[0],
        lng: coord[1],
        radius: chosen ? 0.75 : 0.2 + Math.sqrt(m.in_degree) * 0.055,
        colour: chosen ? "#ffffff" : "rgba(200,226,250,0.72)",
        label: `${node(iso3).name} · in-degree ${m.in_degree}`,
      });
    }

    // The basemap dropdown reaches WebGL: a photograph as the globe texture,
    // outlines as polygons, or neither.
    const photo = state.basemap === "photo";
    globe.globeImageUrl(photo ? textureURL() : null);
    const wanted = state.basemap === "outline" && state.world ? state.world.features : [];
    if (globe.polygonsData().length !== wanted.length) globe.polygonsData(wanted);
    // The corridor-line dropdown reaches WebGL too: flat arcs for straight,
    // dashes only for flowing, and a thinner tail for tapered.
    globe
      .arcAltitudeAutoScale(spec.altitude)
      .arcDashLength(spec.dashed ? 0.4 : 1)
      .arcDashGap(spec.dashed ? 0.2 : 0)
      .arcDashAnimateTime((d) => (spec.dashed ? d.speed : 0))
      .arcStroke((d) => (spec.taper ? d.stroke * 0.7 : d.stroke));
    globe.arcsData(arcs).pointsData(points);
    if (state.selected) {
      const coord = node(state.selected)?.coord;
      if (coord) globe.pointOfView({ lat: coord[0], lng: coord[1], altitude: 2.3 }, 700);
    }
  }

  // globe.gl owns its own pointer handling, so the canvas drag and hit-test are
  // replaced with nothing rather than left to fight it.
  function setupGlobe() {
    const hint = document.querySelector(".stage-hint");
    if (hint) hint.textContent = "Drag to spin, scroll to zoom. Click a country.";
    window.addEventListener("resize", () => {
      if (!world || !host) return;
      const width = host.clientWidth || 520;
      world.width(width).height(Math.round(width * 0.86));
    });
  }

  return { globe: draw, setupGlobe };
}
