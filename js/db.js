// Saved data. Everything lives on this phone in localStorage under one key.
//
// Shape (version 2):
// {
//   v: 1,
//   attempts: [ { id, q: '4.12', at: ISO date, result: 0-3, diff: 1-4 | null, note } ],
//   tags:     { '4.12': { quality: 'beautiful' | 'nice' | 'ok' | 'ugly' | 'disgusting' | null, exam: 0-4 | null } },
//   prefs:    { mapMode: 'diff' | 'result' | 'exam', lastCh: 4, theme: 'auto' | 'light' | 'paper' | 'forest' | 'night' }
// }
//
// result: 0 Solved correctly, 1 Made a mistake, 2 Stuck, 3 Couldn't solve
// diff:   1 Easy, 2 Medium, 3 Hard, 4 Very hard
// exam:   0 D-Yes, 1 Likely, 2 Maybe, 3 Hardly, 4 D-No
//
// Version 1 → 2: the 'normal' rating became 'ok'.

const DB_KEY = 'question-tracker';
const DB_VERSION = 2;

const DB = {
  data: null,

  empty() {
    return { v: DB_VERSION, attempts: [], tags: {}, prefs: { mapMode: 'diff', lastCh: 4, theme: 'auto' } };
  },

  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DB_KEY)); } catch (e) { d = null; }
    const old = d && d.v;
    this.data = this.migrate(d || this.empty());
    if (old && old !== DB_VERSION) this.save(); // keep the upgraded layout
    return this.data;
  },

  // Future layout changes go here, so old data always carries over.
  migrate(d) {
    const base = this.empty();
    d.attempts = Array.isArray(d.attempts) ? d.attempts : [];
    d.tags = d.tags && typeof d.tags === 'object' ? d.tags : {};
    d.prefs = Object.assign(base.prefs, d.prefs || {});
    // v1 → v2: three-step rating became five steps; 'normal' maps to 'ok'.
    Object.values(d.tags).forEach((t) => { if (t && t.quality === 'normal') t.quality = 'ok'; });
    d.v = DB_VERSION;
    return d;
  },

  save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(this.data)); return true; }
    catch (e) { return false; }
  },

  attemptsFor(qid) {
    return this.data.attempts.filter((a) => a.q === qid).sort((a, b) => a.at.localeCompare(b.at));
  },

  tagsFor(qid) {
    return this.data.tags[qid] || { quality: null, exam: null };
  },

  addAttempt(qid, result, diff, note) {
    const a = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      q: qid, at: new Date().toISOString(), result, diff: diff || null, note: (note || '').trim()
    };
    this.data.attempts.push(a);
    this.save();
    return a;
  },

  removeAttempt(id) {
    const i = this.data.attempts.findIndex((a) => a.id === id);
    if (i < 0) return null;
    const [a] = this.data.attempts.splice(i, 1);
    this.save();
    return a;
  },

  restoreAttempt(a) {
    this.data.attempts.push(a);
    this.save();
  },

  setTags(qid, quality, exam) {
    this.data.tags[qid] = { quality: quality || null, exam: exam === undefined ? null : exam };
    this.save();
  },

  setPref(k, v) {
    this.data.prefs[k] = v;
    this.save();
  },

  exportJSON() {
    return JSON.stringify({ app: 'question-tracker', exportedAt: new Date().toISOString(), data: this.data }, null, 1);
  },

  importJSON(text) {
    const parsed = JSON.parse(text);
    const d = parsed && parsed.data ? parsed.data : parsed;
    if (!d || !Array.isArray(d.attempts)) throw new Error('This file is not a Question Tracker backup.');
    this.data = this.migrate(d);
    this.save();
  }
};
