/* Spain: the election-night Google Sheet (projection, results, history) for sheet-charts.html.
 *
 * Where the data comes from: one Google Sheet, one tab per chart (`TABS`, by gid).
 *   Best: File → Share → Publish to web → Entire document → CSV → Publish, then paste the link it
 *   gives (https://docs.google.com/spreadsheets/d/e/2PACX-…/pub?output=csv) into PUB_URL. Published
 *   CSV keeps every cell as typed and refreshes within about five minutes of an edit.
 *   Fallback (PUB_URL empty): the sheet's own CSV export (gviz), which needs "Anyone with the link:
 *   Viewer" and can drop text in mostly-numeric columns (e.g. the "2019 (I)" years).
 * `?pub=<published link>` or `?sheet=<sheet id>` on the page URL overrides these for a test.
 *
 * Attaches window.ES_SHEET: { load(tab) -> grid (array of rows of strings), num(cell), party(name) }.
 */
(function () {
  'use strict';

  const SHEET_ID = '1w4ZMe8IdrMmAxn1CTwgnHKu-Z2H8B6f2qMNQp33x5f8';
  const PUB_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSrDsU4OLbbT8stoMNzZViQyL4qClMJURIDqLY3O3QNfBALuVnAxQksQ_-sDqFTraF5-9PBhDS-kkF-/pub?output=csv';   // the "Publish to web" CSV link, see above

  const TABS = {
    projection:    0,
    projection2:   164377327,
    results:       43673423,
    provinces:     203592599,
    turnout:       365693514,
    historyVotes:  1556908398,
    historySeats:  1291887253,
  };

  const q = new URLSearchParams(location.search);
  let pub = q.get('pub') || PUB_URL;
  let sheetId = q.get('sheet') || SHEET_ID;
  // An ordinary sheet link (…/spreadsheets/d/<id>/edit…) pasted into PUB_URL: use it as the sheet id.
  const plain = /\/spreadsheets\/d\/([\w-]{20,})/.exec(pub || '');
  if (plain && !/\/d\/e\//.test(pub)) { sheetId = plain[1]; pub = ''; }
  const local = q.get('csv');   // tests: ?csv=folder → folder/<tab>.csv next to the page

  function url(tab) {
    const gid = TABS[tab];
    if (local) return `${local}/${tab}.csv`;
    if (pub) return `${pub.replace(/[?#].*$/, '')}?gid=${gid}&single=true&output=csv&t=${Date.now()}`;
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}&t=${Date.now()}`;
  }

  function parseCSV(text) {
    const rows = []; let row = [], cell = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') inQ = false; else cell += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.map((r) => r.map((x) => x.trim()));
  }

  async function load(tab) {
    const r = await fetch(url(tab), { cache: 'no-store' });
    if (!r.ok) throw new Error(`sheet tab ${tab}: HTTP ${r.status}`);
    const text = await r.text();
    if (/^\s*</.test(text)) throw new Error(`sheet tab ${tab}: not shared (got a web page, not CSV)`);
    return parseCSV(text);
  }

  // "33.06%", "33,06 %", "0.3306", "137", "+2.1", "−3" → number (percent cells as written); '' → null.
  function num(cell) {
    if (cell == null) return null;
    const s = String(cell).replace(/−/g, '-').replace(/\s/g, '').replace(/%$/, '');
    if (!s || /^\(.*\)$/.test(s)) return null;           // "(In Podemos)"
    const t = /^-?\+?\d{1,3}(\.\d{3})+,\d+$/.test(s) ? s.replace(/\./g, '').replace(',', '.') : s.replace(',', '.');
    const v = Number(t.replace(/^\+/, ''));
    return Number.isFinite(v) ? v : null;
  }
  const isPct = (cell) => /%\s*$/.test(String(cell || ''));

  // ---- the sheet's party names → Europe Elects names and colours (es-parties.js keys) ----
  const SHEET_KEYS = {
    'PP': 'PP', 'PSOE': 'PSOE', 'VOX': 'VOX', 'FA': 'FA', 'Podemos': 'PODEMOS', 'SALF': 'SALF',
    'ERC': 'ERC', 'Junts': 'JxCat', 'Bildu': 'EH BILDU', 'PNV': 'EAJ-PNV', 'BNG': 'BNG',
    'CC': 'CCa-1ºCAN', 'UPN-PP': 'UPN-PP', 'AA': 'ADELANTE ANDALUCÍA', 'UPC': 'NC-BC, PODEMOS, IU, SUMAR',
    'Compromís-FV': 'COMPROMIS-EUPV-PODEM-ERPV', 'D21+': 'D21', 'EXISTE': 'TERUEL EXISTE',
  };
  // Names es-parties.js has no entry for: label and EP groups here.
  const EXTRA = {
    'Ara Més-FA': { label: 'Ara Més', groups: ['Greens/EFA', 'LEFT'] },
    'Others':     { label: 'Others', groups: [], color: '#CBD5E1' },
  };
  // History columns ("PSOE/PSOE-NCa", "Podemos/UP", …): EP group of the party's current form.
  const HISTORY_GROUPS = [
    [/^PSOE/, 'S&D'], [/^PP$/, 'EPP'], [/^IU|^Podemos|^EH Bildu|^HB|^ECP|^En Marea/, 'LEFT'],
    [/^Sumar|^ERC|^BNG|^CHA|^EA$|^I-CV|^Compromís|^MP|^Más País/, 'Greens/EFA'],
    [/^CDS|^Cs$|^UPyD|^EAJ-PNV|^PNV/, 'RE'], [/^VOX/, 'PfE'], [/^JxCat|^CiU|^Junts/, 'NI'],
  ];

  function party(name) {
    const ES = window.ES_PARTIES;
    const key = SHEET_KEYS[name];
    if (key && ES) return ES.info(key);
    const e = EXTRA[name];
    const C = (ES && ES.GROUP_COLORS) || {};
    if (e) {
      return { label: e.label, tag: e.groups.join('|').replace('Greens/EFA', 'G/EFA'),
        groupLabel: e.groups.length ? `(${e.groups.join('|').replace('Greens/EFA', 'G/EFA')})` : '',
        groups: e.groups, color: e.color || C[e.groups[0]] || '#999999', color2: e.groups[1] ? C[e.groups[1]] : null };
    }
    const hit = HISTORY_GROUPS.find(([re]) => re.test(name));
    const g = hit ? hit[1] : '*';
    const short = name.split('/')[0];
    return { label: short, tag: '', groupLabel: '', groups: [g], color: C[g] || '#999999', color2: null };
  }

  window.ES_SHEET = { load, num, isPct, party, TABS };
})();
