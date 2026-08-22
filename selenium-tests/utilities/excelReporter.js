const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const logger = require('./logger');
const config = require('../config/selenium.config');

const excelDir = path.join(__dirname, '../reports/excel');
if (!fs.existsSync(excelDir)) fs.mkdirSync(excelDir, { recursive: true });

const results = [];
const failed = [];

const headerStyle = {
  font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } },
  alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
};

const ExcelReporter = {
  addResult(r) {
    results.push(r);
    if (r.status === 'FAILED') failed.push(r);
  },

  async generateReport(env = 'localhost', browser = 'Chrome') {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'PropAI Selenium Framework';
    wb.created = new Date();

    // Sheet 1 - Summary
    const sum = wb.addWorksheet('Summary');
    sum.columns = [{ header: 'Metric', key: 'k', width: 28 }, { header: 'Value', key: 'v', width: 40 }];
    ['A1','B1'].forEach(c => { sum.getCell(c).style = headerStyle; });

    const total   = results.length;
    const passed  = results.filter(r => r.status === 'PASSED').length;
    const failedN = results.filter(r => r.status === 'FAILED').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    const dur     = results.reduce((s, r) => s + (r.duration || 0), 0);

    [
      ['Execution Date', moment().format('YYYY-MM-DD HH:mm:ss')],
      ['Environment', env], ['Browser', browser],
      ['Total Tests', total], ['Passed', passed], ['Failed', failedN],
      ['Skipped', skipped], ['Pass %', total > 0 ? ((passed/total)*100).toFixed(2)+'%' : '0%'],
      ['Duration (s)', (dur/1000).toFixed(2)], ['Framework', 'Selenium WebDriver + Mocha + Chai']
    ].forEach(([k, v]) => sum.addRow({ k, v }));

    // Sheet 2 - Test Cases
    const tc = wb.addWorksheet('Test Cases');
    tc.columns = [
      { header: 'Test ID', key: 'id', width: 12 }, { header: 'Module', key: 'module', width: 20 },
      { header: 'Scenario', key: 'scenario', width: 60 }, { header: 'Browser', key: 'browser', width: 12 },
      { header: 'Status', key: 'status', width: 12 }, { header: 'Start Time', key: 'start', width: 22 },
      { header: 'End Time', key: 'end', width: 22 }, { header: 'Duration (ms)', key: 'dur', width: 15 }
    ];
    ['A','B','C','D','E','F','G','H'].forEach(c => { tc.getCell(`${c}1`).style = headerStyle; });
    results.forEach((r, i) => {
      const row = tc.addRow({ id: `SE-${String(i+1).padStart(3,'0')}`, module: r.module, scenario: r.scenario, browser, status: r.status, start: r.startTime || '', end: r.endTime || '', dur: r.duration || 0 });
      const s = r.status === 'PASSED' ? { font: { bold:true, color: { argb:'FF16A34A' } } } : r.status === 'FAILED' ? { font: { bold:true, color: { argb:'FFDC2626' } } } : { font: { bold:true, color: { argb:'FFD97706' } } };
      row.getCell('E').style = s;
    });

    // Sheet 3 - Failed
    const ft = wb.addWorksheet('Failed Tests');
    ft.columns = [
      { header: 'Test Name', key: 'n', width: 60 }, { header: 'Failure Reason', key: 'r', width: 60 },
      { header: 'Screenshot', key: 's', width: 50 }, { header: 'Browser', key: 'b', width: 12 },
      { header: 'URL', key: 'u', width: 50 }
    ];
    ['A','B','C','D','E'].forEach(c => { ft.getCell(`${c}1`).style = headerStyle; });
    failed.forEach(r => ft.addRow({ n: r.scenario, r: r.error || 'Unknown', s: r.screenshotPath || 'N/A', b: browser, u: r.url || '' }));

    // Sheet 4 - Logs
    const lg = wb.addWorksheet('Execution Logs');
    lg.columns = [
      { header: 'Timestamp', key: 't', width: 24 }, { header: 'Test Name', key: 'n', width: 50 },
      { header: 'Step', key: 's', width: 50 }, { header: 'Result', key: 'r', width: 12 },
      { header: 'Remarks', key: 'm', width: 40 }
    ];
    ['A','B','C','D','E'].forEach(c => { lg.getCell(`${c}1`).style = headerStyle; });
    require('./logger').getStepLogs().forEach(l => lg.addRow({ t: l.timestamp, n: l.testName, s: l.step, r: l.result, m: l.remarks }));

    const file = path.join(excelDir, `E2E_Report_${moment().format('YYYYMMDD_HHmmss')}.xlsx`);
    await wb.xlsx.writeFile(file);
    logger.info(`Excel report: ${file}`);
    return file;
  },

  clearResults() { results.length = 0; failed.length = 0; }
};

module.exports = ExcelReporter;
