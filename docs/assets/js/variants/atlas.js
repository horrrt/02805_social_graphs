// ?variant=atlas — the design-mockup look: a photographic Earth.
//
// Swaps the hero globe and the twin map for a textured planet, which is what
// the original mockup for this post showed. The globe is globe.gl with a
// NASA Blue Marble colour map and a topography bump map; the flat map draws
// the same image as a basemap, which lines up exactly because an equirectangular
// texture and this page's lon/lat projection are the same mapping.
//
// Charts stay on canvas. The trade against ?variant=globe is 488 KB of imagery
// for a planet you recognise instead of a flat blue sphere, and arcs that have
// to be brighter to survive against a photograph.

const DAY = "earth-day-2048.jpg";
const BUMP = "earth-bump-1024.jpg";

function textureURL(file) {
  return new URL(`../../textures/${file}`, import.meta.url).href;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export function install(api, Globe) {
  const { state, node, metrics, topEdges, flightEdges, select, $, colours, rgb, arcSpec } = api;
  let world = null;
  let host = null;
  let basemap = null;
  let basemapPending = null;

  /* ------------------------------------------------------------- the globe */

  function mount() {
    const canvas = $("globe-canvas");
    if (!canvas) return null;
    if (!host) {
      host = document.createElement("div");
      host.id = "globe-atlas";
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
        .globeImageUrl(textureURL(DAY))
        .bumpImageUrl(textureURL(BUMP))
        .showAtmosphere(true)
        .atmosphereColor("#8fc4f0")
        .atmosphereAltitude(0.2)
        .arcStartLat((d) => d.startLat)
        .arcStartLng((d) => d.startLng)
        .arcEndLat((d) => d.endLat)
        .arcEndLng((d) => d.endLng)
        .arcColor((d) => d.colour)
        .arcAltitudeAutoScale(0.5)
        .arcStroke((d) => d.stroke)
        .arcDashLength(0.4)
        .arcDashGap(0.18)
        .arcDashAnimateTime((d) => d.speed)
        .pointLat((d) => d.lat)
        .pointLng((d) => d.lng)
        .pointColor((d) => d.colour)
        .pointAltitude(0.004)
        .pointRadius((d) => d.radius)
        .pointLabel((d) => d.label)
        .onPointClick((d) => select(d.iso3))
        .labelLat((d) => d.lat)
        .labelLng((d) => d.lng)
        .labelText((d) => d.text)
        .labelSize(1.9)
        .labelDotRadius(0.5)
        .labelColor(() => "#ffffff")
        .labelResolution(2)
        .labelAltitude(0.02);

      // globe.gl lights the sphere from one side, so the night half goes black
      // and half the corridors land on nothing. A little emissive lift keeps
      // the whole planet readable without flattening the terminator away.
      try {
        const material = world.globeMaterial();
        material.bumpScale = 7;
        material.shininess = 4;
        material.emissive.set("#16324f");
        material.emissiveIntensity = 0.42;
      } catch {
        // An older build without a material accessor still renders.
      }

      const controls = world.controls();
      controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      controls.autoRotateSpeed = 0.22;
      controls.enableZoom = true;
      world.pointOfView({ lat: 20, lng: 10, altitude: 1.85 }, 0);
    }
    return world;
  }

  function globe() {
    const instance = mount();
    if (!instance) return;

    const people = rgb(colours.PEOPLE);
    const spec = arcSpec();
    const edges = topEdges(300);
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
        stroke: 0.22 + share * 1.1,
        speed: 5000 - share * 2500,
        colour: [
          `rgba(${people},${0.16 + share * 0.34})`,
          `rgba(${people},${0.66 + share * 0.34})`,
        ],
      });
    }

    const points = [];
    for (const iso3 of state.data.countries) {
      const coord = node(iso3)?.coord;
      const m = metrics(iso3);
      if (!coord || !m || iso3 === state.selected) continue;
      points.push({
        iso3,
        lat: coord[0],
        lng: coord[1],
        radius: 0.16 + Math.sqrt(m.in_degree) * 0.05,
        colour: "rgba(255,255,255,0.72)",
        label: `${node(iso3).name} · in-degree ${m.in_degree}`,
      });
    }

    // Atlas defaults to the photograph; the basemap dropdown can still strip it
    // back to outlines or to nothing.
    instance.globeImageUrl(state.basemap === "none" ? null : textureURL(DAY));
    if (state.basemap === "outline" && state.world) {
      instance
        .polygonsData(state.world.features)
        .polygonCapColor(() => "rgba(36,95,146,0.98)")
        .polygonStrokeColor(() => "rgba(178,215,248,0.6)")
        .polygonAltitude(0.006);
    } else if (instance.polygonsData().length) {
      instance.polygonsData([]);
    }
    instance
      .arcAltitudeAutoScale(spec.altitude)
      .arcDashLength(spec.dashed ? 0.4 : 1)
      .arcDashGap(spec.dashed ? 0.18 : 0)
      .arcDashAnimateTime((d) => (spec.dashed ? d.speed : 0));
    instance.arcsData(arcs).pointsData(points);

    // The selected country gets the mockup's floating pin rather than a dot.
    const chosen = state.selected ? node(state.selected) : null;
    instance.labelsData(
      chosen?.coord
        ? [{ lat: chosen.coord[0], lng: chosen.coord[1], text: chosen.name }]
        : [],
    );
    if (chosen?.coord) {
      instance.pointOfView({ lat: chosen.coord[0], lng: chosen.coord[1], altitude: 1.85 }, 800);
    }
  }

  /* ---------------------------------------------------------- the flat map */

  // An equirectangular texture and this page's lon/lat projection are the same
  // mapping, so the basemap needs no reprojection: it is drawn to fill.
  function mapPoint(coord, width, height) {
    return { x: ((coord[1] + 180) / 360) * width, y: ((90 - coord[0]) / 180) * height };
  }

  function curve(ctx, a, b, lift) {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(mx - (dy / len) * len * lift, my + (dx / len) * len * lift, b.x, b.y);
    ctx.stroke();
  }

  function map() {
    const canvas = $("map-canvas");
    if (!canvas) return;
    if (!basemap && !basemapPending) {
      basemapPending = loadImage(textureURL(DAY)).then((image) => {
        basemap = image;
        basemapPending = null;
        map();
      });
    }

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || canvas.width;
    const height = Math.round(width * (canvas.height / canvas.width));
    canvas.style.height = `${height}px`;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#07172b";
    ctx.fillRect(0, 0, width, height);
    if (basemap && state.basemap !== "none") {
      ctx.globalAlpha = 0.85;
      ctx.drawImage(basemap, 0, 0, width, height);
      ctx.globalAlpha = 1;
      // A dark wash keeps the corridors legible over the photograph.
      ctx.fillStyle = "rgba(6,20,38,0.42)";
      ctx.fillRect(0, 0, width, height);
    }

    const points = new Map();
    state.edges.countries.forEach((iso3, i) => {
      const coord = node(iso3)?.coord;
      if (coord) points.set(i, mapPoint(coord, width, height));
    });

    ctx.lineCap = "round";
    if (state.layer !== "flights") {
      const edges = topEdges(420);
      const heaviest = edges[0]?.weight ?? 1;
      for (const edge of edges) {
        const a = points.get(edge.oi);
        const b = points.get(edge.di);
        if (!a || !b || Math.abs(a.x - b.x) > width * 0.6) continue;
        const share = Math.sqrt(edge.weight / heaviest);
        ctx.strokeStyle = `rgba(${rgb(colours.PEOPLE)},${0.16 + share * 0.62})`;
        ctx.lineWidth = 0.4 + share * 2.8;
        curve(ctx, a, b, 0.13);
      }
    }
    if (state.layer !== "migration") {
      const edges = flightEdges(420);
      const heaviest = edges[0]?.routes ?? 1;
      for (const edge of edges) {
        const a = points.get(edge.oi);
        const b = points.get(edge.di);
        if (!a || !b || Math.abs(a.x - b.x) > width * 0.6) continue;
        const share = Math.sqrt(edge.routes / heaviest);
        ctx.strokeStyle = `rgba(${rgb(colours.ACCESS)},${0.12 + share * 0.5})`;
        ctx.lineWidth = 0.3 + share * 2.2;
        curve(ctx, a, b, -0.13);
      }
    }

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (const [i, p] of points) {
      if (!metrics(state.edges.countries[i])) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (state.selected) {
      const coord = node(state.selected)?.coord;
      if (coord) {
        const p = mapPoint(coord, width, height);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  return {
    globe,
    map,
    setupGlobe() {
      const hint = document.querySelector(".stage-hint");
      if (hint) hint.textContent = "Drag to spin, scroll to zoom. Click a country.";
      window.addEventListener("resize", () => {
        if (!world || !host) return;
        const width = host.clientWidth || 520;
        world.width(width).height(Math.round(width * 0.86));
      });
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
      $("map-canvas").addEventListener("click", (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        let best = null;
        for (const iso3 of state.data.countries) {
          const coord = node(iso3)?.coord;
          if (!coord || !metrics(iso3)) continue;
          const p = mapPoint(coord, rect.width, rect.height);
          const d = Math.hypot(p.x - x, p.y - y);
          if (d < 14 && (!best || d < best.d)) best = { iso3, d };
        }
        if (best) select(best.iso3);
      });
    },
  };
}
