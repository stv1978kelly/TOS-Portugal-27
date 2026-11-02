// ╔══════════════════════════════════════════════════════════════╗
// ║  TOUR SETTINGS - the only file to edit for a new customer    ║
// ║  Keep players, courses, schedule and leagues in step with    ║
// ║  the CONFIG section at the top of backend/Code.gs            ║
// ║  (backend/test/test.js checks they match).                   ║
// ╚══════════════════════════════════════════════════════════════╝
window.TOUR_CONFIG = {
  // Short id, unique per customer site - keeps each site's phone memory
  // (PIN, seen notifications) separate when sites share a domain.
  id: 'demo-tour',

  // Header: big title + small gold line under it. Also used for the browser tab.
  title: 'GOLF TOUR 2027',
  subtitle: 'Sample',

  // Google Apps Script web app URL (ends /exec) - see backend/SETUP.md.
  webAppUrl: 'PASTE_NEW_WEBAPP_URL',

  // Score card PIN: only a salted SHA-256 lives here (sites are public).
  // New PIN:  node -e "console.log(require('crypto').createHash('sha256').update('<salt><pin>').digest('hex'))"
  // and set the same PIN as Script Property CARD_PIN on the sheet's script.
  // This demo hash is for PIN 0000 - CHANGE IT for a real customer.
  pinSalt: 'demo:',
  pinHash: 'f735de5c668a3ac3d297e32cef3e0a897034d65c24fcdb309a6315760c96274a',

  // Players, in the order they appear in the dropdowns.
  players: [
    'Alex Archer', 'Ben Baxter', 'Chris Carter', 'Dan Dawson', 'Ed Ellis', 'Finn Foster', 'Gary Grant', 'Harry Hughes',
    'Ian Irwin', 'Jack Jordan', 'Kev Knight', 'Liam Lowe', 'Matt Moore', 'Nick Nash', 'Ollie Owen', 'Pete Price'
  ],

  // Day 1, Day 2, ... - course keys from the library below. The number of
  // entries sets the number of day tabs.
  schedule: ['Torrequebrada', 'Calanova', 'Cabopino', 'La Cala Asia', 'Santana'],

  // Home page. Champions card and photos are optional (null / []).
  champions: null,
  // champions: { title: 'Champions', photo: 'img/champs.jpg', current: 'Name', past: 'Name' },
  photos: [],
  // photos: [{ title: 'Tour 2026', src: 'img/tour-2026.jpg', alt: 'The 2026 squad' }],
  sponsors: [],
  // sponsors: [{ name: 'Sponsor Ltd', url: 'https://www.example.com/', logo: 'img/sponsors/sponsor.svg' }],

  // Course library: yellow tees in metres, [hole, metres, par, stroke index],
  // plus the yellow-tee (men's) course rating and slope.
  courses: {
    "Torrequebrada": {
      name: "Golf Torrequebrada",   // yellow tees, metres - club scorecard PDF, 2024
      cr: 70.9, slope: 139,   // yellow, men - EGA/WHS table valid 07/03/2023 (club PDF)
      holes: [
        // Front 9:  [hole, yellow(m), par, si]
        [ 1, 440, 5,  8],
        [ 2, 339, 4,  6],
        [ 3,  87, 3, 18],
        [ 4, 323, 4, 10],
        [ 5, 346, 4, 14],
        [ 6, 489, 5,  4],
        [ 7, 306, 4, 12],
        [ 8, 363, 4,  2],
        [ 9, 142, 3, 16],
        // Back 9:
        [10, 375, 4,  3],
        [11, 160, 3, 15],
        [12, 451, 5,  5],
        [13, 144, 3, 17],
        [14, 457, 5,  7],
        [15, 319, 4, 11],
        [16, 359, 4,  1],
        [17, 351, 4,  9],
        [18, 315, 4, 13]
      ]
    },
    "Calanova": {
      name: "Calanova Golf Club",   // yellow tees, metres - club scorecard PDF
      cr: 71.5, slope: 136,   // yellow, men - RFEG table 05/12/2015 (club slope.pdf)
      holes: [
        // Front 9:  [hole, yellow(m), par, si]
        [ 1, 487, 5,  9],
        [ 2, 350, 4,  5],
        [ 3, 327, 4, 13],
        [ 4, 311, 4, 11],
        [ 5, 368, 4,  1],
        [ 6, 163, 3,  7],
        [ 7, 339, 4, 15],
        [ 8, 146, 3, 17],
        [ 9, 434, 5,  3],
        // Back 9:
        [10, 455, 5,  6],
        [11, 349, 4,  4],
        [12, 251, 4, 18],
        [13, 150, 3, 12],
        [14, 528, 5,  2],
        [15, 291, 4,  8],
        [16, 374, 4, 10],
        [17, 146, 3, 16],
        [18, 304, 4, 14]
      ]
    },
    "Cabopino": {
      name: "Cabopino Golf Marbella",   // yellow tees, metres - club scorecard PDF
      cr: 69.1, slope: 130,   // yellow, men - club's tabla-de-equivalencia page
      holes: [
        // Front 9:  [hole, yellow(m), par, si]
        [ 1, 309, 4, 11],
        [ 2, 275, 4, 12],
        [ 3, 288, 4, 13],
        [ 4, 243, 4,  9],
        [ 5, 378, 4,  1],
        [ 6, 264, 4, 10],
        [ 7, 149, 3, 15],
        [ 8, 277, 4,  6],
        [ 9, 327, 4,  3],
        // Back 9:
        [10, 327, 4,  7],
        [11, 336, 4,  2],
        [12, 422, 5,  5],
        [13, 134, 3, 18],
        [14, 456, 5,  4],
        [15, 130, 3, 17],
        [16, 305, 4, 14],
        [17, 268, 4, 16],
        [18, 305, 4,  8]
      ]
    },
    "La Cala Asia": {
      name: "La Cala Resort - Asia",   // yellow tees, metres - La Cala official scorecard, 2022 (web archive)
      cr: 69.1, slope: 139,   // yellow, men - The Social Golfer (no official La Cala table found)
      holes: [
        // Front 9:  [hole, yellow(m), par, si]
        [ 1, 286, 4, 12],
        [ 2, 252, 4, 16],
        [ 3, 119, 3, 18],
        [ 4, 279, 4,  2],
        [ 5, 461, 5, 10],
        [ 6, 325, 4,  4],
        [ 7, 125, 3, 14],
        [ 8, 338, 4,  8],
        [ 9, 424, 5,  6],
        // Back 9:
        [10, 460, 5,  1],
        [11, 164, 3, 13],
        [12, 314, 4,  3],
        [13, 368, 4,  5],
        [14, 281, 4, 17],
        [15, 333, 4, 11],
        [16, 435, 5,  7],
        [17, 101, 3, 15],
        [18, 336, 4,  9]
      ]
    },
    "Santana": {
      name: "Santana Golf",   // yellow tees, metres - club scorecard page
      cr: 70.0, slope: 132,   // yellow, men - club's handicap-scale page
      holes: [
        // Front 9:  [hole, yellow(m), par, si]
        [ 1, 285, 4, 13],
        [ 2, 145, 3,  9],
        [ 3, 347, 4,  7],
        [ 4, 524, 5,  3],
        [ 5, 296, 4, 11],
        [ 6, 321, 4, 17],
        [ 7, 165, 3,  5],
        [ 8, 541, 5,  1],
        [ 9, 334, 4, 15],
        // Back 9:
        [10, 425, 5,  4],
        [11, 265, 4,  8],
        [12, 153, 3, 10],
        [13, 314, 4, 14],
        [14, 265, 4, 18],
        [15, 489, 5,  6],
        [16, 122, 3, 16],
        [17, 307, 4, 12],
        [18, 356, 4,  2]
      ]
    }
  }
};
