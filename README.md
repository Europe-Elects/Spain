# Spain election maps

Embeddable maps in the style of the Bulgaria pages (same `assets/`, plus `assets/es-map.js` for the Spain tabs, shapes and Canaries inset). No build step; serve
locally with `python3 -m http.server 8000` (fetch() fails on file://).

Five embeds. Each has 2023 / 2026 buttons (`?year=` picks one), except the swing map,
which is 2026 against 2023 only. Before polls close on 29 November (20:00 Madrid) the pages
open on 2023, after that on 2026. 2026 reads only the live maps file and stays empty, with a
note, until it exists; 2023 reads the demo files.


- `seats-map.html` — seats by constituency, with tabs for the Deputies (Congress, 52
  constituencies, the default) and the Senate (59): one dot per seat, plus the national seat
  bar. `?house=senate` opens the Senate tab.
- `results-map.html` — Congress vote share, with tabs for region (19), province (52) and
  municipality (8,131); tap a party to shade by its share. `?level=` picks the opening tab.
- `turnout-map.html` — turnout at 14:00, 18:00 and the close of polls, with tabs for region
  and province, as a level or as the change against the previous election.
- `swing-map.html` — change in each party's Congress vote share against the previous
  election, by region. Default view: each region in the colour of its biggest gainer; tap a
  party for its own swing (grey = lost, colour = gained, full at 10 points).
- `hemicycle.html` — Congress seats (350) as a hemicycle, parties seated left to right, with
  the majority line and each party's seat change.

The seats map and the hemicycle read the client seats file (`DATA_URL` at the top of each script); now
the 2023 demo `spain_2023_seats_demo.json`, built by `demo_2023.py` in the private collector
repo.

The vote, swing and turnout pages read one maps file: the live one,
`https://data.europeelects.eu/maps/spain_2026_maps.json`, once it exists, else the demo
`spain_2023_results_demo.json` (built by `demo_2023_results.py` in the collector repo);
`?data=<file>.json` swaps in another file next to the pages. Once the live file has loaded,
a failed refresh keeps the map as it is instead of falling back to the demo. The live file
is the collector's reduced copy for these maps: Congress and turnout only, uploaded every
5 minutes to its own storage account (`eespainmaps`, container `maps`) behind Cloudflare,
and never the client's feed. Each area row: `name`, party shares by key (as in `parties`),
`turnout` (official, with the vote from abroad), `t14`, `t18`, `t20` (resident voters only,
as the ministry reports on the night), optionally `counted_pct`, and for swing `prev`
(previous shares by the same party keys, merged lists already added up) and `prev_t14`,
`prev_t18`, `prev_t20`. Top level: `election` (`DEMO: ...` marks the demo), `parties`,
`national` (same row shape), `regions`, `provinces`, `municipalities`, `prev_election`
(label, e.g. `2023`), `fetched_at`, `counted_pct`. A level that is missing shows an empty
state, and swing and turnout change stay empty without `prev` figures.
- Party names and colours follow Europe Elects: `assets/es-parties.js` maps the ministry's
  abbreviations to the Europe Elects name and EP group (from the party database via
  PartiesData) and colours parties by EP group as the poll charts do; two groups are
  shown striped.
- `geo/` — shapes from es-atlas (IGN): `congress.geojson` (provinces), `senate.geojson`,
  `regions.geojson` (merged from provinces, keyed by the ministry's region codes),
  `municipalities.geojson`; Canaries moved into an inset. Rebuild with `tools/build.js` (needs `npm i es-atlas
  topojson-client`); `tools/islands.json` maps each Senate island constituency to its
  municipalities, from the ministry's nomenclator; `tools/regions.json` maps provinces to regions.
