"""Slim the Natural Earth 110m country outlines down to what the page needs.

The week 3 maps had no land on them: a sphere, a graticule and a scatter of
dots, which makes a corridor impossible to place. This writes the one geometry
file every render variant draws, keeping only the ISO code and the name and
rounding coordinates to two decimals, which is about a kilometre and far finer
than a 500-pixel globe can show.

    python scripts/migration/build_world_outline.py

Input:  build/raw/ne_110m_admin_0_countries.geojson (Natural Earth, public domain)
Output: docs/assets/data/world_outline.geo.json
"""

from __future__ import annotations

import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent.parent
SOURCE = ROOT / "build" / "raw" / "ne_110m_countries.geojson"
TARGET = ROOT / "docs" / "assets" / "data" / "world_outline.geo.json"
PRECISION = 2


def round_ring(ring):
    out = []
    last = None
    for lon, lat, *_ in ring:
        point = [round(lon, PRECISION), round(lat, PRECISION)]
        # Rounding collapses neighbouring vertices; dropping the duplicates is
        # most of the saving.
        if point != last:
            out.append(point)
            last = point
    if len(out) < 4:
        return None
    if out[0] != out[-1]:
        out.append(out[0])
    return out


def round_geometry(geometry):
    kind = geometry["type"]
    if kind == "Polygon":
        rings = [r for r in (round_ring(ring) for ring in geometry["coordinates"]) if r]
        return {"type": "Polygon", "coordinates": rings} if rings else None
    if kind == "MultiPolygon":
        polygons = []
        for polygon in geometry["coordinates"]:
            rings = [r for r in (round_ring(ring) for ring in polygon) if r]
            if rings:
                polygons.append(rings)
        return {"type": "MultiPolygon", "coordinates": polygons} if polygons else None
    return None


def main():
    source = json.loads(SOURCE.read_text())
    features = []
    for feature in source["features"]:
        geometry = round_geometry(feature["geometry"])
        if not geometry:
            continue
        properties = feature["properties"]
        iso3 = properties.get("ISO_A3_EH") or properties.get("ISO_A3") or ""
        features.append({
            "type": "Feature",
            "properties": {
                "iso3": iso3 if iso3 not in ("-99", "") else "",
                "name": properties.get("NAME", ""),
            },
            "geometry": geometry,
        })

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(json.dumps(
        {"type": "FeatureCollection",
         "note": "Natural Earth 1:110m admin 0 countries, public domain, "
                 "slimmed by scripts/migration/build_world_outline.py",
         "features": features},
        separators=(",", ":"),
    ))
    points = sum(
        len(ring)
        for f in features
        for polygon in ([f["geometry"]["coordinates"]]
                        if f["geometry"]["type"] == "Polygon"
                        else f["geometry"]["coordinates"])
        for ring in polygon
    )
    with_iso = sum(1 for f in features if f["properties"]["iso3"])
    print(f"wrote {TARGET.relative_to(ROOT)}")
    print(f"  {len(features)} countries, {with_iso} with an ISO code, {points} points")
    print(f"  {TARGET.stat().st_size / 1024:.0f} KB (source {SOURCE.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
