# Spain election maps

Embeddable maps in the style of the Bulgaria pages (same `assets/`). No build step; serve
locally with `python3 -m http.server 8000` (fetch() fails on file://).

- `seats-map.html` — seats by constituency, Congress (52) and Senate (59), one dot per
  seat, plus the national seat bar. `?house=senate` opens the Senate. Reads the client
  seats file (`DATA_URL` at the top of the script); now the 2023 demo
  `spain_2023_seats_demo.json`, built by `demo_2023.py` in the private collector repo.
- `geo/congress.geojson`, `geo/senate.geojson` — constituency shapes from es-atlas (IGN),
  Canaries moved into an inset. Rebuild with `tools/build.js` (needs `npm i es-atlas
  topojson-client`); `tools/islands.json` maps each Senate island constituency to its
  municipalities, from the ministry's nomenclator.
