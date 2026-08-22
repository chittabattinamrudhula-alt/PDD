const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const logger = require('./logger');

const excelDir = path.join(__dirname, '../reports/excel');
if (!fs.existsSync(excelDir)) fs.mkdirSync(excelDir, { recursive: true });

const testResults = [];
const failedTests = [];

const ExcelReporter = {
  addResult(result) {
    testResults.push(result);
    if (result.status === 'FAILED') failedTests.push(result);
  },

  async generateReport(deviceName = 'Android Emulator', androidVersion = '13.0') {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'PropAI Appium Framework';
    wb.created = new Date();

    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    };

    const passStyle = { font: { bold: true, color: { argb: 'FF16A34A' } } };
    const failStyle = { font: { bold: true, color: { argb: 'FFDC2626' } } };
    const skipStyle = { font: { bold: true, color: { argb: 'FFD97706' } } };

    // ── Sheet 1: Summary ──────────────────────────────────────────────────────
    const summary = wb.addWorksheet('Summary');
    summary.columns = [
      { header: 'Metric', key: 'metric', width: 28 },
      { header: 'Value', key: 'value', width: 40 }
    ];
    ['A1', 'B1'].forEach(c => { summary.getCell(c).style = headerStyle; });

    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'PASSED').length;
    const failed = testResults.filter(r => r.status === 'FAILED').length;
    const skipped = testResults.filter(r => r.status === 'SKIPPED').length;
    const pct = total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : '0%';
    const totalDuration = testResults.reduce((s, r) => s + (r.duration || 0), 0);

    const summaryData = [
      ['Execution Date', moment().format('YYYY-MM-DD HH:mm:ss')],
      ['Device Name', deviceName],
      ['Android Version', androidVersion],
      ['Total Tests', total],
      ['Passed', passed],
      ['Failed', failed],
      ['Skipped', skipped],
      ['Pass Percentage', pct],
      ['Total Duration (s)', (totalDuration / 1000).toFixed(2)],
      ['Framework', 'Appium 2.x + WebdriverIO + Mocha'],
      ['App Package', process.env.APP_PACKAGE || 'com.example.mobile']
    ];
    summaryData.forEach(([metric, value]) => {
      const row = summary.addRow({ metric, value });
      if (metric === 'Passed') row.getCell('value').style = passStyle;
      if (metric === 'Failed') row.getCell('value').style = failStyle;
      if (metric === 'Skipped') row.getCell('value').style = skipStyle;
    });

    // ── Sheet 2: Test Cases ───────────────────────────────────────────────────
    const tcSheet = wb.addWorksheet('Test Cases');
    tcSheet.columns = [
      { header: 'Test ID', key: 'id', width: 12 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Scenario', key: 'scenario', width: 55 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Device', key: 'device', width: 22 },
      { header: 'Duration (ms)', key: 'duration', width: 15 }
    ];
    ['A1','B1','C1','D1','E1','F1'].forEach(c => { tcSheet.getCell(c).style = headerStyle; });
    testResults.forEach((r, i) => {
      const row = tcSheet.addRow({ id: `TC-${String(i + 1).padStart(3, '0')}`, module: r.module, scenario: r.scenario, status: r.status, device: deviceName, duration: r.duration || 0 });
      if (r.status === 'PASSED') row.getCell('D').style = passStyle;
      else if (r.status === 'FAILED') row.getCell('D').style = failStyle;
      else row.getCell('D').style = skipStyle;
    });

    // ── Sheet 3: Failed Tests ─────────────────────────────────────────────────
    const ftSheet = wb.addWorksheet('Failed Tests');
    ftSheet.columns = [
      { header: 'Test Name', key: 'name', width: 55 },
      { header: 'Failure Reason', key: 'reason', width: 60 },
      { header: 'Screenshot Path', key: 'screenshot', width: 50 },
      { header: 'Device', key: 'device', width: 22 },
      { header: 'Android Version', key: 'version', width: 18 }
    ];
    ['A1','B1','C1','D1','E1'].forEach(c => { ftSheet.getCell(c).style = headerStyle; });
    failedTests.forEach(r => {
      ftSheet.addRow({ name: r.scenario, reason: r.error || 'Unknown', screenshot: r.screenshotPath || 'N/A', device: deviceName, version: androidVersion });
    });

    // ── Sheet 4: Execution Logs ───────────────────────────────────────────────
    const logSheet = wb.addWorksheet('Execution Logs');
    logSheet.columns = [
      { header: 'Timestamp', key: 'ts', width: 24 },
      { header: 'Test Name', key: 'test', width: 50 },
      { header: 'Step', key: 'step', width: 50 },
      { header: 'Result', key: 'result', width: 12 },
      { header: 'Remarks', key: 'remarks', width: 40 }
    ];
    ['A1','B1','C1','D1','E1'].forEach(c => { logSheet.getCell(c).style = headerStyle; });
    const stepLogs = require('./logger').getStepLogs();
    stepLogs.forEach(l => {
      logSheet.addRow({ ts: l.timestamp, test: l.testName, step: l.step, result: l.result, remarks: l.remarks });
    });

    const filename = `Flutter_E2E_Report_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
    const filepath = path.join(excelDir, filename);
    await wb.xlsx.writeFile(filepath);
    logger.info(`Excel report generated: ${filepath}`);
    return filepath;
  },

  clearResults() {
    testResults.length = 0;
    failedTests.length = 0;
  }
};

module.exports = ExcelReporter;
