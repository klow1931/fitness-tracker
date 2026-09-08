/* Loadnote Coach backend v0.5 — minimal secure proxy for an OpenAI-compatible API.
 * Run with: LOADNOTE_AI_API_KEY=... LOADNOTE_AI_BASE_URL=https://api.x.ai/v1 LOADNOTE_AI_MODEL=grok-2-latest node backend/server.js
 * The browser never receives the provider secret. This server is intentionally dependency-free.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.LOADNOTE_AI_API_KEY || '';
const BASE_URL = (process.env.LOADNOTE_AI_BASE_URL || 'https://api.x.ai/v1').replace(/\/$/, '');
const MODEL = process.env.LOADNOTE_AI_MODEL || 'grok-2-latest';
const ROOT = path.resolve(__dirname, '..');
const MAX_BODY = 256 * 1024;

function send(res, status, body, type='application/json') {
  res.writeHead(status, { 'Content-Type': type, 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store' });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > MAX_BODY) { reject(new Error('Request too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}
async function coach(req, res) {
  if (!API_KEY) return send(res, 503, { error: 'Server AI key is not configured.' });
  const body = await parseBody(req);
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) return send(res, 400, { error: 'messages are required' });
  const upstream = await fetch(BASE_URL + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
    body: JSON.stringify({ model: MODEL, messages: messages.slice(-14), temperature: 0.4 })
  });
  const text = await upstream.text();
  res.writeHead(upstream.status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(text);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }); return res.end(); }
  try {
    if (req.method === 'GET' && req.url === '/api/health') return send(res, 200, { ok: true, aiConfigured: !!API_KEY, model: MODEL });
    if (req.method === 'POST' && req.url === '/api/coach') return await coach(req, res);
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      const html = fs.readFileSync(path.join(ROOT, 'index.html'));
      return send(res, 200, html.toString(), 'text/html; charset=utf-8');
    }
    if (req.method === 'GET') {
      const safe = path.normalize(req.url.split('?')[0]).replace(/^[/\\]+/, '');
      const file = path.join(ROOT, safe);
      if (file.startsWith(ROOT) && fs.existsSync(file) && fs.statSync(file).isFile()) return send(res, 200, fs.readFileSync(file), 'application/octet-stream');
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) { send(res, 500, { error: e.message || 'Server error' }); }
});
server.listen(PORT, () => console.log(`Loadnote backend listening on http://localhost:${PORT}`));
