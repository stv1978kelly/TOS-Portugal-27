// ╔══════════════════════════════════════════════════════════════╗
// ║  Golf tour score card backend (Google Apps Script)          ║
// ║  Bound to the tour's Google Sheet. Setup guide: SETUP.md    ║
// ╚══════════════════════════════════════════════════════════════╝
//
// Tabs (created automatically on first use):
//   Players  - Player | Handicap        (handicap 0 = gross Stableford)
//   Settings - Setting | Value          (Allowance, e.g. 1 = 100%, 0.95 = 95%)
//   Schedule - Day | Course | Date      (Date optional: only needed if a
//                                        course is played on two days)
//   Cards    - one row per submitted card, newest wins for a player/course/date
//   Notifications - Posted | Message   (type a Message; Posted stamps itself)
//
// Endpoints:
//   POST  body = JSON {player, course, submittedBy, scores:[18], pin}
//         -> {ok:true} or {ok:false, error, pinRejected?}
//
// Card PIN: kept in Script Properties as CARD_PIN (Project Settings > Script
// Properties), never in this file - the repo is public.
//   GET   ?action=leaderboard -> {ok:true, days:[...], notifications:[...],
//                                 handicaps:{player: hcp}, allowance}

// ── Course data: yellow-tee course rating / slope, par and stroke index (holes 1-18) ──
// ════════════════════ CONFIG - edit per customer ════════════════════
// Keep players, courses, schedule and leagues in step with config.js
// (backend/test/tour.js checks they match).
const COURSES = {
  "Salgados": {
    cr: 71.2, slope: 124,   // yellow, men - FPG scorecard (scoring-pt.datagolf.pt, course 017-1)
    par: [4,5,3,4,4,5,4,3,4, 4,4,3,4,5,5,4,3,4],
    si:  [11,3,15,9,7,1,5,17,13, 8,12,18,10,6,2,14,16,4]
  },
  "Vale do Lobo Royal": {
    cr: 70.7, slope: 129,   // yellow, men - club/FPG handicap table (2024_Golf_Handicaps_RGC.pdf)
    par: [5,4,4,4,5,4,3,4,3, 4,5,4,4,4,4,3,4,4],
    si:  [15,13,3,11,7,1,17,5,9, 16,2,12,4,6,18,10,8,14]
  },
  "Ombria": {
    cr: 68.6, slope: 127,   // yellow, men - FPG scorecard (scoring-pt.datagolf.pt, course 113-1)
    par: [5,5,4,3,3,5,3,4,4, 4,3,5,3,4,4,5,3,4],
    si:  [5,3,17,13,15,7,9,11,1, 4,8,2,14,16,6,10,12,18]
  }
};

// Day 1-3 in order. Filled into the Schedule tab while it has no valid courses.
const DEFAULT_SCHEDULE = ["Salgados", "Vale do Lobo Royal", "Ombria"];

const PLAYERS = [
  "Bernie B", "Paul G", "Mike H", "Dave W", "Jay G", "Billy R", "Robbie F", "Steve W", "Dava", "John T", "Andrew H"
];

const DAYS = DEFAULT_SCHEDULE.length;

// Daily handicap adjustment ("leagues"). After each played day a player's
// handicap moves by their Stableford points, at the rate for the league they
// were in going into that day: cut per point over CUT_ABOVE, added per point
// under ADD_BELOW. The day's winner(s) also lose WINNER_SHOT and the day's last
// place(s) gain LAST_SHOT (0 = off). The whole day's move is capped at MAX_MOVE
// either way, those shots included (Infinity = no cap).
// Set ADJUST_HANDICAPS = false to play off fixed handicaps.
const ADJUST_HANDICAPS = true;
const CUT_ABOVE = 34;
const ADD_BELOW = 28;
const LEAGUES = [          // first league whose `below` the handicap is under (10 = League 2)
  {below: 10, rate: 0.3},
  {below: 18, rate: 0.5},
  {below: Infinity, rate: 0.7}
];
const WINNER_SHOT = 1;
const LAST_SHOT = 1;
const MAX_MOVE = 4;
// ══════════════════════════ end of CONFIG ════════════════════════════
const TZ = "Europe/Lisbon";
const CARD_HEADERS = ["Timestamp", "Date", "Player", "Course", "Submitted By"]
  .concat(Array.from({length: 18}, (_, i) => "H" + (i + 1)))
  .concat(["Gross", "Pts Front", "Pts Back", "Pts Total"]);

// ── Web endpoints ──
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    ROWS_CACHE = {};
    ensureSheets();
    const card = JSON.parse(e.postData.contents);
    const pin = PropertiesService.getScriptProperties().getProperty("CARD_PIN");
    if (!pin) return json({ok: false, error: "Card PIN isn't set up on the scores sheet yet."});
    if (String(card.pin || "") !== String(pin)) return json({ok: false, error: "Wrong PIN.", pinRejected: true});
    const err = validateCard(card);
    if (err) return json({ok: false, error: err});
    saveCard(card);
    return json({ok: true});
  } catch (ex) {
    return json({ok: false, error: String(ex)});
  } finally {
    ROWS_CACHE = null;
    lock.releaseLock();
  }
}

function doGet(e) {
  ROWS_CACHE = {};
  try {
    ensureSheets();
    const action = (e && e.parameter && e.parameter.action) || "leaderboard";
    if (action === "leaderboard") return json({ok: true, days: leaderboard(), notifications: notifications(),
                                                handicaps: handicaps(), allowance: allowance()});
    return json({ok: false, error: "Unknown action: " + action});
  } catch (ex) {
    return json({ok: false, error: String(ex)});
  } finally {
    ROWS_CACHE = null;
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Sheet setup (safe to run repeatedly) ──
function ensureSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  makeSheet(ss, "Players", ["Player", "Handicap"], PLAYERS.map(p => [p, 0]));
  makeSheet(ss, "Settings", ["Setting", "Value"], [["Allowance", 1]]);
  const created = makeSheet(ss, "Schedule", ["Day", "Course", "Date"],
    Array.from({length: DAYS}, (_, i) => ["Day " + (i + 1), "", ""]));
  makeSheet(ss, "Cards", CARD_HEADERS, []);
  makeSheet(ss, "Notifications", ["Posted", "Message"], []);
  refreshSchedule(ss.getSheetByName("Schedule"), !!created);
}

// When no Schedule course is a current course (new sheet, or one still on an
// old course list), reset to DEFAULT_SCHEDULE and the current course dropdown.
// Once any valid course is set, the Schedule is left alone.
function refreshSchedule(sh, force) {
  const courses = sh.getRange(2, 2, DAYS, 1).getValues().map(r => String(r[0]).trim());
  if (!force && courses.some(c => COURSES[c])) return;
  // Dropdown first, so the old course list can't reject the new names.
  sh.getRange(2, 2, DAYS, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(Object.keys(COURSES), true).setAllowInvalid(false).build())
    .setValues(DEFAULT_SCHEDULE.map(c => [c]));
}

// Creates the tab if missing and returns it; returns null if it already existed.
function makeSheet(ss, name, headers, rows) {
  if (ss.getSheetByName(name)) return null;
  const sh = ss.insertSheet(name);
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  if (rows.length) sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  sh.setFrozenRows(1);
  return sh;
}

// Each tab is read from the sheet once per request (doGet/doPost) and reused:
// sheet reads are the slow part, and the leaderboard looks things up per card.
let ROWS_CACHE = null;

function rows(name) {
  if (ROWS_CACHE && ROWS_CACHE[name]) return ROWS_CACHE[name];
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  const data = sh.getDataRange().getValues().slice(1);
  if (ROWS_CACHE) ROWS_CACHE[name] = data;
  return data;
}

// ── Cards ──
function validateCard(c) {
  if (!c || PLAYERS.indexOf(c.player) < 0) return "Unknown player.";
  if (!COURSES[c.course]) return "Unknown course.";
  if (PLAYERS.indexOf(c.submittedBy) < 0) return "Unknown submitter.";
  if (c.submittedBy === c.player) return "You cannot submit your own score card!";
  if (!Array.isArray(c.scores) || c.scores.length !== 18) return "All 18 holes are needed.";
  for (let i = 0; i < 18; i++) {
    const s = Number(c.scores[i]);
    if (!Number.isInteger(s) || s < 1 || s > 15) return "Hole " + (i + 1) + " score is not valid.";
  }
  return "";
}

function saveCard(c) {
  const now = new Date();
  const scores = c.scores.map(Number);
  const pts = stablefordPoints(c.course, scores, dayHandicapFor(c.course, c.player));
  const gross = scores.reduce((a, b) => a + b, 0);
  const row = [now, Utilities.formatDate(now, TZ, "yyyy-MM-dd"), c.player, c.course, c.submittedBy]
    .concat(scores)
    .concat([gross, pts.front, pts.back, pts.total]);
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cards").appendRow(row);
}

// ── Stableford ──
function allowance() {
  const r = rows("Settings").find(r => r[0] === "Allowance");
  const v = r ? Number(r[1]) : 1;
  return isNaN(v) || v <= 0 ? 1 : (v > 1.5 ? v / 100 : v);   // accepts 95 or 0.95
}

function handicapFor(player) {
  const r = rows("Players").find(r => r[0] === player);
  const h = r ? Number(r[1]) : 0;
  return isNaN(h) ? 0 : h;
}

// {player: handicap} for the score card's live Stableford points.
function handicaps() {
  return rows("Players").reduce((m, r) => {
    if (r[0]) { const h = Number(r[1]); m[r[0]] = isNaN(h) ? 0 : h; }
    return m;
  }, {});
}

// Shots received on a hole of stroke index si for playing handicap ph.
function shotsOnHole(ph, si) {
  if (ph >= 0) return Math.floor(ph / 18) + (si <= ph % 18 ? 1 : 0);
  const p = -ph;   // plus handicap: gives shots back on the easiest holes
  const n = Math.floor(p / 18) + (si > 18 - p % 18 ? 1 : 0);
  return n ? -n : 0;
}

// World Handicap System: course handicap = index x slope/113 + (course rating - par);
// playing handicap = that x allowance, rounded once at the end (as the RFEG tables do).
function courseHandicapExact(course, handicap) {
  const c = COURSES[course];
  return handicap * c.slope / 113 + (c.cr - c.par.reduce((a, b) => a + b, 0));
}

function stablefordPoints(course, scores, handicap) {
  const c = COURSES[course];
  const ph = Math.round(courseHandicapExact(course, handicap) * allowance());
  const perHole = scores.map((s, i) =>
    Math.max(0, 2 + c.par[i] + shotsOnHole(ph, c.si[i]) - s));
  const front = perHole.slice(0, 9).reduce((a, b) => a + b, 0);
  const back = perHole.slice(9).reduce((a, b) => a + b, 0);
  return {perHole: perHole, front: front, back: back, total: front + back};
}

// ── Leaderboard ──
// ── Tour handicap adjustments (see LEAGUES in CONFIG) ──
// Players tab = starting handicap. No card that day = no change. Kept to one
// decimal; rounded only when turned into a course handicap.
function leagueRate(hcp) {
  return LEAGUES.find(l => hcp < l.below).rate;
}

// bonus: -WINNER_SHOT for the day's winner, +LAST_SHOT for last place, 0 otherwise.
function adjustedHandicap(hcp, points, bonus) {
  if (!ADJUST_HANDICAPS) return hcp;
  const rate = leagueRate(hcp);
  let move = bonus || 0;
  if (points > CUT_ABOVE) move -= rate * (points - CUT_ABOVE);
  else if (points < ADD_BELOW) move += rate * (ADD_BELOW - points);
  move = Math.max(-MAX_MOVE, Math.min(MAX_MOVE, move));
  return Math.round((hcp + move) * 10) / 10;
}

// Days in schedule order, each with the handicap every player played off that
// day (start handicap, then adjusted by every earlier day's card).
function leaderboard() {
  const schedule = rows("Schedule");
  const cards = rows("Cards");
  const players = rows("Players").map(r => r[0]).filter(Boolean);
  const hcp = {};
  players.forEach(p => { hcp[p] = handicapFor(p); });

  return schedule.map(s => {
    const day = String(s[0]);
    const course = String(s[1] || "").trim();
    const date = s[2] ? dateKey(s[2]) : "";
    const dayHcp = Object.assign({}, hcp);
    if (!course || !COURSES[course]) return {day: day, course: course, rows: [], handicaps: dayHcp};

    // Newest card per player wins (lets a wrong card be corrected by resubmitting).
    const latest = {};
    cards.forEach(c => {
      if (c[3] !== course) return;
      if (date && dateKey(c[1]) !== date) return;
      const ts = new Date(c[0]).getTime();
      if (!latest[c[2]] || ts >= latest[c[2]].ts) latest[c[2]] = {ts: ts, card: c};
    });

    const out = players.map(p => {
      const hit = latest[p];
      if (!hit) return {player: p, hcp: dayHcp[p], front: null, back: null, total: null, gross: null};
      // Recalculated live, so handicap, allowance or earlier-card changes flow through.
      const pts = stablefordPoints(course, hit.card.slice(5, 23).map(Number), dayHcp[p]);
      return {player: p, hcp: dayHcp[p], front: pts.front, back: pts.back, total: pts.total, gross: Number(hit.card[23])};
    });

    // Points only; level players share the position. Players without a card go last.
    out.sort((a, b) => {
      if (a.total === null || b.total === null) return (a.total === null) - (b.total === null);
      return b.total - a.total;
    });
    let pos = 0;
    out.forEach((r, i) => {
      if (r.total === null) { r.pos = null; return; }
      const prev = out[i - 1];
      if (!prev || prev.total !== r.total) pos = i + 1;
      r.pos = pos;
    });

    // Handicaps for the next day, once the day's winner(s) and last place(s) are known.
    const played = out.filter(r => r.total !== null);
    if (played.length) {
      const best = played[0].total, worst = played[played.length - 1].total;
      played.forEach(r => {
        const bonus = (r.total === best ? -WINNER_SHOT : 0) + (r.total === worst ? LAST_SHOT : 0);
        hcp[r.player] = adjustedHandicap(r.hcp, r.total, bonus);
      });
    }
    return {day: day, course: course, rows: out, handicaps: dayHcp};
  });
}

// The handicap a player is on for the day this course is scheduled (today's
// date picks between two days on the same course); start handicap if unscheduled.
function dayHandicapFor(course, player) {
  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
  const sched = rows("Schedule");
  const days = leaderboard();
  let pick = -1;
  sched.forEach((s, i) => {
    if (String(s[1] || "").trim() !== course) return;
    if (pick < 0 || (s[2] && dateKey(s[2]) === today)) pick = i;
  });
  return pick >= 0 && player in days[pick].handicaps ? days[pick].handicaps[player] : handicapFor(player);
}

function dateKey(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, "yyyy-MM-dd");
  return String(v).slice(0, 10);
}

// ── Notifications ──
// Simple trigger: typing a Message stamps Posted with the time (only if Posted is
// empty, so editing a message's wording later doesn't move its time).
function onEdit(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== "Notifications") return;
  const top = e.range.getRow(), left = e.range.getColumn();
  if (left > 2 || left + e.range.getNumColumns() - 1 < 2) return;
  for (let r = Math.max(top, 2); r < top + e.range.getNumRows(); r++) {
    const msg = String(sh.getRange(r, 2).getValue()).trim();
    const posted = sh.getRange(r, 1);
    if (msg && !posted.getValue()) posted.setValue(new Date());
  }
}

// Newest first. Rows without a message are ignored; rows without a time are listed
// but never bannered.
function notifications() {
  return rows("Notifications")
    .filter(r => String(r[1]).trim())
    .map(r => ({posted: r[0] instanceof Date ? r[0].toISOString() : (r[0] ? String(r[0]) : null),
                message: String(r[1]).trim()}))
    .sort((a, b) => (b.posted ? new Date(b.posted).getTime() : 0) - (a.posted ? new Date(a.posted).getTime() : 0))
    .slice(0, 30);
}
