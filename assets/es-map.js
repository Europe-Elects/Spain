/* Spain maps: what the vote, swing and turnout pages share. Attaches window.ES_MAP.
 *   loadShapes(level)        -> { list: [{id, name, d, cx, cy}], inset }  (cached, same frame
 *                               for every level, so switching tabs doesn't move the map)
 *   drawInset(svg, shapes)   -> the dashed frame and label round the Canary Islands
 *   levelTabs(el, levels, onChange) -> the Regions / Provinces / Municipalities tabs, kept
 *                               in ?level= so an embed can open on a given level
 *   moveTooltip(e, width)    -> keeps #tooltip inside #map-container
 *   shortName(name)          -> region names without "Comunidad de", "Principado de"...
 *   dataUrl(fallback)        -> ?data=<file>.json if given (a plain file name next to the
 *                               page, for rehearsals and tests), else the page's default
 *   loadData(demo)           -> ?data= if given, else the live maps file, else the demo
 */
(function () {
  'use strict';
  const { bbox, makeProjection, featurePath, featureCentroid } = window.EE;
  const NS = 'http://www.w3.org/2000/svg';

  const GEO = { regions: 'geo/regions.geojson', provinces: 'geo/congress.geojson',
                municipalities: 'geo/municipalities.geojson' };
  const LEVELS = {
    regions:        { tab: 'Regions',        one: 'region',       count: '19 regions' },
    provinces:      { tab: 'Provinces',      one: 'province',     count: '52 provinces' },
    municipalities: { tab: 'Municipalities', one: 'municipality', count: '8,131 municipalities' },
  };
  const SVG_W = 1000, SVG_H = 640;
  const shapes = {};
  let frame = null;

  async function loadShapes(level) {
    if (shapes[level]) return shapes[level];
    if (!frame) frame = fetch(GEO.provinces).then(r => r.json());
    const [geo, fr] = await Promise.all([fetch(GEO[level]).then(r => r.json()), frame]);
    const proj = makeProjection(bbox(fr.features), SVG_W, SVG_H);
    const muni = level === 'municipalities';
    const list = geo.features.map(f => ({
      id: f.properties.id, name: f.properties.name, d: featurePath(f, proj),
      ...(muni ? {} : featureCentroid(f, proj)),
    }));
    const canary = fr.features.filter(f => f.properties.canary);
    const [x0, y1] = proj(...bbox(canary).slice(0, 2)), [x1, y0] = proj(...bbox(canary).slice(2));
    shapes[level] = { list, inset: { x: x0 - 12, y: y0 - 12, w: x1 - x0 + 24, h: y1 - y0 + 24 } };
    return shapes[level];
  }

  function drawInset(svg, sh) {
    const f = sh.inset;
    const rect = document.createElementNS(NS, 'rect');
    Object.entries({ x: f.x, y: f.y, width: f.w, height: f.h, rx: 6, class: 'inset-frame' })
      .forEach(([k, v]) => rect.setAttribute(k, v));
    svg.appendChild(rect);
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', f.x + 6); t.setAttribute('y', f.y + 13); t.setAttribute('class', 'inset-label');
    t.textContent = 'Canary Islands';
    svg.appendChild(t);
  }

  // Builds the tabs into `el` and returns the level to start on (?level=, else the first).
  function levelTabs(el, levels, onChange) {
    const asked = new URLSearchParams(location.search).get('level');
    let current = levels.includes(asked) ? asked : levels[0];
    el.innerHTML = '';
    levels.forEach(lv => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'level-tab'; b.setAttribute('role', 'tab');
      b.dataset.level = lv; b.textContent = LEVELS[lv].tab;
      b.onclick = () => {
        if (lv === current) return;
        current = lv; mark();
        const u = new URL(location.href); u.searchParams.set('level', lv); history.replaceState(null, '', u);
        onChange(lv);
      };
      el.appendChild(b);
    });
    function mark() {
      el.querySelectorAll('.level-tab').forEach(b => {
        const a = b.dataset.level === current;
        b.classList.toggle('active', a); b.setAttribute('aria-selected', a);
      });
    }
    mark();
    return current;
  }

  function moveTooltip(e, width = 300) {
    const tt = document.getElementById('tooltip');
    const rect = document.getElementById('map-container').getBoundingClientRect();
    let left = e.clientX - rect.left + 15;
    if (left + width > rect.width) left = e.clientX - rect.left - width - 15;
    tt.style.left = Math.max(4, left) + 'px';
    tt.style.top = (e.clientY - rect.top - 10) + 'px';
  }

  const shortName = n => n.replace(/^(Ciudad Autónoma de|Comunidad Foral de|Comunidad de|Principado de|Región de) /, '');

  function svgText(svg, x, y, cls, text) {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('class', cls);
    t.textContent = text;
    svg.appendChild(t);
    return t;
  }

  function dataUrl(fallback) {
    const asked = new URLSearchParams(location.search).get('data');
    return asked && /^[\w.-]+\.json$/.test(asked) ? asked : fallback;
  }

  // The live maps file: the collector's reduced copy for the public maps, in its own
  // storage account behind Cloudflare (never the client's feed), refreshed every 5 minutes.
  const LIVE_URL = 'https://data.europeelects.eu/maps/spain_2026_maps.json';
  let liveSeen = false;

  // The live file once it exists, the demo until then. After the live file has loaded
  // once, a failed refresh throws (autoRefresh keeps the map as it is) rather than
  // falling back to the 2023 demo in the middle of the night.
  async function loadData(demo) {
    const asked = dataUrl(null);
    if (asked) return window.EE.loadResults(asked);
    try {
      const d = await window.EE.loadResults(LIVE_URL);
      liveSeen = true;
      return d;
    } catch (err) {
      if (liveSeen) throw err;
      return window.EE.loadResults(demo);
    }
  }

  // The data file's election label marks the 2023 demo ("DEMO: ...") and rehearsals.
  const isDemo = d => /^DEMO/.test(d.election || '');

  window.ES_MAP = { NS, LEVELS, SVG_W, SVG_H, loadShapes, drawInset, levelTabs, moveTooltip,
                    shortName, svgText, isDemo, dataUrl, loadData };
})();
