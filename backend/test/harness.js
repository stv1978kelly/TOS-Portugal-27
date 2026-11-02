// Runs the real backend/Code.gs against an in-memory fake of Google Sheets.
const fs = require('fs');
const vm = require('vm');
const REPO = require('path').join(__dirname, '..', '..');

// Default: Code.gs with the template's sample CONFIG (test/fixture/config.gs) swapped in,
// so the rule tests stay the template's. { real: true } runs Code.gs exactly as it is.
function makeContext(opts = {}) {
  const sheets = {};
  const props = {};
  const mkSheet = name => {
    const data = [];
    const sh = {
      name, data,
      getName: () => name,
      getRange(r, c, nr, nc) {
        return {
          setValues(vals) {
            for (let i = 0; i < nr; i++) {
              data[r - 1 + i] = data[r - 1 + i] || [];
              for (let j = 0; j < nc; j++) data[r - 1 + i][c - 1 + j] = vals[i][j];
            }
            return this;
          },
          setFontWeight() { return this; },
          getValue() { return (data[r - 1] || [])[c - 1] ?? ''; },
          setValue(v) { data[r - 1] = data[r - 1] || []; data[r - 1][c - 1] = v; return this; },
          setDataValidation(v) { sh.validation = { r, c, nr, nc, v }; return this; },
          getValues() { return Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => ((data[r - 1 + i] || [])[c - 1 + j] ?? ''))); }
        };
      },
      getDataRange() { return { getValues: () => data.map(r => r.slice()) }; },
      appendRow(row) { data.push(row.slice()); },
      setFrozenRows() {}
    };
    return sh;
  };
  const ss = {
    getSheetByName: n => sheets[n] || null,
    insertSheet: n => (sheets[n] = mkSheet(n))
  };
  const ctx = {
    console, JSON, Math, Date, Number, String, Array, Object, isNaN,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ss,
      newDataValidation() {
        const v = {};
        const b = { requireValueInList(list, show) { v.list = list; v.show = show; return b; }, setAllowInvalid(a) { v.allowInvalid = a; return b; }, build: () => v };
        return b;
      }
    },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: s => ({ body: s, setMimeType() { return this; } })
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null) }) },
    Utilities: {
      formatDate: (d, tz) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
    }
  };
  vm.createContext(ctx);
  let src = fs.readFileSync(REPO + '/backend/Code.gs', 'utf8');
  if (!opts.real) {
    const start = src.indexOf('CONFIG - edit per customer'), end = src.indexOf('end of CONFIG');
    const fixture = fs.readFileSync(REPO + '/backend/test/fixture/config.gs', 'utf8');
    src = src.slice(0, src.indexOf('\n', start) + 1) + fixture + src.slice(src.lastIndexOf('\n', end) + 1);
  }
  vm.runInContext(src, ctx);
  ctx.__sheets = sheets;
  ctx.__props = props;
  return ctx;
}

module.exports = { makeContext, REPO };
