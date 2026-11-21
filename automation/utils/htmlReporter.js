'use strict';
/**
 * PropAI HTML Report Generator
 * Generates reports/html/dashboard.html — a standalone rich dashboard
 */
const fs      = require('fs');
const path    = require('path');
const moment  = require('moment');
const config  = require('../config/config');

const htmlDir = path.join(__dirname, '../reports/html');
const jsonDir = path.join(__dirname, '../reports/json');
if (!fs.existsSync(htmlDir)) fs.mkdirSync(htmlDir, { recursive: true });

function generateDashboard(results = [], opts = {}) {
  const env     = opts.env  || 'GitHub Pages';
  const browser = opts.browser || 'Chrome';
  const url     = opts.url  || config.baseUrl;
  const run     = opts.run  || config.github.runNumber;
  const ts      = moment().format('MMMM Do YYYY, h:mm:ss a');

  const total   = results.length;
  const passed  = results.filter(r => r.status === 'PASSED').length;
  const failed  = results.filter(r => r.status === 'FAILED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const rate    = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

  // Module breakdown
  const modMap = {};
  results.forEach(r => {
    const m = r.module || 'Unknown';
    if (!modMap[m]) modMap[m] = { passed: 0, failed: 0, skipped: 0 };
    if (r.status === 'PASSED')  modMap[m].passed++;
    if (r.status === 'FAILED')  modMap[m].failed++;
    if (r.status === 'SKIPPED') modMap[m].skipped++;
  });

  const moduleRows = Object.entries(modMap).map(([mod, s]) => {
    const t = s.passed + s.failed + s.skipped;
    const r = t > 0 ? ((s.passed/t)*100).toFixed(1) : '0.0';
    const color = parseFloat(r) >= 95 ? '#059669' : parseFloat(r) >= 80 ? '#D97706' : '#DC2626';
    return `<tr><td>${mod}</td><td>${t}</td><td style="color:#059669">${s.passed}</td><td style="color:#DC2626">${s.failed}</td><td><span style="color:${color};font-weight:700">${r}%</span></td></tr>`;
  }).join('');

  const failedRows = results.filter(r => r.status === 'FAILED').slice(0, 50).map(r =>
    `<tr><td>${r.scenario || ''}</td><td>${r.module || ''}</td><td style="color:#FCA5A5">${(r.error || '').substring(0, 100)}</td></tr>`
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PropAI E2E Test Dashboard — Run #${run}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',system-ui,sans-serif;background:#0F0C1A;color:#F3F4F6;padding:24px}
  h1{font-size:1.8rem;background:linear-gradient(135deg,#8B5CF6,#06B6D4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
  .sub{color:#9CA3AF;font-size:.85rem;margin-bottom:24px}
  .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-bottom:32px}
  .kpi{background:rgba(20,16,43,.8);border:1px solid rgba(139,92,246,.2);border-radius:16px;padding:20px;text-align:center}
  .kpi .num{font-size:2.4rem;font-weight:800;line-height:1}
  .kpi .lbl{font-size:.8rem;color:#9CA3AF;margin-top:6px;text-transform:uppercase;letter-spacing:.05em}
  .pass-bar{background:#374151;border-radius:8px;height:12px;overflow:hidden;margin:16px 0}
  .pass-fill{height:100%;border-radius:8px;background:linear-gradient(90deg,#059669,#06B6D4)}
  .card{background:rgba(20,16,43,.8);border:1px solid rgba(139,92,246,.2);border-radius:16px;padding:24px;margin-bottom:24px}
  .card h2{font-size:1.1rem;color:#C4B5FD;margin-bottom:16px;border-bottom:1px solid rgba(255,255,255,.08);padding-bottom:8px}
  table{width:100%;border-collapse:collapse;font-size:.85rem}
  th{background:#1E1B4B;color:#C4B5FD;padding:10px 12px;text-align:left;font-weight:600}
  td{padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.05);color:#D1D5DB}
  tr:hover td{background:rgba(139,92,246,.05)}
  .badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:.75rem;font-weight:700}
  .passed{background:rgba(5,150,105,.15);color:#6EE7B7;border:1px solid rgba(5,150,105,.3)}
  .failed{background:rgba(220,38,38,.15);color:#FCA5A5;border:1px solid rgba(220,38,38,.3)}
  .footer{text-align:center;color:#6B7280;font-size:.8rem;margin-top:40px}
  a{color:#06B6D4}
</style>
</head>
<body>
<h1>🏠 PropAI E2E Test Dashboard</h1>
<div class="sub">Run #${run} &nbsp;|&nbsp; ${ts} &nbsp;|&nbsp; <a href="${url}" target="_blank">${url}</a> &nbsp;|&nbsp; ${browser}</div>

<div class="kpi-grid">
  <div class="kpi"><div class="num" style="color:#8B5CF6">${total}</div><div class="lbl">Total Tests</div></div>
  <div class="kpi"><div class="num" style="color:#059669">${passed}</div><div class="lbl">Passed</div></div>
  <div class="kpi"><div class="num" style="color:#DC2626">${failed}</div><div class="lbl">Failed</div></div>
  <div class="kpi"><div class="num" style="color:#D97706">${skipped}</div><div class="lbl">Skipped</div></div>
  <div class="kpi"><div class="num" style="color:${parseFloat(rate)>=95?'#059669':'#DC2626'}">${rate}%</div><div class="lbl">Pass Rate</div></div>
</div>

<div class="pass-bar"><div class="pass-fill" style="width:${rate}%"></div></div>

<div class="card">
  <h2>📊 Module Breakdown</h2>
  <table>
    <tr><th>Module</th><th>Total</th><th>Passed</th><th>Failed</th><th>Pass Rate</th></tr>
    ${moduleRows || '<tr><td colspan="5" style="text-align:center;color:#6B7280">No results yet</td></tr>'}
  </table>
</div>

${failed > 0 ? `<div class="card">
  <h2>❌ Failed Tests (top 50)</h2>
  <table>
    <tr><th>Test Name</th><th>Module</th><th>Failure Reason</th></tr>
    ${failedRows}
  </table>
</div>` : '<div class="card"><h2>🎉 All Tests Passed!</h2><p style="color:#6EE7B7;padding:12px 0">No failed tests in this execution.</p></div>'}

<div class="footer">
  Generated by PropAI Enterprise CI/CD v3.0 &nbsp;|&nbsp; Environment: ${env} &nbsp;|&nbsp;
  <a href="https://github.com/${config.github.repo}/actions" target="_blank">View GitHub Actions</a>
</div>
</body>
</html>`;

  const fpath = path.join(htmlDir, 'dashboard.html');
  fs.writeFileSync(fpath, html);
  console.log(`✅ Dashboard: ${fpath}`);
  return fpath;
}

module.exports = { generateDashboard };

if (require.main === module) {
  const minimist = require('minimist');
  const args = minimist(process.argv.slice(2));
  // Try to load results from JSON
  let results = [];
  try {
    const files = fs.existsSync(jsonDir) ? fs.readdirSync(jsonDir).filter(f => f.endsWith('.json')) : [];
    files.forEach(f => {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(jsonDir, f)));
        if (Array.isArray(d.results)) results = results.concat(d.results);
      } catch {}
    });
  } catch {}
  generateDashboard(results, { env: args.env, browser: args.browser, url: args.url, run: args.run });
}
