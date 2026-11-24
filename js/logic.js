// Labels, the state of each question, and how "Up next" is chosen.

const LABELS = {
  result: ['Solved correctly', 'Made a mistake', 'Stuck', 'Couldn’t solve'],
  diff: ['', 'Easy', 'Medium', 'Hard', 'Very hard'],
  quality: { beautiful: '✦ Beautiful', nice: 'Nice', ok: 'OK', ugly: 'Ugly', disgusting: 'Disgusting' },
  exam: ['D-Yes', 'Likely', 'Maybe', 'Hardly', 'D-No']
};

// Question ratings from best to worst.
const QUALITY = ['beautiful', 'nice', 'ok', 'ugly', 'disgusting'];
const isLoved = (q) => q === 'beautiful' || q === 'nice';
const isDisliked = (q) => q === 'ugly' || q === 'disgusting';

const DAY = 24 * 60 * 60 * 1000;

// Days until a question should come back, after its last attempt.
function waitDays(last) {
  if (!last) return 0;
  if (last.result === 0) return [5, 7, 5, 3, 2][last.diff || 0];
  if (last.result === 1) return 1;
  return 0;
}

// Everything the screens need to know about one question.
function stateOf(q, now) {
  now = now || Date.now();
  const attempts = DB.attemptsFor(q.id);
  const last = attempts[attempts.length - 1] || null;
  const tags = DB.tagsFor(q.id);
  const solved = attempts.some((a) => a.result <= 1);
  const lastDiff = [...attempts].reverse().find((a) => a.diff);
  const dueAt = last ? new Date(last.at).getTime() + waitDays(last) * DAY : 0;
  return {
    q, attempts, last, tags, solved,
    tries: attempts.length,
    diff: lastDiff ? lastDiff.diff : 0,
    result: last ? last.result : null,
    due: dueAt <= now,
    dueAt,
    daysSince: last ? Math.floor((now - new Date(last.at).getTime()) / DAY) : null
  };
}

const EXAM_WEIGHT = [5, 4, 2.5, 1, 0.2];

// Higher score = study it sooner.
function priority(s, now) {
  now = now || Date.now();
  const exam = s.tags.exam === null || s.tags.exam === undefined ? 2.5 : EXAM_WEIGHT[s.tags.exam];
  let score = exam;
  if (!s.last) score *= 1.3;
  else {
    score *= [0.8, 1.4, 1.7, 1.9][s.result];
    score *= 1 + (s.diff || 2) * 0.12;
    const overdue = Math.max(0, (now - s.dueAt) / DAY);
    score *= 1 + Math.min(overdue, 9) / 6;
  }
  if (!s.due) score *= 0.15;
  return score;
}

function whyText(s) {
  const bits = [];
  if (s.tags.exam === 0) bits.push('definitely on the exam');
  else if (s.tags.exam === 1) bits.push('likely on the exam');
  if (!s.last) bits.push('not tried yet');
  else if (s.result >= 2) bits.push('you got stuck last time');
  else if (s.result === 1) bits.push('you made a mistake last time');
  else if (s.diff >= 3) bits.push('it felt hard');
  if (s.last && s.due && s.result === 0) bits.push('it is due again');
  if (!bits.length) return 'Next in line.';
  const t = bits.join(', ');
  return 'Picked because ' + t.replace(/, ([^,]*)$/, ' and $1') + '.';
}

// The question types ticked in the type menu, e.g. ['ex', 'hw']. Empty = all types. Applies to every screen.
function typeFilter() { return DB.data.prefs.types || []; }
function inType(q) { const t = typeFilter(); return !t.length || t.includes(q.type); }
function scoped() { return QUESTIONS.filter(inType); }

function rankedQueue(now) {
  return scoped().map((q) => stateOf(q, now))
    .sort((a, b) => priority(b, now) - priority(a, now) || a.q.id.localeCompare(b.q.id));
}

function agoText(days) {
  if (days === null) return '';
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return days + ' days ago';
}
