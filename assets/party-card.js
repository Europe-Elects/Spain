/* Party profile on hover: a small card with the party's names, Europarty, EP group, orientation,
 * the year it became active, its member parties (joint lists) and the figures the page passes in.
 * Data from es-parties.js (the Europe Elects party database).
 *
 *   ES_CARD.attach(element, () => ({ info, stats: [['Seats', '133'], …] }))   // hover + tap
 *   ES_CARD.show(event, info, stats) / ES_CARD.hide()
 */
(function () {
  'use strict';
  const EUROPARTIES = { 'EPP': "European People's Party", 'PES': 'Party of European Socialists', 'ALDE': 'ALDE Party',
    'EDP': 'European Democratic Party', 'EGP': 'European Green Party', 'EFA': 'European Free Alliance', 'PEL': 'Party of the European Left',
    'ELA': 'European Left Alliance', 'ECR': 'ECR Party', 'Patriots.eu': 'Patriots.eu', 'ESN': 'Europe of Sovereign Nations',
    'Volt': 'Volt Europa', 'ECPP': 'European Christian Political Party', 'PPEU': 'European Pirate Party', 'ECL': 'European Communist Left',
    'Animal Politics EU': 'Animal Politics EU' };
  const GROUPS = { 'EPP': 'EPP Group', 'S&D': 'Socialists & Democrats', 'RE': 'Renew Europe', 'Greens/EFA': 'Greens/EFA',
    'LEFT': 'The Left', 'ECR': 'European Conservatives and Reformists', 'PfE': 'Patriots for Europe', 'ESN': 'Europe of Sovereign Nations', 'NI': 'Non-attached' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const css = document.createElement('style');
  css.textContent = `
  .ee-card { position: fixed; z-index: 1000; display: none; width: 290px; max-width: calc(100vw - 16px); pointer-events: none;
    background: #fff; border: 1px solid #E4E2DB; border-radius: 6px; box-shadow: 0 8px 24px rgba(27,42,74,.18);
    font-family: 'Advent Pro', system-ui, sans-serif; color: #1A1D23; overflow: hidden; }
  .ee-card .hd { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px 8px; border-bottom: 1px solid #ECEAE4; border-left: 5px solid var(--c); }
  .ee-card .dot { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
  .ee-card .ab { font-size: 18px; font-weight: 700; line-height: 1.1; }
  .ee-card .nm { font-size: 14px; color: #3A3F4A; line-height: 1.2; margin-top: 2px; }
  .ee-card .nv { font-size: 13px; color: #8B8F98; font-style: italic; line-height: 1.2; }
  .ee-card dl { display: grid; grid-template-columns: auto 1fr; gap: 3px 10px; padding: 8px 12px; margin: 0; font-size: 14px; }
  .ee-card dt { color: #565B66; } .ee-card dd { margin: 0; font-weight: 600; }
  .ee-card .st { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px 10px; }
  .ee-card .st span { background: #F7F6F2; border-radius: 4px; padding: 3px 8px; font-size: 14px; }
  .ee-card .st b { font-size: 16px; margin-left: 4px; }
  .ee-card .mb { padding: 8px 12px 10px; border-top: 1px solid #ECEAE4; font-size: 13px; color: #3A3F4A; }
  .ee-card .mb h5 { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #2A5DB0; margin: 0 0 4px; }
  .ee-card .mb i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin: 0 3px 0 0; }
  .ee-card .mb span { display: inline-block; margin: 0 8px 2px 0; white-space: nowrap; }`;
  document.head.appendChild(css);
  const el = document.createElement('div');
  el.className = 'ee-card'; el.setAttribute('role', 'tooltip');
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(el));
  if (document.body) document.body.appendChild(el);

  function html(info, stats) {
    const P = window.ES_PARTIES;
    const pr = (P && P.profile && P.profile(info.id)) || {};
    const fill = info.color2 ? `linear-gradient(90deg, ${info.color} 50%, ${info.color2} 50%)` : info.color;
    const eps = (pr.europarties || info.europarties || []).map((e) => EUROPARTIES[e] || e);
    const grs = (pr.groups || (info.groups || []).filter((g) => g !== '*')).map((g) => GROUPS[g] || g);
    let h = `<div class="hd" style="--c:${info.color}"><span class="dot" style="background:${fill};${info.ring ? `box-shadow:0 0 0 2px #fff,0 0 0 3.5px ${info.ring}` : ''}"></span><div>`
      + `<div class="ab">${esc(info.label)}</div>`
      + (pr.name && pr.name !== info.label ? `<div class="nm">${esc(pr.name)}</div>` : '')
      + (pr.native && pr.native !== pr.name && pr.native !== info.label ? `<div class="nv">${esc(pr.native)}</div>` : '')
      + '</div></div><dl>'
      + `<dt>Europarty</dt><dd>${eps.length ? esc(eps.join(' · ')) : 'None'}</dd>`
      + `<dt>EP group</dt><dd>${grs.length ? esc(grs.join(' · ')) : 'None'}</dd>`
      + (pr.orientation ? `<dt>Orientation</dt><dd>${esc(pr.orientation)}</dd>` : '')
      + (pr.since ? `<dt>Active since</dt><dd>${esc(pr.since)}</dd>` : '')
      + '</dl>';
    if (stats && stats.length) h += '<div class="st">' + stats.map(([k, v]) => `<span>${esc(k)}<b>${esc(v)}</b></span>`).join('') + '</div>';
    const mem = (pr.members && pr.members.length > 1) ? pr.members : [];
    if (mem.length) h += `<div class="mb"><h5>Joint list · ${mem.length} parties</h5>` + mem.map((m) => `<span><i style="background:${m.color}"></i>${esc(m.abbr)}</span>`).join('') + '</div>';
    return h;
  }
  function place(ev) {
    const w = el.offsetWidth, h = el.offsetHeight, x = ev.clientX, y = ev.clientY;
    el.style.left = Math.max(8, Math.min(x + 16, innerWidth - w - 8)) + 'px';
    el.style.top = (y + 16 + h > innerHeight - 8 ? Math.max(8, y - h - 12) : y + 16) + 'px';
  }
  function show(ev, info, stats) {
    if (!info) return;
    el.innerHTML = html(info, stats); el.style.display = 'block'; place(ev);
  }
  function hide() { el.style.display = 'none'; }
  function attach(node, get) {
    node.addEventListener('mousemove', (ev) => { const d = get(ev); if (d) show(ev, d.info, d.stats); else hide(); });
    node.addEventListener('mouseleave', hide);
    node.addEventListener('touchstart', (ev) => { const d = get(ev); if (d) { const t = ev.touches[0]; show({ clientX: t.clientX, clientY: t.clientY }, d.info, d.stats); } }, { passive: true });
  }
  document.addEventListener('scroll', hide, { passive: true });
  window.ES_CARD = { show, hide, attach };
})();
