// ╔══════════════════════════════════════════════════════════════╗
// ║  TOUR SETTINGS - the only file to edit for a new customer    ║
// ║  Keep players, courses, schedule and leagues in step with    ║
// ║  the CONFIG section at the top of backend/Code.gs            ║
// ║  (backend/test/test.js checks they match).                   ║
// ╚══════════════════════════════════════════════════════════════╝
window.TOUR_CONFIG = {
  // Short id, unique per customer site - keeps each site's phone memory
  // (PIN, seen notifications) separate when sites share a domain.
  id: 'tos-portugal-27',

  // Header: big title + small gold line under it. Also used for the browser tab.
  title: "TAM O'SHANTER",
  subtitle: 'Overseas Golf · Portugal 26',

  // Google Apps Script web app URL (ends /exec) - see backend/SETUP.md.
  webAppUrl: 'https://script.google.com/macros/s/AKfycbxpHz6rLlwPbPfzyfWvv8JbaRbH5DJS0Cue-JW1F7g2koPB01_sNRwOkt01ED6kAp6W/exec',

  // Score card PIN: only a salted SHA-256 lives here (sites are public).
  // New PIN:  node -e "console.log(require('crypto').createHash('sha256').update('<salt><pin>').digest('hex'))"
  // and set the same PIN as Script Property CARD_PIN on the sheet's script.
  // Salted hash of the card PIN; the PIN itself is only the sheet's Script Property CARD_PIN.
  pinSalt: 'tos-portugal-27:',
  pinHash: '526ab8722e8a533959519f5b4bd9d0326fd8430cfa6c5fb36c90f3419da1a2fb',

  // Players, in the order they appear in the dropdowns.
  players: [
    'Bernie', 'Paul', 'Mike', 'Dave W', 'Jay', 'Billy', 'Robbie', 'Steve', 'Dava', 'John'
  ],

  // Day 1, Day 2, ... - course keys from the library below. The number of
  // entries sets the number of day tabs.
  schedule: ['Salgados', 'Vale do Lobo Royal', 'Ombria'],

  // Home page. Badge, champions card and photos are optional (null / []).
  badge: { src: 'img/tam-oshanter-logo.svg', alt: "Tam O'Shanter Overseas Golf - Portugal 26" },
  champions: null,
  // champions: { title: 'Champions', photo: 'img/champs.jpg', current: 'Name', past: 'Name' },
  photos: [],
  // photos: [{ title: 'Tour 2026', src: 'img/tour-2026.jpg', alt: 'The 2026 squad' }],
  sponsors: [],
  // sponsors: [{ name: 'Sponsor Ltd', url: 'https://www.example.com/', logo: 'img/sponsors/sponsor.svg' }],

  // Course library: yellow tees in metres, [hole, metres, par, stroke index],
  // plus the yellow-tee (men's) course rating and slope.
  courses: {
    "Salgados": {
      name: "Salgados Golf",   // yellow tees, metres, par, SI - Portuguese federation scorecard (scoring-pt.datagolf.pt, course 017-1)
      cr: 71.2, slope: 124,   // yellow, men - same federation card
      holes: [
        // Front 9:  [hole, yellow(m), par, si]
        [ 1, 270, 4, 11],
        [ 2, 455, 5,  3],
        [ 3, 150, 3, 15],
        [ 4, 343, 4,  9],
        [ 5, 358, 4,  7],
        [ 6, 480, 5,  1],
        [ 7, 375, 4,  5],
        [ 8, 106, 3, 17],
        [ 9, 314, 4, 13],
        // Back 9:
        [10, 351, 4,  8],
        [11, 285, 4, 12],
        [12, 115, 3, 18],
        [13, 265, 4, 10],
        [14, 455, 5,  6],
        [15, 502, 5,  2],
        [16, 291, 4, 14],
        [17, 160, 3, 16],
        [18, 340, 4,  4]
      ]
    },
    "Vale do Lobo Royal": {
      name: "Vale do Lobo - Royal Course",   // yellow tees, metres, par, SI - valedolobo.com Royal course page
      cr: 70.7, slope: 129,   // yellow, men - club/FPG handicap table (2024_Golf_Handicaps_RGC.pdf)
      holes: [
        // Front 9:  [hole, yellow(m), par, si]
        [ 1, 360, 5, 15],
        [ 2, 261, 4, 13],
        [ 3, 370, 4,  3],
        [ 4, 288, 4, 11],
        [ 5, 450, 5,  7],
        [ 6, 375, 4,  1],
        [ 7, 126, 3, 17],
        [ 8, 365, 4,  5],
        [ 9, 133, 3,  9],
        // Back 9:
        [10, 315, 4, 16],
        [11, 473, 5,  2],
        [12, 299, 4, 12],
        [13, 341, 4,  4],
        [14, 327, 4,  6],
        [15, 282, 4, 18],
        [16, 190, 3, 10],
        [17, 346, 4,  8],
        [18, 295, 4, 14]
      ]
    },
    "Ombria": {
      name: "Ombria Golf Course",   // yellow tees, metres, par, SI - Portuguese federation scorecard (scoring-pt.datagolf.pt, course 113-1)
      cr: 68.6, slope: 127,   // yellow, men - same federation card
      holes: [
        // Front 9:  [hole, yellow(m), par, si]
        [ 1, 418, 5,  5],
        [ 2, 447, 5,  3],
        [ 3, 314, 4, 17],
        [ 4, 125, 3, 13],
        [ 5, 163, 3, 15],
        [ 6, 423, 5,  7],
        [ 7, 149, 3,  9],
        [ 8, 275, 4, 11],
        [ 9, 363, 4,  1],
        // Back 9:
        [10, 375, 4,  4],
        [11, 163, 3,  8],
        [12, 451, 5,  2],
        [13, 136, 3, 14],
        [14, 320, 4, 16],
        [15, 297, 4,  6],
        [16, 493, 5, 10],
        [17, 164, 3, 12],
        [18, 274, 4, 18]
      ]
    }
  }
};
