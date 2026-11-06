// The tour's own setup: courses, players, schedule and page config, run against
// Code.gs exactly as it is (the rules themselves are tested in test.js).
const fs = require('fs');
const vm = require('vm');
const assert0 = require('assert');
const plain = v => JSON.parse(JSON.stringify(v));
const assert = Object.assign((...a) => assert0(...a), assert0, { deepStrictEqual: (a, b, m) => assert0.deepStrictEqual(plain(a), plain(b), m) });
const { makeContext, REPO } = require('./harness');

let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('ok  ' + name); };

const html = fs.readFileSync(REPO + '/index.html', 'utf8');
const cfg = (() => { const w = {}; vm.runInNewContext(fs.readFileSync(REPO + '/config.js', 'utf8'), { window: w }); return w.TOUR_CONFIG; })();
const ctx = makeContext({ real: true });
const gsCourses = vm.runInContext('COURSES', ctx);
const sum = a => a.reduce((x, y) => x + y, 0);

t('course par/SI/rating/slope: page = script, SI 1-18 once each', () => {
  assert.deepStrictEqual(Object.keys(gsCourses), Object.keys(cfg.courses));
  for (const [k, c] of Object.entries(cfg.courses)) {
    assert.deepStrictEqual(gsCourses[k].par, c.holes.map(h => h[2]), k + ' par');
    assert.deepStrictEqual(gsCourses[k].si, c.holes.map(h => h[3]), k + ' si');
    assert.deepStrictEqual([gsCourses[k].cr, gsCourses[k].slope], [c.cr, c.slope], k + ' rating/slope');
    assert.deepStrictEqual(c.holes.map(h => h[0]), Array.from({ length: 18 }, (_, n) => n + 1), k + ' hole numbers');
    assert.deepStrictEqual(c.holes.map(h => h[3]).sort((a, b) => a - b), Array.from({ length: 18 }, (_, i) => i + 1), k + ' SI');
  }
});
t('course data = the official cards (yellow metres out / in / total, par, men\'s yellow rating and slope)', () => {
  const official = {
    'Salgados':           [2851, 2764, 5615, 72, 71.2, 124],   // FPG scorecard (datagolf.pt 017-1)
    'Vale do Lobo Royal': [2728, 2868, 5596, 72, 70.7, 129],   // valedolobo.com card + club/FPG handicap table
    'Ombria':             [2677, 2673, 5350, 71, 68.6, 127]    // FPG scorecard (datagolf.pt 113-1)
  };
  assert.deepStrictEqual(Object.keys(cfg.courses), Object.keys(official));
  for (const [k, row] of Object.entries(official)) {
    const m = cfg.courses[k].holes.map(h => h[1]);
    assert.deepStrictEqual([sum(m.slice(0, 9)), sum(m.slice(9)), sum(m), sum(cfg.courses[k].holes.map(h => h[2])), cfg.courses[k].cr, cfg.courses[k].slope], row, k);
  }
});
t('3 days: Salgados, Vale do Lobo Royal, Ombria; page schedule = script', () => {
  assert.deepStrictEqual(cfg.schedule, ['Salgados', 'Vale do Lobo Royal', 'Ombria']);
  assert.deepStrictEqual(vm.runInContext('DEFAULT_SCHEDULE', ctx), cfg.schedule);
  assert.strictEqual(vm.runInContext('DAYS', ctx), 3);
});
t('the 11 players, page = script', () => {
  assert.deepStrictEqual(cfg.players, ['Bernie B', 'Paul G', 'Mike H', 'Dave W', 'Jay G', 'Billy R', 'Robbie F', 'Steve W', 'Dava', 'John T', 'Andrew H']);
  assert.deepStrictEqual(vm.runInContext('PLAYERS', ctx), cfg.players);
});
t('page config: own id, title, badge, nothing carried over from another tour', () => {
  assert.strictEqual(cfg.id, 'tos-portugal-27');
  assert.deepStrictEqual([cfg.title, cfg.subtitle], ["TAM O'SHANTER", 'Overseas Golf · Portugal 26']);
  assert.ok(fs.existsSync(REPO + '/' + cfg.badge.src), 'badge file');
  assert.deepStrictEqual([cfg.champions, cfg.photos, cfg.sponsors], [null, [], []]);
  assert.ok(cfg.pinHash === 'PIN_NOT_SET' || /^[0-9a-f]{64}$/.test(cfg.pinHash), 'pinHash');
  assert.notStrictEqual(cfg.pinHash, 'f735de5c668a3ac3d297e32cef3e0a897034d65c24fcdb309a6315760c96274a', 'not the template demo PIN');
  assert.ok(cfg.webAppUrl, 'webAppUrl');
});
t('course handicap matches the Vale do Lobo Royal table rows (yellow, men)', () => {
  const ch = (idx, allow) => Math.round(vm.runInContext('courseHandicapExact', ctx)('Vale do Lobo Royal', idx) * allow);
  [[9.4, 1, 9], [9.5, 1, 10], [30.4, 1, 33], [30.5, 1, 34], [0.0, 1, -1], [17.0, 1, 18],    // 100% column
   [9.8, 0.95, 9], [9.9, 0.95, 10]]                                                         // 95% column
    .forEach(([i, a, want]) => assert.strictEqual(ch(i, a), want, i + ' @' + a));
});
t('page course handicap, playing handicap and Stableford = script, every course', () => {
  const fns = vm.createContext({ Math, Number, isNaN, COURSES: cfg.courses });
  vm.runInContext(['courseHandicapExact', 'allowanceFactor', 'dayPlayingHandicap', 'shotsOnHole', 'stablefordHole']
    .map(n => html.match(new RegExp('function ' + n + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}'))[0]).join('\n'), fns);
  vm.runInContext('ensureSheets()', ctx);
  const gsCH = vm.runInContext('courseHandicapExact', ctx), gsPts = vm.runInContext('stablefordPoints', ctx);
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const k of cfg.schedule) {
    for (let i = -40; i <= 540; i++) {
      assert.ok(Math.abs(fns.courseHandicapExact(cfg.courses[k], i / 10) - gsCH(k, i / 10)) < 1e-9, k + ' ' + i / 10);
      assert.strictEqual(fns.dayPlayingHandicap(k, i / 10, 1), Math.round(gsCH(k, i / 10)), k + ' PH ' + i / 10);
    }
    for (let hcp = -4; hcp <= 40; hcp++) {
      const scores = gsCourses[k].par.map(p => Math.max(1, p + Math.floor(rnd() * 6) - 2));
      const ph = Math.round(gsCH(k, hcp));
      assert.deepStrictEqual(scores.map((sc, i) => fns.stablefordHole(gsCourses[k].par[i], gsCourses[k].si[i], ph, sc)), gsPts(k, scores, hcp).perHole, k + ' ' + hcp);
    }
  }
});
t('a fresh sheet: 11 players, 3-day schedule, course dropdown of the 3 courses', () => {
  const c2 = makeContext({ real: true });
  vm.runInContext('ensureSheets()', c2);
  assert.deepStrictEqual(c2.__sheets.Players.data.slice(1).map(r => r[0]), cfg.players);
  assert.deepStrictEqual(c2.__sheets.Schedule.data.slice(1).map(r => r[0] + ' ' + r[1]), ['Day 1 Salgados', 'Day 2 Vale do Lobo Royal', 'Day 3 Ombria']);
  assert.deepStrictEqual(c2.__sheets.Schedule.validation.v.list, cfg.schedule);
});
t('a full 3-day week through the real script: points, shared places, handicaps carried day to day', () => {
  const c2 = makeContext({ real: true });
  vm.runInContext('ensureSheets()', c2);
  c2.__props.CARD_PIN = '4321';   // dummy - the real PIN lives only in Script Properties
  const start = { 'Bernie B': 17, 'Paul G': 9.9, 'Mike H': 24, 'Dave W': 12, 'Jay G': 6, 'Billy R': 20, 'Robbie F': 10, 'Steve W': 9.9, Dava: 15, 'John T': 28, 'Andrew H': 11 };
  c2.__sheets.Players.data.slice(1).forEach(r => (r[1] = start[r[0]]));
  const post = b => JSON.parse(vm.runInContext('doPost', c2)({ postData: { contents: JSON.stringify(b) } }).body);
  const get = () => JSON.parse(vm.runInContext('doGet', c2)({ parameter: { action: 'leaderboard' } }).body);
  // Everyone plays to par plus a per-player number of bogeys, a different mix each day.
  const extra = [[0, 3, 6, 1, 2, 9, 4, 5, 7, 8, 3], [5, 0, 2, 8, 3, 1, 6, 9, 4, 7, 10], [2, 6, 0, 4, 9, 3, 1, 7, 8, 5, 6]];
  cfg.schedule.forEach((course, d) => cfg.players.forEach((p, n) => {
    const scores = gsCourses[course].par.map((par, h) => par + (h < extra[d][n] ? 1 : 0));
    assert.strictEqual(post({ player: p, course, submittedBy: p === 'John T' ? 'Steve W' : 'John T', scores, pin: '4321' }).ok, true, p + ' ' + course);
  }));
  const lb = get();
  assert.strictEqual(lb.days.length, 3);
  // An independent version of the rules: League 1 under 10 (0.3), League 2 10-17.9 (0.5), League 3 18 up (0.7);
  // cut per point over 34, add per point under 28; winner -1, last +1; whole move capped at 4.
  const rate = h => (h < 10 ? 0.3 : h < 18 ? 0.5 : 0.7);
  const idx = Object.assign({}, start);
  lb.days.forEach(day => {
    assert.strictEqual(day.rows.length, 11);
    day.rows.forEach(r => assert.strictEqual(r.hcp, idx[r.player], day.day + ' ' + r.player + ' index'));
    const pts = day.rows.map(r => r.total), best = Math.max(...pts), worst = Math.min(...pts);
    day.rows.forEach(r => {
      assert.strictEqual(r.pos, 1 + day.rows.filter(o => o.total > r.total).length, day.day + ' ' + r.player + ' place');
      let m = (r.total === best ? -1 : 0) + (r.total === worst ? 1 : 0);
      if (r.total > 34) m -= rate(r.hcp) * (r.total - 34); else if (r.total < 28) m += rate(r.hcp) * (28 - r.total);
      idx[r.player] = Math.round((r.hcp + Math.max(-4, Math.min(4, m))) * 10) / 10;
    });
  });
});

console.log('\n' + pass + ' passed');
