# Earth textures

Used only by `?variant=atlas`, the render variant that reproduces the original
design mockup's photographic globe. Vendored here for the same reason as the
libraries in `../vendor/`: nothing on this site is fetched from a third-party
domain at runtime.

| File | Source | Licence |
| --- | --- | --- |
| `earth-day-2048.jpg` | NASA Blue Marble, via the three-globe examples | Public domain |
| `earth-bump-1024.jpg` | Earth topography height map, via the three-globe examples | Public domain |

Both were downscaled and re-encoded from the originals (4096×2048 and a 2048×1024
PNG, 1.8 MB together) down to 488 KB, which is more resolution than a 500-pixel
globe can show. To redo that:

    sips -Z 2048 --setProperty formatOptions 72 earth-blue-marble.jpg --out earth-day-2048.jpg
    sips -Z 1024 --setProperty format jpeg --setProperty formatOptions 65 earth-topology.png --out earth-bump-1024.jpg
