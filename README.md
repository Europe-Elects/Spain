# Spain election maps

Embeddable maps in the style of the Bulgaria pages (same `assets/`). No build step; serve
locally with `python3 -m http.server 8000` (fetch() fails on file://).

- `seats-map.html` — seats by constituency, Congress (52) and Senate (59), one dot per
  seat, plus the national seat bar. `?house=senate` opens the Senate. Reads the client
  seats file (`DATA_URL` at the top of the script); now the 2023 demo
  `spain_2023_seats_demo.json`, built by `demo_2023.py` in the private collector repo.
- `results-map.html` — Congress vote share by region (19), province (52) or municipality
  (8,131), `?level=regions|provinces|municipalities`. Reads `spain_2023_results_demo.json`
  (built by `demo_2023_results.py` in the collector repo).
- Party names and colours follow Europe Elects: `assets/es-parties.js` maps the ministry's
  abbreviations to the Europe Elects name and EP group (from the party database via
  PartiesData) and colours parties by EP group as the poll charts do; two groups are
  shown striped.
- `geo/` — shapes from es-atlas (IGN): `congress.geojson` (provinces), `senate.geojson`,
  `regions.geojson` (merged from provinces, keyed by the ministry's region codes),
  `municipalities.geojson`; Canaries moved into an inset. Rebuild with `tools/build.js` (needs `npm i es-atlas
  topojson-client`); `tools/islands.json` maps each Senate island constituency to its
  municipalities, from the ministry's nomenclator; `tools/regions.json` maps provinces to regions.
