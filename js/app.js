// Screens and navigation. Each screen has an address:
//   #/            Home
//   #/ch/4        Chapter list
//   #/q/4.12      Log a solve (a sheet; the back gesture closes it)
//   #/map         All 70 at a glance
//   #/settings    Backup and restore

const $ = (sel, root) => (root || document).querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const byId = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
const chapterOf = (ch) => CHAPTERS.find((c) => c.ch === ch);

const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  map: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'
};
const icon = (name, size) => `<svg width="${size || 22}" height="${size || 22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// ---------- Router ----------

const app = $('#app');
let skip = 0; // how many "Up next" picks were skipped on Home

// Draw the current screen again in place (same scroll position), e.g. after the type menu changes.
function rerender() {
  const y = window.scrollY;
  route(true);
  window.scrollTo(0, y);
}

function route(keepScroll) {
  if (!keepScroll) typeMenuOpen = false;
  const h = location.hash.replace(/^#\/?/, '');
  const [page, arg] = h.split('/');
  if (page === 'q' && byId[arg]) return renderSheet(byId[arg]);
  closeSheet();
  if (page === 'ch') renderChapter(+arg || DB.data.prefs.lastCh);
  else if (page === 'map') renderMap();
  else if (page === 'settings') renderSettings();
  else renderHome();
  if (!keepScroll) window.scrollTo(0, 0);
}

function go(hash) { location.hash = hash; }

function nav(active) {
  const tab = (id, label, href) => `<a href="${href}" class="tab${active === id ? ' on' : ''}"${active === id ? ' aria-current="page"' : ''}>${icon(id)}${label}</a>`;
  return `<nav class="tabs">${tab('home', 'Home', '#/')}${tab('list', 'Questions', '#/ch/' + DB.data.prefs.lastCh)}${tab('map', 'Map', '#/map')}</nav>`;
}

// ---------- Home ----------

// The type menu: tick Examples, Homework and/or Recitation. One choice for every screen.
// The button turns the theme colour while not all types are shown, so a filtered screen
// is never mistaken for all 70.
let typeMenuOpen = false;

function typeLabel() {
  const t = typeFilter();
  if (!t.length) return 'All types';
  if (t.length === 1) return TYPES.find((x) => x.id === t[0]).name;
  return TYPES.filter((x) => t.includes(x.id)).map((x) => x.short).join(' + ');
}

function typePick(side) {
  const t = typeFilter();
  const rows = TYPES.map((x) => {
    const n = QUESTIONS.filter((q) => q.type === x.id).length;
    const on = t.includes(x.id);
    return `<label class="typeopt"><input type="checkbox" data-type="${x.id}"${on ? ' checked' : ''}><span class="box" aria-hidden="true">${on ? icon('check', 14) : ''}</span><span class="grow">${x.name}</span><span class="muted num">${n}</span></label>`;
  }).join('');
  const menu = typeMenuOpen ? `<div class="typemenu ${side || 'right'}" id="typemenu" role="group" aria-label="Question types">
      ${rows}<button class="linkbtn typeall" data-type-all${t.length ? '' : ' disabled'}>Show all types</button></div>` : '';
  return `<span class="typewrap"><button class="typepick${t.length ? ' on' : ''}" aria-expanded="${typeMenuOpen}" aria-controls="typemenu" data-type-btn>${typeLabel()}${icon('down', 16)}</button>${menu}</span>`;
}

function setTypes(list) {
  // All three ticked is the same as all types.
  DB.setPref('types', list.length === TYPES.length ? [] : list);
  skip = 0;
  rerender();
}

app.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-type-btn]');
  if (btn) { typeMenuOpen = !typeMenuOpen; rerender(); return; }
  if (e.target.closest('[data-type-all]')) { setTypes([]); return; }
});
app.addEventListener('change', (e) => {
  const id = e.target.dataset && e.target.dataset.type;
  if (!id) return;
  const t = typeFilter().length ? typeFilter().slice() : [];
  const next = e.target.checked ? [...t, id] : t.filter((x) => x !== id);
  setTypes(TYPES.map((x) => x.id).filter((x) => next.includes(x)));
});
// Tap anywhere else, or press Escape, to close the menu.
document.addEventListener('click', (e) => {
  if (typeMenuOpen && !e.target.closest('.typewrap')) { typeMenuOpen = false; rerender(); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && typeMenuOpen) { typeMenuOpen = false; rerender(); const b = $('[data-type-btn]'); if (b) b.focus(); }
});

// Small text bits shared by the screens.
const examPill = (e, short) => e === null || e === undefined ? '' :
  `<span class="pill x${e + 1}">${LABELS.exam[e]}</span>`;
const qualityText = (q) => !q || q === 'ok' ? '' :
  `<span class="${isLoved(q) ? 'accent' : 'warm'}">${LABELS.quality[q]}</span>`;

function renderHome() {
  const all = scoped().map((q) => stateOf(q));
  const N = all.length;
  const solved = all.filter((s) => s.solved).length;
  const twice = all.filter((s) => s.attempts.filter((a) => a.result <= 1).length >= 2).length;
  const queue = rankedQueue();
  const next = queue[skip % queue.length];
  const dueCount = all.filter((s) => s.due).length;
  const tries = all.reduce((n, s) => n + s.tries, 0);

  const facts = [
    next.diff ? LABELS.diff[next.diff] : 'Not rated yet',
    next.tries ? 'Tried ' + next.tries + '×' : 'Never tried',
    next.last ? agoText(next.daysSince) : '',
    next.q.ch + ' · ' + chapterOf(next.q.ch).name
  ].filter(Boolean).map((t) => `<span>${t}</span>`).join('');

  const chapters = CHAPTERS.map((c) => {
    const ss = all.filter((s) => s.q.ch === c.ch);
    const done = ss.filter((s) => s.solved).length;
    if (!ss.length) return '';
    const examTodo = ss.filter((s) => !s.solved && (s.tags.exam === 0 || s.tags.exam === 1)).length;
    const due = ss.filter((s) => s.due).length;
    const sub = examTodo ? `<span class="warm">${examTodo} on the exam, not solved</span> · ${due} due` : `${due} due`;
    return `<a class="card chapter" href="#/ch/${c.ch}">
      <span class="badge" aria-hidden="true">${c.ch}</span>
      <span class="body">
        <span class="row"><span class="h3">${c.name}</span><span class="muted num">${done} / ${ss.length}</span></span>
        <span class="bar"><span style="display:block;width:${Math.round(done / ss.length * 100)}%;background:var(--accent);border-radius:3px"></span></span>
        <span class="small muted">${sub}</span>
      </span></a>`;
  }).join('');

  app.innerHTML = `<main class="screen">
    <header class="top">
      <div class="row"><span class="eyebrow">EM Midterm 2</span>
        <span class="row tools">${typePick()}<a href="#/settings" class="iconbtn" aria-label="Settings and themes">${icon('gear', 20)}</a></span></div>
      <div class="row base"><h1><span class="num">${solved}</span> of ${N} solved</h1><span class="muted num">${Math.round(solved / N * 100)}%</span></div>
      <div class="bar two" aria-hidden="true"><div style="width:${twice / N * 100}%"></div><div class="lite" style="width:${(solved - twice) / N * 100}%"></div></div>
      <div class="stats">
        <div class="stat"><b class="num">${dueCount}</b><span>due now</span></div>
        <div class="stat"><b class="num">${twice}</b><span>solved twice +</span></div>
        <div class="stat"><b class="num">${tries}</b><span>tries in total</span></div>
      </div>
    </header>
    <section class="pad">
      <div class="label">Up next</div>
      <div class="next">
        <div class="row"><span class="dim small">Question ${next.q.id} · ${esc(next.q.src)}</span>${examPill(next.tags.exam)}</div>
        <div class="next-title">${esc(next.q.title)}</div>
        <div class="facts">${facts}</div>
        <div class="dim small">${whyText(next)}</div>
        <div class="next-actions">
          <a class="btn light" href="#/q/${next.q.id}">Open on page ${next.q.page} ${icon('arrow', 16)}</a>
          <button class="btn ghost" id="skip">Skip</button>
        </div>
      </div>
    </section>
    <section class="pad list-gap">
      <div class="label">Chapters</div>${chapters}
    </section>
  </main>${nav('home')}`;
  $('#skip').onclick = () => { skip++; renderHome(); };
}

// ---------- Chapter list ----------

const FILTERS = [
  ['all', 'All', () => true],
  ['due', 'Due now', (s) => s.due],
  ['todo', 'Not tried', (s) => !s.tries],
  ['exam', 'D-Yes / Likely', (s) => s.tags.exam === 0 || s.tags.exam === 1],
  ['hard', 'Hard +', (s) => s.diff >= 3],
  ['stuck', 'Got stuck', (s) => s.result >= 2],
  ['loved', 'Beautiful / Nice', (s) => isLoved(s.tags.quality)],
  ['disliked', 'Ugly / Disgusting', (s) => isDisliked(s.tags.quality)]
];
let listFilter = 'all';
let listSort = 'number';

function pips(d) {
  return `<span class="pips" aria-hidden="true">${[1, 2, 3, 4].map((i) => `<i class="${i <= d ? 'on' : ''}"></i>`).join('')}</span>`;
}

function renderChapter(ch) {
  const c = chapterOf(ch) || CHAPTERS[0];
  DB.setPref('lastCh', c.ch);
  const all = scoped().filter((q) => q.ch === c.ch).map((q) => stateOf(q));
  const typeName = typeFilter().length === 1 ? TYPES.find((x) => x.id === typeFilter()[0]).name.toLowerCase() : 'questions';
  const keep = (FILTERS.find((f) => f[0] === listFilter) || FILTERS[0])[2];
  let rows = all.filter(keep);
  if (listSort === 'next') rows.sort((a, b) => priority(b) - priority(a));

  const chips = FILTERS.map(([id, label]) => `<button class="chip${listFilter === id ? ' on' : ''}" data-f="${id}" aria-pressed="${listFilter === id}">${label}</button>`).join('');
  const chTabs = CHAPTERS.map((x) => `<a class="seg${x.ch === c.ch ? ' on' : ''}" href="#/ch/${x.ch}"${x.ch === c.ch ? ' aria-current="page"' : ''}>Ch ${x.ch}</a>`).join('');

  const list = rows.map((s) => {
    let meta;
    if (s.tries) {
      const r = s.result >= 1 ? `<span class="warm">${LABELS.result[s.result]}</span>` : '';
      meta = `<span>${esc(s.q.short)}</span>${s.diff ? pips(s.diff) + '<span class="sr-only">' + LABELS.diff[s.diff] + '</span>' : ''}<span class="num">×${s.tries}</span>${r}${qualityText(s.tags.quality)}`;
    } else {
      meta = `<span>${esc(s.q.short)}</span><span>Not tried yet</span>` + qualityText(s.tags.quality);
    }
    const exam = s.tags.exam === 0 || s.tags.exam === 1 ? examPill(s.tags.exam) : '';
    return `<a class="card qrow" href="#/q/${s.q.id}">
      <span class="qn d${s.diff}">${s.q.id.slice(2)}</span>
      <span class="qbody"><span class="qt">${esc(s.q.title)}</span><span class="qmeta">${meta}</span></span>${exam}</a>`;
  }).join('') || '<p class="empty">Nothing here with these filters.</p>';

  app.innerHTML = `<main class="screen">
    <header class="top sticky">
      <div class="row titlerow"><div><span class="eyebrow">Chapter ${c.ch}</span><h1 class="h2">${c.name}</h1>
        <span class="small muted">${all.length} ${typeName} · ${all.filter((s) => s.solved).length} solved</span></div>
        <div class="segs">${chTabs}</div></div>
      <div class="chips">${chips}</div>
      <div class="row small">${typePick('left')}<span class="row tools"><span class="muted">Showing ${rows.length}</span>
        <button class="linkbtn" id="sort">Sort: ${listSort === 'next' ? 'Up next' : 'Number'}</button></span></div>
    </header>
    <section class="pad list-gap tight">${list}</section>
  </main>${nav('list')}`;
  app.querySelectorAll('.chip').forEach((b) => b.onclick = () => { listFilter = b.dataset.f; renderChapter(c.ch); });
  $('#sort').onclick = () => { listSort = listSort === 'next' ? 'number' : 'next'; renderChapter(c.ch); };
}

// ---------- Log a solve (sheet) ----------

const sheetRoot = $('#sheet');

// Close the sheet with a real back step when there is one inside the app,
// otherwise (opened straight on a question) go to its chapter.
let movedInApp = false;
function leaveSheet(q) {
  if (movedInApp) history.back();
  else location.replace('#/ch/' + q.ch);
}

function closeSheet() {
  sheetRoot.innerHTML = '';
  sheetRoot.hidden = true;
  document.body.classList.remove('locked');
}

function renderSheet(q) {
  // Draw the page behind the sheet once, if the app was opened straight on a question.
  if (!app.innerHTML) renderChapter(q.ch);
  const s = stateOf(q);
  const pick = { result: null, diff: null, quality: s.tags.quality, exam: s.tags.exam };
  const c = chapterOf(q.ch);

  const historyHtml = s.attempts.slice().reverse().map((a) => `<li>
      <span><b>${new Date(a.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</b> · ${LABELS.result[a.result]}${a.diff ? ' · ' + LABELS.diff[a.diff] : ''}${a.note ? '<br><span class="muted">' + esc(a.note) + '</span>' : ''}</span>
      <button class="linkbtn" data-del="${a.id}" aria-label="Delete this attempt">Delete</button></li>`).join('');

  const group = (key, labels, cols, values) => `<div class="field"><span class="flabel">${{ result: 'Result', diff: 'Difficulty', quality: 'How is the question?', exam: 'On the exam?' }[key]}</span>
    <div class="opts c${cols}" role="group">${labels.map((l, i) => {
      const v = values ? values[i] : i;
      return `<button class="opt${pick[key] === v ? ' on' : ''}" data-k="${key}" data-v="${v}" aria-pressed="${pick[key] === v}">${l}</button>`;
    }).join('')}</div></div>`;

  sheetRoot.hidden = false;
  document.body.classList.add('locked');
  sheetRoot.innerHTML = `<div class="scrim" data-close></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
    <div class="grab" data-close aria-hidden="true"></div>
    <div class="sheet-head"><span class="eyebrow">Question ${q.id} · ${esc(q.src)}</span>
    <h2 id="sheet-title">${esc(q.title)}</h2></div>
    <a class="btn outline" href="${c.file}#page=${q.page}" target="_blank" rel="noopener">${icon('book', 18)} Open guide on page ${q.page}</a>
    ${historyHtml ? `<details class="history"><summary>${s.tries} earlier ${s.tries === 1 ? 'try' : 'tries'}</summary><ul>${historyHtml}</ul></details>` : ''}
    <div class="row base"><span class="h3">How did it go?</span><span class="small muted">Try #${s.tries + 1}</span></div>
    ${group('result', LABELS.result, 4)}
    ${group('diff', LABELS.diff.slice(1), 4, [1, 2, 3, 4])}
    ${group('quality', ['Beautiful', 'Nice', 'OK', 'Ugly', 'Disgusting'], 5, QUALITY)}
    ${group('exam', LABELS.exam, 5)}
    <div class="field"><label class="flabel" for="note">Note to future me <span class="muted">(optional)</span></label>
      <input id="note" maxlength="300" placeholder="e.g. split into 3 regions, watch the sign" autocomplete="off"></div>
    <button class="btn primary" id="save">Save tags</button>
    <p class="small muted center" id="hint">Pick a result to count this as a try. Tap again to clear a choice.</p>
  </div>`;

  const refresh = () => {
    sheetRoot.querySelectorAll('.opt').forEach((b) => {
      const v = b.dataset.k === 'quality' ? b.dataset.v : +b.dataset.v;
      const on = pick[b.dataset.k] === v;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
    const due = pick.result === null ? null : waitDays({ result: pick.result, diff: pick.diff });
    $('#save').textContent = pick.result === null ? 'Save tags' : 'Save try #' + (s.tries + 1);
    $('#hint').textContent = pick.result === null
      ? 'Pick a result to count this as a try. Tap again to clear a choice.'
      : 'Comes back ' + (due === 0 ? 'today' : due === 1 ? 'tomorrow' : 'in ' + due + ' days') + '.';
  };

  sheetRoot.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
    const k = b.dataset.k, v = k === 'quality' ? b.dataset.v : +b.dataset.v;
    pick[k] = pick[k] === v ? null : v;
    refresh();
  });
  sheetRoot.querySelectorAll('[data-close]').forEach((el) => el.onclick = () => leaveSheet(q));
  sheetRoot.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => {
    const removed = DB.removeAttempt(b.dataset.del);
    toast('Try deleted', () => { DB.restoreAttempt(removed); renderSheet(q); });
    renderSheet(q);
  });

  $('#save').onclick = () => {
    const before = Object.assign({}, s.tags);
    DB.setTags(q.id, pick.quality, pick.exam);
    let added = null;
    if (pick.result !== null) added = DB.addAttempt(q.id, pick.result, pick.diff, $('#note').value);
    skip = 0;
    const undo = () => { if (added) DB.removeAttempt(added.id); DB.setTags(q.id, before.quality, before.exam); route(); };
    toast(added ? 'Saved try #' + (s.tries + 1) : 'Tags saved', undo);
    leaveSheet(q);
  };
  refresh();
  dragToClose($('.sheet', sheetRoot));
}

// Pull the sheet down from its top edge to close it.
function dragToClose(sheet) {
  let y0 = null, dy = 0;
  sheet.addEventListener('touchstart', (e) => {
    if (sheet.scrollTop > 0) return;
    y0 = e.touches[0].clientY; dy = 0;
  }, { passive: true });
  sheet.addEventListener('touchmove', (e) => {
    if (y0 === null) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    sheet.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  sheet.addEventListener('touchend', () => {
    if (y0 === null) return;
    sheet.style.transform = '';
    if (dy > 110) leaveSheet(q);
    y0 = null;
  });
}

// ---------- Map ----------

const SCALES = {
  diff: { names: ['Not solved', 'Easy', 'Medium', 'Hard', 'Very hard'], cls: (s) => 'd' + s.diff },
  result: { names: ['Never tried', 'Solved correctly', 'Made a mistake', 'Stuck', 'Couldn’t solve'], cls: (s) => 'r' + (s.result === null ? 0 : s.result + 1) },
  exam: { names: ['Not rated', 'D-Yes', 'Likely', 'Maybe', 'Hardly', 'D-No'], cls: (s) => 'e' + (s.tags.exam === null || s.tags.exam === undefined ? 0 : s.tags.exam + 1) }
};

function renderMap() {
  const mode = DB.data.prefs.mapMode;
  const S = SCALES[mode];
  const modes = [['diff', 'Difficulty'], ['result', 'Last result'], ['exam', 'Exam chance']]
    .map(([id, l]) => `<button class="segbtn${mode === id ? ' on' : ''}" data-m="${id}" aria-pressed="${mode === id}">${l}</button>`).join('');

  const chapters = CHAPTERS.map((c) => {
    const ss = QUESTIONS.filter((q) => q.ch === c.ch).map((q) => stateOf(q));
    const tiles = ss.map((s) => {
      const k = S.cls(s);
      const valueName = S.names[+k.slice(1)];
      const dot = mode !== 'exam' && s.tags.exam === 0 ? '<i class="dot"></i>' : mode !== 'exam' && s.tags.exam === 1 ? '<i class="ring"></i>' : '';
      const ql = s.tags.quality;
      const qm = { beautiful: '<i class="star">✦</i>', nice: '<i class="star open">✧</i>', ugly: '<i class="slash"></i>', disgusting: '<i class="cross"></i>' }[ql] || '';
      const aria = `Question ${s.q.id}, ${valueName}${ql && ql !== 'ok' ? ', ' + ql : ''}${mode !== 'exam' && (s.tags.exam === 0 || s.tags.exam === 1) ? ', ' + LABELS.exam[s.tags.exam] : ''}`;
      return `<a class="tile ${k}${inType(s.q) ? '' : ' off'}" href="#/q/${s.q.id}" aria-label="${aria}">${s.q.id.slice(2)}${dot}${qm}</a>`;
    }).join('');
    return `<div class="mapch"><div class="row small"><b>${c.ch} · ${c.name}</b><span class="muted">${ss.filter((s) => s.solved && inType(s.q)).length} / ${ss.filter((s) => inType(s.q)).length} solved</span></div><div class="tiles">${tiles}</div></div>`;
  }).join('');

  const prefix = mode[0];
  const legend = S.names.map((n, i) => `<span><i class="sw tile ${prefix}${i}"></i>${n}</span>`).join('');
  const marks = (mode !== 'exam' ? '<span><i class="sw-dot"></i>D-Yes</span><span><i class="sw-ring"></i>Likely</span>' : '') +
    '<span><b>✦</b>Beautiful</span><span><b>✧</b>Nice</span><span><i class="sw-slash"></i>Ugly</span><span><i class="sw-cross"></i>Disgusting</span>';

  app.innerHTML = `<main class="screen">
    <header class="top"><span class="eyebrow">Map</span><h1 class="h2">All ${QUESTIONS.length} at a glance</h1>
      <div class="row"><span class="small muted">${typeFilter().length ? 'Other types are faded.' : 'Tap a tile to open it.'}</span>${typePick()}</div>
      <div class="segbar" role="group" aria-label="Colour by">${modes}</div></header>
    <section class="pad map">${chapters}
      <div class="card legend"><div class="lrow">${legend}</div><div class="lrow sep">${marks}</div></div>
    </section>
  </main>${nav('map')}`;
  app.querySelectorAll('.segbtn').forEach((b) => b.onclick = () => { DB.setPref('mapMode', b.dataset.m); renderMap(); });
}

// ---------- Settings and themes ----------

const THEMES = [
  { id: 'auto', name: 'Auto', sw: ['#F3F4F7', '#2F5BEA', '#0F1115', '#8AA6FF'] },
  { id: 'light', name: 'Light', sw: ['#F3F4F7', '#FFFFFF', '#2F5BEA', '#15171C'] },
  { id: 'paper', name: 'Paper', sw: ['#F5EFE4', '#FFFCF6', '#A8431A', '#2A2118'] },
  { id: 'forest', name: 'Forest', sw: ['#EDF2EE', '#FFFFFF', '#1C7350', '#143326'] },
  { id: 'night', name: 'Night', sw: ['#0F1115', '#181B21', '#8AA6FF', '#F0A25E'] }
];
const darkQuery = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;

// Auto follows the phone: Light by day, Night when the phone is in dark mode.
function applyTheme() {
  const pref = DB.data.prefs.theme || 'auto';
  const t = pref === 'auto' ? (darkQuery && darkQuery.matches ? 'night' : 'light') : pref;
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('qt-theme', t); } catch (e) { /* not important */ }
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelector('meta[name=theme-color]').setAttribute('content', bg);
}
if (darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', applyTheme);

function renderSettings() {
  const n = DB.data.attempts.length;
  app.innerHTML = `<main class="screen">
    <header class="top"><div class="row start"><a href="#/" class="iconbtn" aria-label="Back">${icon('back')}</a><h1 class="h2">Settings</h1></div></header>
    <section class="pad list-gap">
      <div class="card stack">
        <span class="h3">Theme</span>
        <div class="themes" role="group" aria-label="Theme">${THEMES.map((t) => `<button class="theme${DB.data.prefs.theme === t.id ? ' on' : ''}" data-t="${t.id}" aria-pressed="${DB.data.prefs.theme === t.id}">
          <span class="swatch" aria-hidden="true">${t.sw.map((c) => `<i style="background:${c}"></i>`).join('')}</span>${t.name}</button>`).join('')}</div>
      </div>
      <div class="card stack">
        <span class="h3">Backup</span>
        <span class="small muted">Your ratings live only on this phone (${n} tries saved). Save a backup file now and then, and before clearing the browser.</span>
        <button class="btn primary" id="export">Save backup file</button>
        <label class="btn outline" for="import">Restore from backup</label>
        <input type="file" id="import" accept="application/json,.json" hidden>
      </div>
      <div class="card stack">
        <span class="h3">Study guides</span>
        <span class="small muted">“Open guide” looks for the PDFs in the app’s <b>guides/</b> folder: EM_C4_Study_Guide.pdf, EM_C5_Study_Guide.pdf and EM_C6_Study_Guide.pdf.</span>
      </div>
      <p class="small muted center">Question Tracker · ${APP_VERSION}</p>
    </section>
  </main>${nav('')}`;
  app.querySelectorAll('.theme').forEach((b) => b.onclick = () => { DB.setPref('theme', b.dataset.t); applyTheme(); renderSettings(); });
  $('#export').onclick = () => {
    const blob = new Blob([DB.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'question-tracker-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $('#import').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { DB.importJSON(await f.text()); toast('Backup restored'); renderSettings(); }
    catch (err) { toast(err.message || 'Could not read that file'); }
  };
}

// ---------- Toast ----------

let toastTimer = null;
function toast(text, undo) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(text)}</span>${undo ? '<button class="linkbtn light" id="undo">Undo</button>' : ''}`;
  t.hidden = false;
  if (undo) $('#undo').onclick = () => { t.hidden = true; undo(); };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 5000);
}

// ---------- Start ----------

DB.load();
applyTheme();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
window.addEventListener('hashchange', () => { movedInApp = true; route(); });
route();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js');
