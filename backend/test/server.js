// Stand-in for the Apps Script web app + a copy of the page pointed at it.
// /exec behaves like the deployed script (CORS open, JSON replies).
const http = require('http');
const fs = require('fs');
const vm = require('vm');
const { makeContext, REPO } = require('./harness');

const PORT = 8812;
const ctx = makeContext({ real: true });
vm.runInContext('ensureSheets()', ctx);
// Demo card PIN: set DEMO_PIN in the environment (not stored in the repo).
if (process.env.DEMO_PIN) ctx.__props.CARD_PIN = process.env.DEMO_PIN;
// Demo notifications: one fresh (bannered), one three days old (listed only).
ctx.__sheets.Notifications.data.push([new Date(Date.now() - 3 * 3600e3), 'Bus to Salgados leaves the hotel at 8:15 sharp.']);
ctx.__sheets.Notifications.data.push([new Date(Date.now() - 72 * 3600e3), 'Welcome to the tour - scores go in after every round.']);

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/exec') {
    const reply = out => {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(out.body);
    };
    if (req.method === 'GET') return reply(ctx.doGet({ parameter: Object.fromEntries(url.searchParams) }));
    let body = '';
    req.on('data', c => (body += c));
    req.on('end', () => {
      console.log('POST', req.headers['content-type'], body);
      reply(ctx.doPost({ postData: { contents: body } }));
    });
    return;
  }
  if (url.pathname === '/cards') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(ctx.__sheets.Cards.data));
  }
  // Static files from the repo; config.js gets this stand-in's URL.
  const rel = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const file = require('path').join(REPO, rel);
  if (!file.startsWith(REPO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
  let body = fs.readFileSync(file);
  if (rel === '/config.js') body = body.toString().replace(/webAppUrl: '[^']*'/, "webAppUrl: 'http://127.0.0.1:" + PORT + "/exec'");
  res.writeHead(200, { 'Content-Type': types[require('path').extname(file)] || 'application/octet-stream' });
  res.end(body);
}).listen(PORT, '127.0.0.1', () => console.log('test server on ' + PORT));
