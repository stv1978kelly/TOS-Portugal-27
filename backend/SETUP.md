# Tam O'Shanter Overseas Golf - Portugal 27 - setup

Built from the golf-tour-app template: 3 days (Salgados, Vale do Lobo Royal,
Ombria), 10 players, the template's league rules unchanged. The rule tests
(`test.js`) run against the template's sample CONFIG in `test/fixture/`;
`tour.js` checks this tour's own courses, players and schedule.

## About the app

A multi-day Stableford golf tour app: a phone-friendly score card behind a
PIN, live daily and overall leaderboards, course handicaps from each course's
rating and slope, optional daily handicap adjustments ("leagues"),
notifications, and a Home page with champions, photos and sponsors.

The page (`index.html` + `config.js`) is a static site (GitHub Pages). Cards
are saved to a Google Sheet through a small Apps Script (`backend/Code.gs`),
which also works out the points, handicaps and leaderboards.

## New customer checklist

1. **Copy this repo** to a new repo for the customer (e.g. `<customer>-tour`).
   Never reuse another customer's sheet or PIN.
2. **Edit `config.js`** - everything customer-specific lives there:
   - `id` (short and unique - keeps each site's phone memory separate)
   - `title`, `subtitle` (the header)
   - `players`, `schedule` (Day 1, Day 2, ... - course keys from the library)
   - `champions`, `photos`, `sponsors` (optional; images go in `img/`)
   - `courses`: add any new course as one block (yellow-tee metres, par,
     stroke index, plus the course rating and slope from the club's handicap
     table)
3. **Edit the CONFIG block at the top of `backend/Code.gs`** to match:
   `PLAYERS`, `COURSES` (par / SI / rating / slope), `DEFAULT_SCHEDULE`, and
   the league rules (`ADJUST_HANDICAPS`, `CUT_ABOVE`, `ADD_BELOW`, `LEAGUES`, `WINNER_SHOT`, `LAST_SHOT`, `MAX_MOVE`).
   Each league's `below` means "handicaps under this number": the default
   `10` / `18` / `Infinity` gives League 1 up to 9.9, League 2 from 10 to 17.9,
   League 3 from 18 up.
4. **Run the tests**: `node backend/test/test.js && node backend/test/tour.js`.
   `tour.js` fails if `config.js` and `Code.gs` disagree.
5. **Make the sheet** (about 2 minutes):
   1. Go to <https://sheets.new> and name it after the tour.
   2. **Extensions > Apps Script**: delete everything, paste all of
      `Code.gs`, **Save**.
   3. **Deploy > New deployment**, cog > **Web app**, Execute as **Me**, Who
      has access **Anyone**, **Deploy**, and authorise it (if Google says it
      hasn't verified the app: **Advanced > Go to (project name)**).
   4. Copy the **Web app URL** (ends `/exec`) into `webAppUrl` in `config.js`.
   5. Open that URL with `?action=leaderboard` on the end: you should see
      `{"ok":true,...}` and the sheet gains its tabs.
6. **Set the card PIN** (step-by-step - the first attempt often doesn't save):
   1. In Apps Script: **Project Settings** (cog) > **Script Properties** >
      **Add script property**. Property `CARD_PIN`, value = the PIN.
      Click **Save script properties** and check it is listed.
   2. Put the PIN's salted hash in `config.js` (`pinSalt` + `pinHash`):
      `node -e "console.log(require('crypto').createHash('sha256').update('<salt><pin>').digest('hex'))"`
   3. Never write the PIN itself into the repo - sites are public.
7. **Fill the sheet**: Players tab = starting handicaps; Schedule fills
   itself from `DEFAULT_SCHEDULE`; Settings = allowance.
8. **Publish**: push the repo and turn on GitHub Pages (branch `main`, root).

## Running the tour

| Tab | What to do |
|---|---|
| **Schedule** | Each day's course (dropdown). Fill in **Date** only if a course is played on two days. |
| **Players** | Each player's **starting handicap**. Don't change it during the tour: if `ADJUST_HANDICAPS` is on, the script adjusts it after every played day (by the `LEAGUES` rates: cut per point over `CUT_ABOVE`, add per point under `ADD_BELOW`; the day's winner gets `WINNER_SHOT` off and last place `LAST_SHOT` on; the whole move is capped at `MAX_MOVE` a day; no card = no change). |
| **Settings** | Allowance: `1` (or `100`) for full course handicap, `0.95` (or `95`) for 95%. |
| **Notifications** | Type a message in **Message**; **Posted** fills itself. Shows on everyone's bell and as a banner for 24 hours. Delete the row to remove it. |
| **Cards** | Filled automatically. A resubmitted card for the same player and course replaces the old one. |

Points and handicaps are always recalculated from the raw scores, so changing
a handicap, the allowance or the schedule updates every leaderboard at once.

## Changing the script later

After pasting a new `Code.gs`: **Deploy > Manage deployments > pencil >
Version: New version > Deploy**. The URL stays the same.

## Testing locally (no Google needed)

```
node backend/test/test.js                    # the real Code.gs against a fake sheet
DEMO_PIN=0000 node backend/test/server.js    # full working site at http://127.0.0.1:8812
DEMO_PIN=0000 node backend/test/seed.js      # optional: 3 days of sample cards
```

The demo hash in `config.js` is for PIN `0000`.
