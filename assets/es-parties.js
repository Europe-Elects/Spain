/* Spain: the ministry's party abbreviations -> Europe Elects names, EP groups and colours.
 * Groups are the ones in the Europe Elects party database (via PartiesData) for the
 * national parliament; colours are the EP-group colours of the Europe Elects poll charts
 * (EE-Frontend post_poll.html). A party in two groups gets both colours (striped).
 * Attaches window.ES_PARTIES: { info(abbr) -> {label, groups, color, color2} }.
 */
(function () {
  'use strict';

  const GROUP_COLORS = {
    'EPP': '#3399FF', 'S&D': '#FF0000', 'PfE': '#000000', 'ECR': '#0000FF', 'ESN': '#70463A',
    'RE': '#FFD700', 'Greens/EFA': '#009900', 'LEFT': '#990000', 'NI': '#777777', '*': '#999999',
  };

  // Keyed by the ministry's abbreviation of the national list (the seats file's
  // `national_party`, the results file's party keys).
  const PARTIES = {
    'PP':            { label: 'PP',       groups: ['EPP'] },
    'PSOE':          { label: 'PSOE',     groups: ['S&D'] },
    'VOX':           { label: 'Vox',      groups: ['PfE'] },
    'SUMAR':         { label: 'Sumar',    groups: ['Greens/EFA', 'LEFT'] },
    'ERC':           { label: 'ERC',      groups: ['Greens/EFA'] },
    'JxCAT - JUNTS': { label: 'Junts',    groups: ['NI'] },
    'EH Bildu':      { label: 'EH Bildu', groups: ['LEFT'] },
    'EAJ-PNV':       { label: 'EAJ PNV',  groups: ['RE'] },
    'B.N.G.':        { label: 'BNG',      groups: ['Greens/EFA'] },
    'CCa':           { label: 'CC',       groups: ['*'] },
    'U.P.N.':        { label: 'UPN',      groups: ['*'] },
    // Senate-only lists.
    'IZQUIERDAS POR LA INDEPENDENCIA': { label: 'ERC–EH Bildu', groups: ['Greens/EFA', 'LEFT'] },
    'PSOE-SUMAR-EUIB-ARA EIVISSA':     { label: 'PSOE–Sumar (Eivissa)', groups: ['S&D'] },
    'ASG':           { label: 'ASG',      groups: ['*'] },
    'A.H.I.':        { label: 'AHI',      groups: ['*'] },
    'OTHERS':        { label: 'Others',   groups: [], color: '#CBD5E1' },
  };

  function info(abbr) {
    const p = PARTIES[abbr] || { label: abbr, groups: ['*'] };
    const groups = p.groups;
    return {
      label: p.label,
      groups,
      groupLabel: groups.filter(g => g !== '*').join(' | '),
      color: p.color || GROUP_COLORS[groups[0]] || GROUP_COLORS['*'],
      color2: groups.length > 1 ? GROUP_COLORS[groups[1]] : null,
    };
  }

  window.ES_PARTIES = { info, GROUP_COLORS };
})();
