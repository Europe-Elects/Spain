// Map shapes for the Spain maps, from es-atlas (IGN data):
// congress.geojson: the 52 provinces; senate.geojson: 49 provinces + 10 island constituencies
// (merged from their municipalities); regions.geojson: the 19 regions, merged from their
// provinces and keyed by the ministry's region codes (tools/regions.json); municipalities.geojson. The Canaries are moved into an inset south-west of
// the peninsula (dx/dy below), as Spanish maps usually show them.
const fs = require('fs'), topo = require('topojson-client');
const prov = require('./node_modules/es-atlas/es/provinces.json');
const muni = require('./node_modules/es-atlas/es/municipalities.json');
const islands = require('./islands.json');
const regions = require('./regions.json');
const OUT = process.argv[2];
const CANARY = new Set(['35', '38']), DX = 6.5, DY = 6.6;

const round = n => Math.round(n * 1e4) / 1e4;
function mapCoords(g, f) {
  const ring = r => r.map(([x, y]) => f(x, y));
  if (g.type === 'Polygon') g.coordinates = g.coordinates.map(ring);
  else g.coordinates = g.coordinates.map(p => p.map(ring));
  return g;
}
function feature(id, name, type, geometry, canary) {
  mapCoords(geometry, (x, y) => canary ? [round(x + DX), round(y + DY)] : [round(x), round(y)]);
  return { type: 'Feature', properties: { id, name, type, canary }, geometry };
}

const provinces = topo.feature(prov, prov.objects.provinces).features
  .filter(f => f.id !== '54')
  .map(f => feature(f.id, f.properties.name, 'province', f.geometry, CANARY.has(f.id)));
const congress = { type: 'FeatureCollection', features: provinces };

const byMuni = new Map(muni.objects.municipalities.geometries.map(g => [g.id, g]));
const islandFeatures = Object.entries(islands).map(([code, isl]) => {
  const geoms = isl.munis.map(m => byMuni.get(m)).filter(Boolean);
  if (geoms.length !== isl.munis.length) console.error('missing municipalities for', isl.name);
  return feature(code, isl.name, 'island', topo.merge(muni, geoms), CANARY.has(isl.munis[0].slice(0, 2)));
});
const split = new Set(['07', '35', '38']);
const senate = { type: 'FeatureCollection',
  features: JSON.parse(JSON.stringify(provinces)).filter(f => !split.has(f.properties.id)).concat(islandFeatures) };

const byProv = new Map(prov.objects.provinces.geometries.map(g => [g.id, g]));
const regionGroups = {};
for (const [p, r] of Object.entries(regions.region_of_province)) (regionGroups[r] = regionGroups[r] || []).push(p);
const regionFeatures = { type: 'FeatureCollection', features: Object.entries(regionGroups).map(([r, ps]) =>
  feature(r, regions.names[r], 'region', topo.merge(prov, ps.map(p => byProv.get(p))), ps.some(p => CANARY.has(p)))) };

// Municipalities: 3 decimals (~100 m) is plenty at this scale and keeps the file small.
const round3 = n => Math.round(n * 1e3) / 1e3;
const munis = { type: 'FeatureCollection', features: topo.feature(muni, muni.objects.municipalities).features
  .filter(f => f.geometry && f.id.slice(0, 2) !== '54')
  .map(f => {
    const canary = CANARY.has(f.id.slice(0, 2));
    mapCoords(f.geometry, (x, y) => canary ? [round3(x + DX), round3(y + DY)] : [round3(x), round3(y)]);
    return { type: 'Feature', properties: { id: f.id, name: f.properties.name, canary }, geometry: f.geometry };
  }) };

fs.writeFileSync(OUT + '/congress.geojson', JSON.stringify(congress));
fs.writeFileSync(OUT + '/regions.geojson', JSON.stringify(regionFeatures));
fs.writeFileSync(OUT + '/municipalities.geojson', JSON.stringify(munis));
fs.writeFileSync(OUT + '/senate.geojson', JSON.stringify(senate));
console.log('congress', congress.features.length, 'senate', senate.features.length,
  'regions', regionFeatures.features.length, 'municipalities', munis.features.length);
