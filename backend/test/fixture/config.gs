// The template's sample CONFIG (Malaga courses, sample players): the rule tests
// in test.js run against this, so they prove the rules are the template's own.
// Keep players, courses, schedule and leagues in step with config.js
// (backend/test/test.js checks they match).
const COURSES = {
  "Torrequebrada": {
    cr: 70.9, slope: 139,   // yellow, men - EGA/WHS table valid 07/03/2023 (club PDF)
    par: [5,4,3,4,4,5,4,4,3, 4,3,5,3,5,4,4,4,4],
    si:  [8,6,18,10,14,4,12,2,16, 3,15,5,17,7,11,1,9,13]
  },
  "Calanova": {
    cr: 71.5, slope: 136,   // yellow, men - RFEG table 05/12/2015 (club slope.pdf)
    par: [5,4,4,4,4,3,4,3,5, 5,4,4,3,5,4,4,3,4],
    si:  [9,5,13,11,1,7,15,17,3, 6,4,18,12,2,8,10,16,14]
  },
  "Cabopino": {
    cr: 69.1, slope: 130,   // yellow, men - club's tabla-de-equivalencia page
    par: [4,4,4,4,4,4,3,4,4, 4,4,5,3,5,3,4,4,4],
    si:  [11,12,13,9,1,10,15,6,3, 7,2,5,18,4,17,14,16,8]
  },
  "La Cala Asia": {
    cr: 69.1, slope: 139,   // yellow, men - The Social Golfer (no official La Cala table found)
    par: [4,4,3,4,5,4,3,4,5, 5,3,4,4,4,4,5,3,4],
    si:  [12,16,18,2,10,4,14,8,6, 1,13,3,5,17,11,7,15,9]
  },
  "Santana": {
    cr: 70.0, slope: 132,   // yellow, men - club's handicap-scale page
    par: [4,3,4,5,4,4,3,5,4, 5,4,3,4,4,5,3,4,4],
    si:  [13,9,7,3,11,17,5,1,15, 4,8,10,14,18,6,16,12,2]
  }
};

// Day 1-5 in order. Filled into the Schedule tab while it has no valid courses.
const DEFAULT_SCHEDULE = ["Torrequebrada", "Calanova", "Cabopino", "La Cala Asia", "Santana"];

const PLAYERS = [
  "Alex Archer", "Ben Baxter", "Chris Carter", "Dan Dawson",
  "Ed Ellis", "Finn Foster", "Gary Grant", "Harry Hughes",
  "Ian Irwin", "Jack Jordan", "Kev Knight", "Liam Lowe",
  "Matt Moore", "Nick Nash", "Ollie Owen", "Pete Price"
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
