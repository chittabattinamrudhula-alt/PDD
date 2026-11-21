'use strict';
/**
 * PropAI Enterprise Excel Reporter
 * Generates Automation_Test_Report.xlsx with 6 sheets:
 *   Sheet 1 — Executive Summary
 *   Sheet 2 — All Test Cases (430 cases)
 *   Sheet 3 — Execution Results
 *   Sheet 4 — Failed Tests Analysis
 *   Sheet 5 — Passed Tests
 *   Sheet 6 — Module Summary + Metrics
 */
const ExcelJS  = require('exceljs');
const path     = require('path');
const fs       = require('fs');
const moment   = require('moment');
const minimist = require('minimist');
const config   = require('../config/config');
const logger   = require('./logger');

const excelDir = path.join(__dirname, '../reports/excel');
const jsonDir  = path.join(__dirname, '../reports/json');
[excelDir, jsonDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── In-memory result store ───────────────────────────────────────────────────
const _results = [];

// ── Color palette ─────────────────────────────────────────────────────────────
const C = {
  darkBg:    'FF0F0C1A',
  headerBg:  'FF059669',
  failBg:    'FFDC2626',
  warnBg:    'FFD97706',
  passGreen: 'FF16A34A',
  passLight: 'FFF0FDF4',
  failLight: 'FFFFF1F2',
  skipLight: 'FFFFFBEB',
  altRow:    'FFF9FAFB',
  border:    'FFE5E7EB',
  textWhite: 'FFFFFFFF',
  textGray:  'FF6B7280',
  purple:    'FF8B5CF6',
  cyan:      'FF06B6D4',
};

function hdr(bg = C.headerBg) {
  return {
    font: { bold: true, color: { argb: C.textWhite }, size: 11, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: { top: bs(), left: bs(), bottom: bs(), right: bs() },
  };
}
function bs(c = 'FF047857') { return { style: 'thin', color: { argb: c } }; }
function cell(align = 'left') {
  return {
    alignment: { vertical: 'middle', horizontal: align, wrapText: true },
    border: { top: bs(C.border), left: bs(C.border), bottom: bs(C.border), right: bs(C.border) },
  };
}
function statusStyle(s) {
  if (s === 'PASSED')  return { font: { bold: true, color: { argb: C.passGreen }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.passLight } }, alignment: { horizontal: 'center' } };
  if (s === 'FAILED')  return { font: { bold: true, color: { argb: C.failBg }, size: 10 },    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.failLight } }, alignment: { horizontal: 'center' } };
  return { font: { bold: true, color: { argb: C.warnBg }, size: 10 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.skipLight } }, alignment: { horizontal: 'center' } };
}
function priStyle(p) {
  const c = p === 'Critical' ? C.failBg : p === 'High' ? C.warnBg : C.passGreen;
  return { font: { bold: true, color: { argb: c }, size: 10 }, alignment: { horizontal: 'center' } };
}

// ── Build complete 430-case master list ───────────────────────────────────────
function buildMasterList() {
  const suites = [
    { module: 'Authentication',    prefix: 'TC-AUTH', count: 40, category: 'Authentication',    types: { 1:'Landing', 6:'Login UI', 13:'Login Validation', 21:'Signup Form', 31:'Buyer Role', 36:'Seller Role', 39:'Admin Role' }, pris: { 1:'Critical', 6:'High', 13:'Critical', 21:'High', 31:'Critical', 36:'High', 39:'Critical' } },
    { module: 'Navigation',        prefix: 'TC-NAV',  count: 30, category: 'Navigation',        types: { 1:'Tab Navigation', 11:'Rapid Nav', 15:'Logout', 21:'Role-Nav', 24:'Landing Nav' }, pris: { 1:'High', 11:'Medium', 15:'High', 21:'High', 24:'Medium' } },
    { module: 'UI Validation',     prefix: 'TC-UI',   count: 50, category: 'UI/UX Validation',  types: { 1:'Landing UI', 11:'Dashboard UI', 21:'Properties UI', 26:'Valuation UI', 31:'Profile UI', 41:'Add Listing UI', 46:'Bookings UI' }, pris: { 1:'High', 11:'High', 21:'High', 31:'Medium', 41:'High', 46:'High' } },
    { module: 'Forms',             prefix: 'TC-FORM', count: 50, category: 'Forms',             types: { 1:'Login Form', 11:'Signup Form', 26:'Add Listing Form', 41:'Valuation Form' }, pris: { 1:'High', 11:'High', 26:'High', 41:'High' } },
    { module: 'CRUD Operations',   prefix: 'TC-CRUD', count: 50, category: 'CRUD Operations',   types: { 1:'Create User', 6:'Read Properties', 16:'Create Listing', 26:'Create Booking', 36:'Update Approval', 46:'Read Ledger' }, pris: { 1:'Critical', 6:'High', 16:'Critical', 26:'Critical', 36:'Critical', 46:'High' } },
    { module: 'Input Validation',  prefix: 'TC-VAL',  count: 40, category: 'Input Validation',  types: { 1:'Login Val', 11:'Signup Val', 21:'Listing Val', 29:'Valuation Boundary', 39:'General Val' }, pris: { 1:'Critical', 11:'High', 21:'High', 29:'High', 39:'Medium' } },
    { module: 'Error Handling',    prefix: 'TC-ERR',  count: 20, category: 'Error Handling',    types: { 1:'Auth Errors', 7:'App Errors', 11:'Console Errors', 17:'Edge Errors' }, pris: { 1:'High', 7:'Medium', 11:'Medium', 17:'Low' } },
    { module: 'Session Mgmt',      prefix: 'TC-SES',  count: 20, category: 'Session Management',types: { 1:'Login Session', 7:'Role Session', 11:'Refresh Session', 17:'Currency Session' }, pris: { 1:'Critical', 7:'High', 11:'Medium', 17:'Low' } },
    { module: 'File Upload',       prefix: 'TC-UPL',  count: 20, category: 'File Upload',       types: { 1:'Upload UI', 7:'Upload Function', 11:'Image Display', 17:'Upload Edge Cases' }, pris: { 1:'High', 7:'High', 11:'Medium', 17:'Low' } },
    { module: 'Accessibility',     prefix: 'TC-ACC',  count: 20, category: 'Accessibility',     types: { 1:'Semantic HTML', 5:'Form A11y', 11:'Navigation A11y', 17:'Visual A11y' }, pris: { 1:'High', 5:'High', 11:'Medium', 17:'Low' } },
    { module: 'Responsive Design', prefix: 'TC-RES',  count: 20, category: 'Responsive Design', types: { 1:'Desktop', 5:'Tablet', 10:'Mobile', 15:'Layout Reflow', 19:'Cross-Viewport' }, pris: { 1:'High', 5:'High', 10:'High', 15:'Medium', 19:'Low' } },
    { module: 'Performance',       prefix: 'TC-PERF', count: 20, category: 'Performance Smoke', types: { 1:'Page Load', 7:'Tab Speed', 11:'Interaction Speed', 16:'Memory' }, pris: { 1:'High', 7:'High', 11:'Medium', 16:'Low' } },
    { module: 'Regression',        prefix: 'TC-REG',  count: 50, category: 'Regression',        types: { 1:'Core Stability', 11:'Seller Flow', 21:'Buyer Flow', 31:'Admin Flow', 41:'Feature-specific' }, pris: { 1:'Critical', 11:'High', 21:'High', 31:'High', 41:'Medium' } },
  ];

  const cases = [];
  suites.forEach(s => {
    for (let n = 1; n <= s.count; n++) {
      const subType  = Object.entries(s.types).reverse().find(([k]) => parseInt(k) <= n)?.[1] || 'General';
      const priority = Object.entries(s.pris).reverse().find(([k])  => parseInt(k) <= n)?.[1] || 'Medium';
      cases.push({
        testId:   `${s.prefix}-${String(n).padStart(3,'0')}`,
        module:   s.module,
        category: s.category,
        subType,
        priority,
        status:   'Pending',
        precondition: `Browser open, app loaded at ${config.baseUrl}`,
        expectedResult: 'Test passes without errors on the LIVE GitHub Pages deployment',
      });
    }
  });
  return cases;
}

// ── Main generator ────────────────────────────────────────────────────────────
const ExcelReporter = {
  addResult(r) {
    _results.push({ ...r, timestamp: new Date().toISOString() });
  },

  clearResults() { _results.length = 0; },

  async generateReport(options = {}) {
    const env     = options.env     || options.suite || config.environment || 'GitHub Pages';
    const browser = options.browser || config.browser || 'Chrome';
    const url     = options.url     || config.baseUrl;
    const run     = options.run     || config.github.runNumber;
    const ts      = moment().format('YYYY-MM-DDTHHmmss');
    const fname   = `Automation_Test_Report_PropAI_${ts}.xlsx`;
    const fpath   = path.join(excelDir, fname);

    const results = [..._results];
    const total   = results.length;
    const passed  = results.filter(r => r.status === 'PASSED').length;
    const failed  = results.filter(r => r.status === 'FAILED').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    const rate    = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
    const totalMs = results.reduce((s, r) => s + (r.duration || 0), 0);

    const wb = new ExcelJS.Workbook();
    wb.creator  = 'PropAI Automation Framework v3.0';
    wb.company  = 'PropAI';
    wb.created  = new Date();
    wb.modified = new Date();

    // ── Sheet 1: Executive Summary ───────────────────────────────────────────
    const s1 = wb.addWorksheet('Executive Summary');
    s1.mergeCells('A1:H1');
    Object.assign(s1.getCell('A1'), {
      value: '🏠 PropAI — Automation Test Execution Report',
      style: { font: { bold: true, color: { argb: C.textWhite }, size: 20, name: 'Calibri' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: C.darkBg } }, alignment: { horizontal: 'center', vertical: 'middle' } }
    });
    s1.getRow(1).height = 50;

    s1.mergeCells('A2:H2');
    s1.getCell('A2').value = `Generated: ${moment().format('MMMM Do YYYY, h:mm:ss a')}  |  Environment: ${env}  |  Browser: ${browser}  |  URL: ${url}  |  Run: #${run}`;
    s1.getCell('A2').style = { font: { italic: true, color: { argb: C.textGray }, size: 10 }, alignment: { horizontal: 'center' } };

    // KPI Row
    const kpis = [
      { lbl: 'Total Tests',  val: total,    col: C.purple },
      { lbl: 'Passed ✅',    val: passed,   col: C.headerBg },
      { lbl: 'Failed ❌',    val: failed,   col: C.failBg },
      { lbl: 'Skipped ⚠️',  val: skipped,  col: C.warnBg },
      { lbl: 'Pass Rate',    val: rate+'%', col: parseFloat(rate) >= 95 ? C.headerBg : C.failBg },
      { lbl: 'Duration (s)', val: (totalMs/1000).toFixed(1), col: C.cyan },
      { lbl: 'Run #',        val: run,      col: C.purple },
      { lbl: 'Target URL',   val: url,      col: C.textGray },
    ];
    kpis.forEach((k, i) => {
      const col = String.fromCharCode(65 + i);
      s1.mergeCells(`${col}4:${col}5`);
      s1.getCell(`${col}4`).value = k.lbl;
      s1.getCell(`${col}4`).style = { font: { bold: true, color: { argb: C.textWhite }, size: 11 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: k.col } }, alignment: { horizontal: 'center', vertical: 'middle' } };
      s1.mergeCells(`${col}6:${col}7`);
      s1.getCell(`${col}6`).value = k.val;
      s1.getCell(`${col}6`).style = { font: { bold: true, size: 18 }, alignment: { horizontal: 'center', vertical: 'middle' }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } } };
    });
    s1.getRow(4).height = 28; s1.getRow(6).height = 40;

    // Module summary table
    const mHdrs = ['', 'Module', 'Category', 'Total', 'Passed', 'Failed', 'Skipped', 'Pass Rate'];
    s1.getRow(9).values = mHdrs;
    ['A9','B9','C9','D9','E9','F9','G9','H9'].forEach(c => { s1.getCell(c).style = hdr(); });
    const modMap = {};
    results.forEach(r => {
      const mod = r.module || 'Unknown';
      if (!modMap[mod]) modMap[mod] = { total:0, passed:0, failed:0, skipped:0, category: '' };
      modMap[mod].total++;
      if (r.status === 'PASSED')  modMap[mod].passed++;
      if (r.status === 'FAILED')  modMap[mod].failed++;
      if (r.status === 'SKIPPED') modMap[mod].skipped++;
    });
    let mr = 10;
    Object.entries(modMap).forEach(([mod, st]) => {
      const pct = ((st.passed/st.total)*100).toFixed(1) + '%';
      const row = s1.getRow(mr++);
      row.values = ['', mod, '', st.total, st.passed, st.failed, st.skipped, pct];
      row.eachCell(c => { c.style = cell('center'); });
    });
    s1.columns = [{ width:3 },{ width:22 },{ width:22 },{ width:10 },{ width:10 },{ width:10 },{ width:10 },{ width:14 }];

    // ── Sheet 2: All Test Cases ──────────────────────────────────────────────
    const s2 = wb.addWorksheet('All Test Cases (430)');
    s2.columns = [
      { header:'Test ID',      key:'testId',      width:16 },
      { header:'Module',       key:'module',      width:20 },
      { header:'Category',     key:'category',    width:24 },
      { header:'Sub-Type',     key:'subType',     width:22 },
      { header:'Priority',     key:'priority',    width:12 },
      { header:'Precondition', key:'precond',     width:40 },
      { header:'Expected Result', key:'expected', width:50 },
      { header:'Status',       key:'status',      width:14 },
    ];
    s2.getRow(1).eachCell(c => { c.style = hdr(); });
    const master = buildMasterList();
    const resultMap = {};
    results.forEach(r => {
      const idMatch = r.scenario?.match(/TC-[A-Z]+-\d+/);
      if (idMatch) resultMap[idMatch[0]] = r.status;
    });
    master.forEach((tc, i) => {
      tc.status = resultMap[tc.testId] || 'Pending';
      const row = s2.addRow({
        testId: tc.testId, module: tc.module, category: tc.category,
        subType: tc.subType, priority: tc.priority,
        precond: tc.precondition, expected: tc.expectedResult, status: tc.status,
      });
      row.getCell('priority').style = priStyle(tc.priority);
      row.getCell('status').style   = statusStyle(tc.status);
      if (i % 2 === 0) {
        ['testId','module','category','subType','precond','expected'].forEach(k => {
          row.getCell(k).style = { ...cell(), fill: { type:'pattern', pattern:'solid', fgColor:{ argb:C.altRow } } };
        });
      } else {
        ['testId','module','category','subType','precond','expected'].forEach(k => {
          row.getCell(k).style = cell();
        });
      }
    });

    // ── Sheet 3: Execution Results ───────────────────────────────────────────
    const s3 = wb.addWorksheet('Execution Results');
    s3.columns = [
      { header:'#',             key:'seq',      width:5  },
      { header:'Module',        key:'module',   width:20 },
      { header:'Test Scenario', key:'scenario', width:65 },
      { header:'Browser',       key:'browser',  width:12 },
      { header:'Status',        key:'status',   width:12 },
      { header:'Duration (ms)', key:'dur',      width:16 },
      { header:'Start Time',    key:'start',    width:22 },
      { header:'End Time',      key:'end',      width:22 },
      { header:'URL',           key:'url',      width:50 },
    ];
    s3.getRow(1).eachCell(c => { c.style = hdr(); });
    results.forEach((r, i) => {
      const row = s3.addRow({
        seq: i+1, module: r.module, scenario: r.scenario, browser,
        status: r.status, dur: r.duration||0, start: r.startTime||'', end: r.endTime||'', url: r.url||'',
      });
      row.getCell('status').style = statusStyle(r.status);
      ['seq','module','scenario','browser','dur','start','end','url'].forEach(k => {
        row.getCell(k).style = cell();
      });
    });

    // ── Sheet 4: Failed Tests ────────────────────────────────────────────────
    const s4 = wb.addWorksheet('Failed Tests Analysis');
    s4.columns = [
      { header:'Test Name',        key:'name',   width:60 },
      { header:'Module',           key:'mod',    width:20 },
      { header:'Failure Reason',   key:'reason', width:70 },
      { header:'Screenshot Path',  key:'ss',     width:55 },
      { header:'Browser',          key:'br',     width:12 },
      { header:'URL at Failure',   key:'url',    width:50 },
    ];
    s4.getRow(1).eachCell(c => { c.style = hdr(C.failBg); });
    const failedArr = results.filter(r => r.status === 'FAILED');
    if (failedArr.length === 0) {
      s4.addRow({ name:'🎉 All executed tests PASSED on the live GitHub Pages deployment!', mod:'', reason:'', ss:'', br: browser, url:'' });
    } else {
      failedArr.forEach(r => {
        const row = s4.addRow({ name: r.scenario||'', mod: r.module||'', reason: r.error||'Unknown', ss: r.screenshotPath||'N/A', br: browser, url: r.url||'' });
        row.eachCell(c => { c.style = { ...cell(), fill: { type:'pattern', pattern:'solid', fgColor:{ argb:C.failLight } } }; });
      });
    }

    // ── Sheet 5: Passed Tests ────────────────────────────────────────────────
    const s5 = wb.addWorksheet('Passed Tests');
    s5.columns = [
      { header:'Test Name',    key:'name',   width:65 },
      { header:'Module',       key:'mod',    width:20 },
      { header:'Duration (ms)',key:'dur',    width:16 },
      { header:'Timestamp',    key:'ts',     width:24 },
    ];
    s5.getRow(1).eachCell(c => { c.style = hdr(C.headerBg); });
    results.filter(r => r.status === 'PASSED').forEach(r => {
      const row = s5.addRow({ name: r.scenario, mod: r.module, dur: r.duration||0, ts: r.timestamp||'' });
      row.eachCell(c => { c.style = { ...cell(), fill: { type:'pattern', pattern:'solid', fgColor:{ argb:C.passLight } } }; });
    });

    // ── Sheet 6: Module Summary & Metrics ────────────────────────────────────
    const s6 = wb.addWorksheet('Summary & Metrics');
    s6.columns = [
      { header:'Module',          key:'mod',    width:22 },
      { header:'Category',        key:'cat',    width:24 },
      { header:'Total Tests',     key:'total',  width:14 },
      { header:'Passed',          key:'passed', width:12 },
      { header:'Failed',          key:'failed', width:12 },
      { header:'Skipped',         key:'skip',   width:12 },
      { header:'Pass Rate',       key:'rate',   width:12 },
      { header:'Avg Duration (ms)',key:'avg',   width:20 },
    ];
    s6.getRow(1).eachCell(c => { c.style = hdr(); });
    const modCats = { 'Authentication':'Authentication', 'Navigation':'Navigation', 'UI Validation':'UI/UX Validation', 'Forms':'Forms', 'CRUD Operations':'CRUD Operations', 'Input Validation':'Input Validation', 'Error Handling':'Error Handling', 'Session Mgmt':'Session Management', 'File Upload':'File Upload', 'Accessibility':'Accessibility', 'Responsive Design':'Responsive Design', 'Performance':'Performance Smoke', 'Regression':'Regression' };
    const durMap = {};
    results.forEach(r => {
      const mod = r.module||'Unknown';
      if (!durMap[mod]) durMap[mod] = [];
      durMap[mod].push(r.duration||0);
    });
    Object.entries(modMap).forEach(([mod, st]) => {
      const pct  = ((st.passed/st.total)*100).toFixed(1)+'%';
      const durs = durMap[mod] || [];
      const avg  = durs.length > 0 ? Math.round(durs.reduce((a,b)=>a+b,0)/durs.length) : 0;
      const row  = s6.addRow({ mod, cat: modCats[mod]||'', total: st.total, passed: st.passed, failed: st.failed, skip: st.skipped, rate: pct, avg });
      row.eachCell(c => { c.style = cell('center'); });
    });

    // Save
    await wb.xlsx.writeFile(fpath);
    logger.info(`✅ Excel report saved: ${fpath}`);

    // Also save JSON summary
    const jsonPath = path.join(jsonDir, `${options.suite || 'all'}-results.json`);
    fs.writeFileSync(jsonPath, JSON.stringify({
      suite: options.suite || 'all', browser, env, url, run,
      timestamp: new Date().toISOString(),
      total, passed, failed, skipped,
      passRate: rate,
      duration: (totalMs/1000).toFixed(1),
      reportFile: fname,
    }, null, 2));

    return fpath;
  }
};

module.exports = ExcelReporter;

// ── CLI usage ─────────────────────────────────────────────────────────────────
if (require.main === module) {
  const args = minimist(process.argv.slice(2));
  ExcelReporter.generateReport({
    suite: args.suite || 'ALL',
    browser: args.browser || 'Chrome',
    env: args.env || 'GitHub Pages',
    url: args.url || config.baseUrl,
    run: args.run || '1',
  }).then(p => {
    console.log(`📊 Report: ${p}`);
    process.exit(0);
  }).catch(e => {
    console.error(e.message);
    process.exit(1);
  });
}
