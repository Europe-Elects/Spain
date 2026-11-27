/* Spain: the ministry's party abbreviations -> Europe Elects names, affiliations and colours.
 *
 * Labels follow the Europe Elects standard used on the country pages: ABBR (EUROPARTY–EP GROUP),
 * e.g. "PSOE (PES–S&D)". The EP-group part is only shown for a party that actually sits in a group
 * ("CC (EDP)"); with neither, no tag. Europarty and EP group come from the Europe Elects party
 * database, as published by the country pages (country-pages/sheets/parties.csv and alliances.csv),
 * looked up by Europe Elects Entity ID. If those files can't be loaded, or a party has no ID here,
 * the EP group typed below is shown instead.
 *
 * Colours are the EP-group colours of the Europe Elects poll charts (EE-Frontend post_poll.html).
 * A party in two groups gets both colours (striped).
 *
 * Attaches window.ES_PARTIES: { info(abbr) -> {label, tag, groupLabel, groups, color, color2}, ready }.
 * `ready` resolves once the party database has been read (or failed); pages await it before drawing.
 */
(function () {
  'use strict';

  const GROUP_COLORS = {
    'EPP': '#3399FF', 'S&D': '#FF0000', 'PfE': '#000000', 'ECR': '#0000FF', 'ESN': '#70463A',
    'RE': '#FFD700', 'Greens/EFA': '#009900', 'LEFT': '#990000', 'NI': '#777777', '*': '#999999',
  };

  // Keyed by the ministry's abbreviation of the national list (the seats file's
  // `national_party`, the results file's party keys). id = Europe Elects Entity ID.
  const PARTIES = {
    'PP':            { label: 'PP',       id: 'ES570927', groups: ['EPP'] },
    'PSOE':          { label: 'PSOE',     id: 'ES477727', groups: ['S&D'] },
    'VOX':           { label: 'Vox',      id: 'ES867108', groups: ['PfE'] },
    'SUMAR':         { label: 'Sumar',    id: 'ALA110',   groups: ['Greens/EFA', 'LEFT'] },
    'ERC':           { label: 'ERC',      id: 'ES678120', groups: ['Greens/EFA'] },
    'JxCAT - JUNTS': { label: 'Junts',    id: 'ES731801', groups: ['NI'] },
    'EH Bildu':      { label: 'EH Bildu', id: 'ES120670', groups: ['LEFT'] },
    'EAJ-PNV':       { label: 'EAJ PNV',  id: 'ES103956', groups: ['RE'] },
    'B.N.G.':        { label: 'BNG',      id: 'ES014003', groups: ['Greens/EFA'] },
    'CCa':           { label: 'CC',       id: 'ES319562', groups: ['*'] },
    'U.P.N.':        { label: 'UPN',      id: 'ES096274', groups: ['*'] },
    // Senate-only lists.
    'IZQUIERDAS POR LA INDEPENDENCIA': { label: 'ERC–EH Bildu', groups: ['Greens/EFA', 'LEFT'] },
    'PSOE-SUMAR-EUIB-ARA EIVISSA':     { label: 'PSOE–Sumar (Eivissa)', groups: ['S&D'] },
    'ASG':           { label: 'ASG',      groups: ['*'] },
    'A.H.I.':        { label: 'AHI',      groups: ['*'] },
    'OTHERS':        { label: 'Others',   groups: [], color: '#CBD5E1' },
    // 2026 lists: Europe Elects IDs are ready; add the ministry's abbreviation as the key once it is
    // known (from the results feed), e.g.  'FRENTE AMPLIO': { label: 'FA', id: 'ALA277', groups: [...] }.
    //   FA ALA277 · Comp.–FV ALA278 · UPC ALA279 · Existe ALA280 · D21+ ALA281 · CC-1ºCAN ALA118 ·
    //   Senate: SdP ALA282 · ERC/EHB ALA283 · Comuns ALA284 · Ara Més ALA285 · FaS ALA286 · Sa Unió ALA287
  };

  // ---- Europe Elects party database (as published by the country pages) ----
  const DB_BASE = 'https://europe-elects.github.io/country-pages/sheets/';
  const AFF = {};  // Entity ID -> { europarty, epGroup }

  const isNone = (v) => !v || /^(unaffiliated|\*|none|-|–|n\/a|no)$/i.test(String(v).trim());
  const epName = (x) => String(x || '').replace(/Patriots\.eu/g, 'PfE');
  const groupName = (g) => String(g || '').split('|').map((x) => ({ 'Greens/EFA': 'G/EFA', 'Renew': 'RE' }[x.trim()] || x.trim())).join('|');

  // Same rule as the country pages (partyTag): "EUROPARTY–GROUP", or whichever of the two exists.
  function tagOf(europarty, epGroup) {
    const ep = isNone(europarty) ? '' : epName(europarty);
    const grp = isNone(epGroup) ? '' : groupName(epGroup);
    return ep && grp ? `${ep}–${grp}` : (ep || grp);
  }

  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    const head = (rows.shift() || []).map((h) => h.trim());
    return rows.filter((r) => r.some((x) => x !== '')).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
  }

  // One row per Entity ID: the active, latest, highest version wins.
  function indexRows(rows) {
    const score = (o) => [!/inactive/i.test(o['Status'] || ''), !/^no$/i.test(o['Latest'] || ''), +o['Europe Elects Entity Version'] || 1];
    const better = (a, b) => { const x = score(a), y = score(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] > y[i]; return false; };
    const best = {};
    rows.forEach((o) => { const id = o['Europe Elects Entity ID']; if (id && (!best[id] || better(o, best[id]))) best[id] = o; });
    Object.entries(best).forEach(([id, o]) => {
      AFF[id] = { europarty: o['Europarty Affiliation'] || '', epGroup: o['European Parliament Group'] || '' };
    });
  }

  const load = (name) => fetch(DB_BASE + name, { cache: 'no-cache' }).then((r) => (r.ok ? r.text() : Promise.reject(r.status)));
  const ready = Promise.all(['parties.csv', 'alliances.csv'].map((n) => load(n).then((t) => indexRows(parseCSV(t))).catch(() => {})))
    .then(() => undefined);
  // Don't hold the maps back for long if the party database is slow: draw with the fallback after 4 s.
  const readyOrTimeout = Promise.race([ready, new Promise((res) => setTimeout(res, 4000))]);

  function info(abbr) {
    const p = PARTIES[abbr] || { label: abbr, groups: ['*'] };
    const groups = p.groups;
    const db = p.id && AFF[p.id];
    const tag = db ? tagOf(db.europarty, db.epGroup)
      : groupName(groups.filter((g) => g !== '*').join('|'));  // fallback: the EP group typed above
    return {
      label: p.label,
      tag,
      groupLabel: tag ? `(${tag})` : '',
      groups,
      color: p.color || GROUP_COLORS[groups[0]] || GROUP_COLORS['*'],
      color2: groups.length > 1 ? GROUP_COLORS[groups[1]] : null,
    };
  }

  window.ES_PARTIES = { info, GROUP_COLORS, ready: readyOrTimeout };
})();
