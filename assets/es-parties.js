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

  // Fill colour = Europarty (the Europe Elects palette of the country pages); ring = EP group.
  const EUROPARTY_COLORS = { 'PES': '#FF0000', 'EPP': '#3399FF', 'EDP': '#fa8c00', 'ECPP': '#a16585', 'ELA': '#fb1d79',
    'Volt': '#502379', 'ECL': '#7c0000', 'ESN': '#70463A', 'EGP': '#009900', 'PEL': '#990000', 'ALDE': '#FFD700',
    'ECR': '#0000FF', 'PPEU': '#9c36b8', 'EFA': '#008080', 'Patriots.eu': '#000000', 'Animal Politics EU': '#009076' };
  const NONE = '#8A9099';   // no Europarty (as on the country pages)
  // Without a party-database entry: the Europarty of the EP group typed below.
  const GROUP_TO_EUROPARTY = { 'S&D': 'PES', 'EPP': 'EPP', 'ECR': 'ECR', 'RE': 'ALDE', 'Greens/EFA': 'EGP', 'PfE': 'Patriots.eu', 'LEFT': 'PEL', 'ESN': 'ESN' };
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
    'IZQUIERDAS POR LA INDEPENDENCIA': { label: 'ERC–EH Bildu', id: 'ALA457', groups: ['Greens/EFA', 'LEFT'] },
    'PSOE-SUMAR-EUIB-ARA EIVISSA':     { label: 'PSOE–Sumar (Eivissa)', id: 'ALA460', groups: ['S&D'] },
    'ASG':           { label: 'ASG',      id: 'ES661305', groups: ['*'] },
    'A.H.I.':        { label: 'AHI',      id: 'ES040051', groups: ['*'] },
    'OTHERS':        { label: 'Others',   groups: [], color: '#D5D3CC' },
    // 2026: the ministry's abbreviations of the national groupings (getCandidaturas, media
    // API). Groups set the colours; the label tag comes from the party database by id.
    'FA':            { label: 'FA',        id: 'ALA277', groups: ['Greens/EFA', 'LEFT'] },
    'PODEMOS':       { label: 'Podemos',   id: 'ES976941', groups: ['LEFT'] },
    'JxCat':         { label: 'Junts',     id: 'ES731801', groups: ['NI'] },
    'EH BILDU':      { label: 'EH Bildu',  id: 'ES120670', groups: ['LEFT'] },
    'BNG':           { label: 'BNG',       id: 'ES014003', groups: ['Greens/EFA'] },
    'CCa-1ºCAN':     { label: 'CC',        id: 'ALA118', groups: ['*'] },
    'UPN-PP':        { label: 'UPN–PP',    id: 'ALA291', groups: ['*'] },
    'NC-BC, PODEMOS, IU, SUMAR': { label: 'UPC', id: 'ALA279', groups: ['LEFT'] },
    'COMPROMIS-EUPV-PODEM-ERPV': { label: 'Compromís', id: 'ALA278', groups: ['Greens/EFA'] },
    'TERUEL EXISTE': { label: 'Teruel Existe', id: 'ALA280', groups: ['*'] },
    'D21':           { label: 'D21+',      id: 'ALA281', groups: ['*'] },
    'SALF':          { label: 'SALF',      id: 'ES899539', groups: ['NI'] },
    'ADELANTE ANDALUCÍA': { label: 'Adelante Andalucía', id: 'ES474545', groups: ['*'] },
    'PACMA':         { label: 'PACMA',     id: 'ES999981', groups: ['*'] },
    'GBAI':          { label: 'Geroa Bai', id: 'ALA468', groups: ['RE'] },
    // 2026 Senate-only groupings.
    'SDP (PSOE, IU, MS, MM, COMPROMIS, CHA, BATZARRE)': { label: 'Senado de Progreso', id: 'ALA282', groups: ['S&D'] },
    'ERC-EH BILDU':  { label: 'ERC–EH Bildu', id: 'ALA283', groups: ['Greens/EFA', 'LEFT'] },
    'C-DEM':         { label: 'Comuns',    id: 'ALA284', groups: ['Greens/EFA', 'LEFT'] },
    'PSIB-PSOE-MÉS PER MALLORCA-SUMAR-EUIB': { label: 'Acord de Progrés (Mallorca)', groups: ['S&D'] },
    'PSOE-MÉS PER MENORCA-EM-EU-PODEMOS':    { label: 'Menorca al Senat', groups: ['S&D'] },
    'PSOE-SUMAR-EUIB-ARA EIVISSA-PODEM':     { label: 'Eivissa al Senat', groups: ['S&D'] },
    'PSOE-GxF-M.SUMAR': { label: 'Formentera al Senat', id: 'ALA286', groups: ['S&D'] },
    'SA UNIÓ':       { label: 'Sa Unió',   id: 'ALA287', groups: ['*'] },
    'FV':            { label: 'Formentera Viva', groups: ['*'] },
  };

  // ---- Europe Elects party database (as published by the country pages) ----
  const DB_BASE = 'https://europe-elects.github.io/country-pages/sheets/';
  const AFF = {};  // Entity ID -> { europarty, epGroup, abbr, name, native, members: [{abbr, id}] }

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
      // Lists and alliances name their member parties in "Party N" / "Party ID N" (ID with a version: ES269206.v1).
      const members = [];
      for (let n = 1; n <= 40; n++) {
        const pid = (o['Party ID ' + n] || '').trim(), ab = (o['Party ' + n] || '').trim();
        if (pid || ab) members.push({ abbr: ab, id: pid.replace(/\.v\d+$/i, '') });
      }
      AFF[id] = { europarty: o['Europarty Affiliation'] || '', epGroup: o['European Parliament Group'] || '',
        abbr: o['Abbreviation'] || '', name: o['Name (English)'] || '', native: o['Name (Native)'] || '', members,
        orientation: o['Ideological Orientation'] || '', since: o['Political Activity Started'] || '' };
    });
  }

  const load = (name) => fetch(DB_BASE + name, { cache: 'no-cache' }).then((r) => (r.ok ? r.text() : Promise.reject(r.status)));
  const ready = Promise.all(['parties.csv', 'alliances.csv'].map((n) => load(n).then((t) => indexRows(parseCSV(t))).catch(() => {})))
    .then(() => undefined);
  // Don't hold the maps back for long if the party database is slow: draw with the fallback after 4 s.
  const readyOrTimeout = Promise.race([ready, new Promise((res) => setTimeout(res, 4000))]);

  // Member parties of a multi-party list (Europe Elects ID of the list) → [{abbr, name, native, tag, color}].
  const GROUP_KEY = { 'GREENS/EFA': 'Greens/EFA', 'G/EFA': 'Greens/EFA', 'LEFT': 'LEFT', 'S&D': 'S&D', 'EPP': 'EPP', 'RE': 'RE',
    'RENEW': 'RE', 'PFE': 'PfE', 'PATRIOTS': 'PfE', 'ECR': 'ECR', 'ESN': 'ESN', 'NI': 'NI' };
  function members(id) {
    const db = id && AFF[id];
    if (!db || db.members.length < 2) return [];
    return db.members.map((m) => {
      const d = AFF[m.id] || {};
      const eps = parts(d.europarty), grps = parts(d.epGroup).map(groupKey).filter(Boolean);
      return { abbr: m.abbr || d.abbr || m.id, name: d.name || '', native: d.native || '', id: m.id,
        tag: tagOf(d.europarty, d.epGroup), color: EUROPARTY_COLORS[eps[0]] || NONE, ring: grps.length ? GROUP_COLORS[grps[0]] : null };
    });
  }

  // Europarty / EP group of a database entry, split into parts ("EGP|PEL" → ['EGP', 'PEL']).
  const parts = (v) => (isNone(v) ? [] : String(v).split('|').map((x) => x.trim()).filter((x) => x && !isNone(x)));
  const groupKey = (g) => GROUP_KEY[String(g).toUpperCase()] || null;

  function describe(p) {
    // Europarty, EP group and labels come from the party database only. A party without a database
    // entry has none (grey, no tag). The EP groups typed in PARTIES are used only if the database
    // itself could not be loaded, so the maps aren't all grey on election night.
    const db = p.id && AFF[p.id];
    const dbDown = Object.keys(AFF).length === 0;
    const eps = db ? parts(db.europarty) : dbDown ? (p.groups || []).map((g) => GROUP_TO_EUROPARTY[g]).filter(Boolean) : [];
    const grps = db ? parts(db.epGroup).map(groupKey).filter(Boolean) : dbDown ? (p.groups || []).filter((g) => g !== '*') : [];
    const tag = db ? tagOf(db.europarty, db.epGroup) : groupName(grps.join('|'));
    const mem = members(p.id);
    const short = mem.slice(0, 4).map((m) => m.abbr);
    return {
      label: p.label,
      // ideological label, from the party database only ("Ideological Orientation"); '' without an entry
      ideology: db ? db.orientation || '' : '',
      id: p.id || null,
      tag,
      groupLabel: tag ? `(${tag})` : '',
      // a list of several parties: its members in brackets, e.g. "[IU · SMR · MM · CatComú …]"
      bracket: mem.length > 1 ? `[${short.join(' · ')}${mem.length > short.length ? ' …' : ''}]` : '',
      groups: grps.length ? grps : ['*'],
      europarties: eps,
      color: p.color || EUROPARTY_COLORS[eps[0]] || NONE,
      color2: !p.color && eps.length > 1 ? (EUROPARTY_COLORS[eps[1]] || null) : null,
      ring: grps.length ? GROUP_COLORS[grps[0]] : null,
    };
  }
  function info(abbr) {
    return describe(PARTIES[abbr] || { label: abbr, groups: ['*'] });
  }
  // A party or list by Europe Elects ID alone (history tables, alliance members).
  function byId(id, label, groups) {
    return describe({ id, label: label || (AFF[id] && AFF[id].abbr) || id, groups: groups || ['*'] });
  }

  // Everything the party database says about a party or list, for the hover profile (party-card.js).
  function profile(id) {
    const d = id && AFF[id];
    if (!d) return null;
    return { abbr: d.abbr, name: d.name, native: d.native, orientation: d.orientation, since: d.since,
      europarties: parts(d.europarty), groups: parts(d.epGroup).map(groupKey).filter(Boolean), members: members(id) };
  }

  // Government status in the outgoing lower house (by the ministry's key): G = in government,
  // S = supports the government in parliament (confidence and supply). Edit as it changes;
  // after the election, set it for the new government.
  const GOV = {
    'PSOE': 'G', 'SUMAR': 'G',
    'ERC': 'S', 'EH Bildu': 'S', 'EAJ-PNV': 'S', 'B.N.G.': 'S', 'CCa': 'S',
    // Junts withdrew its support in October 2025.
  };
  const gov = (k) => GOV[k] || '';

  // "Centre-right PP": the ideological label in front of a party name, as HTML (styled by .ideo in map.css).
  const escH = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ideo = (i) => (i && i.ideology ? `<span class="ideo">${escH(i.ideology)}</span> ` : '');

  window.ES_PARTIES = { info, byId, ideo, members, profile, gov, GROUP_COLORS, EUROPARTY_COLORS, ready: readyOrTimeout };
})();
