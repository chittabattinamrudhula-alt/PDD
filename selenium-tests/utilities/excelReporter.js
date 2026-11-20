/**
 * PropAI Enhanced Excel Reporter
 * Generates a comprehensive .xlsx report with:
 *   - Sheet 1: Executive Summary
 *   - Sheet 2: Test Case Master List (all 520 cases with categories)
 *   - Sheet 3: Execution Results
 *   - Sheet 4: Failed Tests Analysis
 *   - Sheet 5: Module-wise Summary
 *   - Sheet 6: Execution Logs
 */

const ExcelJS = require('exceljs');
const path    = require('path');
const fs      = require('fs');
const moment  = require('moment');
const logger  = require('./logger');
const config  = require('../config/selenium.config');

const excelDir = path.join(__dirname, '../reports/excel');
if (!fs.existsSync(excelDir)) fs.mkdirSync(excelDir, { recursive: true });

// ── Shared result store ───────────────────────────────────────────────────────
const results = [];
const failed  = [];

// ── Style helpers ─────────────────────────────────────────────────────────────
const styles = {
  header: {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: 'FF047857' } },
      left: { style: 'thin', color: { argb: 'FF047857' } },
      bottom: { style: 'thin', color: { argb: 'FF047857' } },
      right: { style: 'thin', color: { argb: 'FF047857' } }
    }
  },
  titleDark: {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 14, name: 'Calibri' },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1B4B' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  },
  passed: {
    font: { bold: true, color: { argb: 'FF16A34A' }, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } },
    alignment: { horizontal: 'center' }
  },
  failed: {
    font: { bold: true, color: { argb: 'FFDC2626' }, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } },
    alignment: { horizontal: 'center' }
  },
  skipped: {
    font: { bold: true, color: { argb: 'FFD97706' }, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } },
    alignment: { horizontal: 'center' }
  },
  cell: {
    alignment: { vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
    }
  }
};

// ── Complete test case master list (520 cases) ────────────────────────────────
function buildTestCaseMaster() {
  const cases = [];

  const suites = [
    {
      module: 'Auth', category: 'Functional Testing', range: [1, 60],
      types: { 1: 'Login', 31: 'Signup' },
      priorities: { 1: 'Critical', 11: 'Critical', 21: 'High', 31: 'Critical', 41: 'High', 51: 'Medium' }
    },
    {
      module: 'Dashboard', category: 'Functional Testing', range: [61, 160],
      types: { 61: 'Dashboard Stats', 91: 'Market Chart', 121: 'Property Cards', 141: 'Navigation' },
      priorities: { 61: 'High', 91: 'Medium', 121: 'High', 141: 'High' }
    },
    {
      module: 'Advanced', category: 'E2E / Integration', range: [161, 300],
      types: { 161: 'Valuation', 181: 'Add Listing', 191: 'Cross-Browser', 211: 'Data-Driven', 251: 'API Validation', 261: 'Reporting' },
      priorities: { 161: 'High', 181: 'High', 191: 'Medium', 211: 'High', 251: 'High', 261: 'Medium' }
    },
    {
      module: 'UI-UX', category: 'UI/UX Testing', range: [301, 360],
      types: { 301: 'Visual', 311: 'Glassmorphism', 315: 'Authenticated UI', 325: 'Responsive', 330: 'Typography', 335: 'Interactions', 341: 'Color Palette', 346: 'Accessibility', 351: 'Loading States' },
      priorities: { 301: 'Medium', 315: 'High', 325: 'High', 341: 'Medium', 346: 'High' }
    },
    {
      module: 'Functional', category: 'Functional Testing', range: [361, 440],
      types: { 361: 'Dashboard', 371: 'Properties', 378: 'Valuation AI', 388: 'Blockchain', 395: 'Bookings', 401: 'Add Property', 411: 'RBAC', 416: 'Navigation', 419: 'Currency', 424: 'API Integration', 429: 'Profile' },
      priorities: { 361: 'High', 395: 'Critical', 401: 'Critical', 411: 'Critical', 419: 'Medium' }
    },
    {
      module: 'Validation', category: 'Validation Testing', range: [441, 500],
      types: { 441: 'Login Validation', 451: 'Signup Validation', 461: 'Add Listing Validation', 469: 'Valuation Validation', 477: 'Business Rules', 486: 'Email Format', 491: 'Currency Validation', 496: 'Edge Values' },
      priorities: { 441: 'Critical', 451: 'High', 461: 'High', 469: 'Medium', 477: 'High', 486: 'High' }
    },
    {
      module: 'Deployment', category: 'Deployment Testing', range: [501, 520],
      types: { 501: 'Health Check', 505: 'API Endpoints', 508: 'Static Assets', 511: 'Error Handling', 516: 'CORS/Security', 517: 'Performance' },
      priorities: { 501: 'Critical', 505: 'Critical', 508: 'High', 511: 'High', 516: 'High' }
    }
  ];

  suites.forEach(suite => {
    for (let id = suite.range[0]; id <= suite.range[1]; id++) {
      // Determine sub-type
      let subType = Object.entries(suite.types)
        .reverse()
        .find(([k]) => parseInt(k) <= id)?.[1] || 'General';
      // Determine priority
      let priority = Object.entries(suite.priorities)
        .reverse()
        .find(([k]) => parseInt(k) <= id)?.[1] || 'Medium';

      cases.push({
        testId: `SE-${String(id).padStart(3, '0')}`,
        module: suite.module,
        category: suite.category,
        subType,
        priority,
        status: 'Pending'
      });
    }
  });

  return cases;
}

// ── Main report generator ─────────────────────────────────────────────────────
const ExcelReporter = {
  addResult(r) {
    results.push({ ...r, timestamp: new Date().toISOString() });
    if (r.status === 'FAILED') failed.push(r);
  },

  async generateReport(env = 'localhost', browser = 'Chrome') {
    const wb = new ExcelJS.Workbook();
    wb.creator  = 'PropAI Selenium Framework v2.0';
    wb.company  = 'PropAI';
    wb.created  = new Date();
    wb.modified = new Date();

    const total   = results.length;
    const passed  = results.filter(r => r.status === 'PASSED').length;
    const failedN = results.filter(r => r.status === 'FAILED').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : '0.00';
    const totalDur = results.reduce((s, r) => s + (r.duration || 0), 0);

    // ────────────────────────────────────────────────────────────────────────
    // Sheet 1: Executive Summary
    // ────────────────────────────────────────────────────────────────────────
    const sum = wb.addWorksheet('Executive Summary');
    sum.mergeCells('A1:F1');
    sum.getCell('A1').value = 'PropAI E2E Test Execution Report';
    sum.getCell('A1').style = { ...styles.titleDark, font: { ...styles.titleDark.font, size: 18 } };
    sum.getRow(1).height = 40;

    sum.mergeCells('A2:F2');
    sum.getCell('A2').value = `Generated: ${moment().format('MMMM Do YYYY, h:mm:ss a')}  |  Environment: ${env}  |  Browser: ${browser}`;
    sum.getCell('A2').style = { font: { italic: true, color: { argb: 'FF6B7280' } }, alignment: { horizontal: 'center' } };
    sum.getRow(2).height = 20;

    // KPI cards row
    const kpiRow = sum.getRow(4);
    const kpis = [
      { label: 'Total Tests', value: total, color: 'FF1E1B4B' },
      { label: 'Passed ✅', value: passed, color: 'FF059669' },
      { label: 'Failed ❌', value: failedN, color: 'FFDC2626' },
      { label: 'Skipped ⚠️', value: skipped, color: 'FFD97706' },
      { label: 'Pass Rate', value: passRate + '%', color: passed >= total * 0.8 ? 'FF059669' : 'FFDC2626' },
      { label: 'Duration (s)', value: (totalDur / 1000).toFixed(1), color: 'FF4B5563' }
    ];

    kpis.forEach((kpi, i) => {
      const col = String.fromCharCode(65 + i);
      sum.mergeCells(`${col}4:${col}5`);
      sum.getCell(`${col}4`).value  = kpi.label;
      sum.getCell(`${col}4`).style  = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: kpi.color } }, alignment: { horizontal: 'center', vertical: 'middle' } };
      sum.mergeCells(`${col}6:${col}7`);
      sum.getCell(`${col}6`).value  = kpi.value;
      sum.getCell(`${col}6`).style  = { font: { bold: true, size: 20 }, alignment: { horizontal: 'center', vertical: 'middle' } };
    });
    sum.getRow(4).height = 30;
    sum.getRow(6).height = 40;

    // Module summary table
    sum.getRow(9).values = ['', 'Module', 'Total', 'Passed', 'Failed', 'Pass Rate'];
    ['A9','B9','C9','D9','E9','F9'].forEach(c => { sum.getCell(c).style = styles.header; });

    const moduleMap = {};
    results.forEach(r => {
      if (!moduleMap[r.module]) moduleMap[r.module] = { total: 0, passed: 0, failed: 0 };
      moduleMap[r.module].total++;
      if (r.status === 'PASSED') moduleMap[r.module].passed++;
      if (r.status === 'FAILED') moduleMap[r.module].failed++;
    });

    let modRow = 10;
    Object.entries(moduleMap).forEach(([mod, stats]) => {
      const rate = ((stats.passed / stats.total) * 100).toFixed(1) + '%';
      sum.getRow(modRow).values = ['', mod, stats.total, stats.passed, stats.failed, rate];
      sum.getRow(modRow).eachCell((cell) => { cell.style = { ...styles.cell, alignment: { horizontal: 'center' } }; });
      modRow++;
    });

    sum.columns = [
      { width: 4 }, { width: 20 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 }
    ];

    // ────────────────────────────────────────────────────────────────────────
    // Sheet 2: Test Case Master List
    // ────────────────────────────────────────────────────────────────────────
    const masterSheet = wb.addWorksheet('Test Case Master List');
    masterSheet.columns = [
      { header: 'Test ID',     key: 'testId',   width: 12 },
      { header: 'Module',      key: 'module',   width: 16 },
      { header: 'Category',    key: 'category', width: 22 },
      { header: 'Sub-Type',    key: 'subType',  width: 22 },
      { header: 'Priority',    key: 'priority', width: 12 },
      { header: 'Execution Status', key: 'status', width: 18 },
    ];
    ['A','B','C','D','E','F'].forEach(c => { masterSheet.getCell(`${c}1`).style = styles.header; });

    const masterCases = buildTestCaseMaster();
    // Overlay actual results
    const resultMap = {};
    results.forEach((r, i) => { resultMap[`SE-${String(i + 1).padStart(3, '0')}`] = r.status; });
    results.forEach(r => {
      // Try to match by scenario prefix
      masterCases.forEach(tc => {
        if (r.scenario && r.scenario.startsWith(tc.testId + ':')) {
          tc.status = r.status;
        }
      });
    });

    masterCases.forEach((tc, i) => {
      const row = masterSheet.addRow(tc);
      const statusStyle = tc.status === 'PASSED' ? styles.passed
        : tc.status === 'FAILED' ? styles.failed
        : tc.status === 'SKIPPED' ? styles.skipped
        : { font: { color: { argb: 'FF6B7280' } }, alignment: { horizontal: 'center' } };
      row.getCell('F').style = statusStyle;

      // Priority colour
      const priColor = tc.priority === 'Critical' ? 'FFDC2626'
        : tc.priority === 'High' ? 'FFD97706'
        : 'FF059669';
      row.getCell('E').style = { font: { bold: true, color: { argb: priColor }, size: 10 }, alignment: { horizontal: 'center' } };

      // Alternate row shading
      if (i % 2 === 0) {
        ['A','B','C','D'].forEach(c => {
          row.getCell(c).style = { ...styles.cell, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } } };
        });
      }
    });

    // ────────────────────────────────────────────────────────────────────────
    // Sheet 3: Execution Results
    // ────────────────────────────────────────────────────────────────────────
    const execSheet = wb.addWorksheet('Execution Results');
    execSheet.columns = [
      { header: 'Test ID',      key: 'id',       width: 12 },
      { header: 'Module',       key: 'module',   width: 16 },
      { header: 'Scenario',     key: 'scenario', width: 60 },
      { header: 'Browser',      key: 'browser',  width: 12 },
      { header: 'Status',       key: 'status',   width: 12 },
      { header: 'Duration (ms)',key: 'dur',      width: 16 },
      { header: 'Timestamp',    key: 'ts',       width: 24 },
      { header: 'URL',          key: 'url',      width: 40 },
    ];
    ['A','B','C','D','E','F','G','H'].forEach(c => { execSheet.getCell(`${c}1`).style = styles.header; });

    results.forEach((r, i) => {
      const row = execSheet.addRow({
        id: `SE-${String(i + 1).padStart(3, '0')}`,
        module: r.module,
        scenario: r.scenario,
        browser,
        status: r.status,
        dur: r.duration || 0,
        ts: r.timestamp || '',
        url: r.url || ''
      });
      const statusStyle = r.status === 'PASSED' ? styles.passed
        : r.status === 'FAILED' ? styles.failed
        : styles.skipped;
      row.getCell('E').style = statusStyle;
      row.eachCell((cell, colNum) => {
        if (colNum !== 5) cell.style = styles.cell;
      });
    });

    // ────────────────────────────────────────────────────────────────────────
    // Sheet 4: Failed Tests Analysis
    // ────────────────────────────────────────────────────────────────────────
    const failSheet = wb.addWorksheet('Failed Tests Analysis');
    failSheet.columns = [
      { header: 'Test Name',       key: 'name',       width: 55 },
      { header: 'Module',          key: 'module',     width: 16 },
      { header: 'Failure Reason',  key: 'reason',     width: 60 },
      { header: 'Screenshot Path', key: 'screenshot', width: 50 },
      { header: 'Browser',         key: 'browser',    width: 12 },
      { header: 'URL at Failure',  key: 'url',        width: 45 },
    ];
    ['A','B','C','D','E','F'].forEach(c => {
      const cell = failSheet.getCell(`${c}1`);
      cell.style = { ...styles.header, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } } };
    });

    if (failed.length === 0) {
      failSheet.addRow({ name: '🎉 All executed tests PASSED!', module: '', reason: '', screenshot: '', browser, url: '' });
    } else {
      failed.forEach(r => {
        failSheet.addRow({
          name:       r.scenario || '',
          module:     r.module || '',
          reason:     r.error || 'Unknown error',
          screenshot: r.screenshotPath || 'N/A',
          browser,
          url:        r.url || ''
        });
      });
    }

    // ────────────────────────────────────────────────────────────────────────
    // Sheet 5: Module-wise Summary
    // ────────────────────────────────────────────────────────────────────────
    const modSheet = wb.addWorksheet('Module Summary');
    modSheet.columns = [
      { header: 'Module',       key: 'module',   width: 20 },
      { header: 'Category',     key: 'cat',      width: 24 },
      { header: 'Total Tests',  key: 'total',    width: 14 },
      { header: 'Passed',       key: 'passed',   width: 12 },
      { header: 'Failed',       key: 'failed',   width: 12 },
      { header: 'Skipped',      key: 'skipped',  width: 12 },
      { header: 'Pass Rate',    key: 'rate',     width: 12 },
      { header: 'Avg Duration (ms)', key: 'avgDur', width: 20 },
    ];
    ['A','B','C','D','E','F','G','H'].forEach(c => { modSheet.getCell(`${c}1`).style = styles.header; });

    const moduleCategories = {
      Auth: 'Functional Testing',
      Dashboard: 'Functional Testing',
      Advanced: 'E2E / Integration',
      'UI-UX': 'UI/UX Testing',
      Functional: 'Functional Testing',
      Validation: 'Validation Testing',
      Deployment: 'Deployment Testing'
    };

    const moduleResults = {};
    results.forEach(r => {
      if (!moduleResults[r.module]) moduleResults[r.module] = { total: 0, passed: 0, failed: 0, skipped: 0, totalDur: 0 };
      moduleResults[r.module].total++;
      moduleResults[r.module].totalDur += (r.duration || 0);
      if (r.status === 'PASSED') moduleResults[r.module].passed++;
      else if (r.status === 'FAILED') moduleResults[r.module].failed++;
      else moduleResults[r.module].skipped++;
    });

    Object.entries(moduleResults).forEach(([mod, s]) => {
      const rate = s.total > 0 ? ((s.passed / s.total) * 100).toFixed(1) + '%' : '0%';
      const avgD = s.total > 0 ? Math.round(s.totalDur / s.total) : 0;
      const row  = modSheet.addRow({
        module: mod, cat: moduleCategories[mod] || 'General',
        total: s.total, passed: s.passed, failed: s.failed, skipped: s.skipped,
        rate, avgDur: avgD
      });
      row.getCell('D').style = styles.passed;
      if (s.failed > 0) row.getCell('E').style = styles.failed;
      row.getCell('G').style = {
        font: { bold: true, color: { argb: s.passed >= s.total * 0.8 ? 'FF059669' : 'FFDC2626' } },
        alignment: { horizontal: 'center' }
      };
    });

    // ────────────────────────────────────────────────────────────────────────
    // Sheet 6: Execution Logs
    // ────────────────────────────────────────────────────────────────────────
    const logSheet = wb.addWorksheet('Execution Logs');
    logSheet.columns = [
      { header: 'Timestamp',  key: 't',  width: 24 },
      { header: 'Test Name',  key: 'n',  width: 50 },
      { header: 'Step',       key: 's',  width: 50 },
      { header: 'Result',     key: 'r',  width: 12 },
      { header: 'Remarks',    key: 'm',  width: 40 }
    ];
    ['A','B','C','D','E'].forEach(c => { logSheet.getCell(`${c}1`).style = styles.header; });

    try {
      const stepLogs = require('./logger').getStepLogs();
      stepLogs.forEach(l => logSheet.addRow({ t: l.timestamp, n: l.testName, s: l.step, r: l.result, m: l.remarks || '' }));
    } catch { /* ignore */ }

    // ── Write file ────────────────────────────────────────────────────────────
    const filename = `E2E_Test_Report_PropAI_${moment().format('YYYY-MM-DD[T]HH-mm-ss')}.xlsx`;
    const filePath = path.join(excelDir, filename);
    await wb.xlsx.writeFile(filePath);
    logger.info(`📊 Excel report generated: ${filePath}`);
    return filePath;
  },

  clearResults() {
    results.length = 0;
    failed.length  = 0;
  }
};

module.exports = ExcelReporter;

// ── Standalone CLI usage: node utilities/excelReporter.js ─────────────────────
if (require.main === module) {
  // Build a demo report with the master list
  const masterCases = buildTestCaseMaster();
  masterCases.forEach(tc => {
    ExcelReporter.addResult({
      module:   tc.module,
      scenario: `${tc.testId}: ${tc.subType} - ${tc.category}`,
      status:   'PASSED',
      duration: Math.floor(Math.random() * 3000) + 500
    });
  });
  ExcelReporter.generateReport('localhost', 'Chrome')
    .then(p => { console.log(`\n✅ Demo report generated:\n   ${p}`); process.exit(0); })
    .catch(e => { console.error('Report error:', e); process.exit(1); });
}
