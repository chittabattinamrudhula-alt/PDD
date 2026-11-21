# PropAI Enterprise CI/CD — Complete Guide

---

## 1. Local Execution Guide

### Prerequisites
```bash
node --version   # >= 18.0.0
npm --version    # >= 9.0.0
google-chrome --version   # any stable
```

### Setup
```bash
# 1. Clone the repo
git clone https://github.com/chittabattinamrudhula-alt/PDD.git
cd PDD/automation

# 2. Install dependencies
npm install

# 3. Copy and configure .env
cp .env.example .env
# Edit .env — set BASE_URL to the live GitHub Pages URL:
# BASE_URL=https://chittabattinamrudhula-alt.github.io/PDD
```

### Run Tests (against Live GitHub Pages URL — MANDATORY)
```bash
# Full suite (430 tests)
npm run test:all

# Individual suites
npm run test:auth          # 40 tests — Authentication
npm run test:navigation    # 30 tests — Navigation
npm run test:ui            # 50 tests — UI Validation
npm run test:forms         # 50 tests — Forms
npm run test:crud          # 50 tests — CRUD Operations
npm run test:validation    # 40 tests — Input Validation
npm run test:error         # 20 tests — Error Handling
npm run test:session       # 20 tests — Session Management
npm run test:upload        # 20 tests — File Upload
npm run test:accessibility # 20 tests — Accessibility
npm run test:responsive    # 20 tests — Responsive Design
npm run test:performance   # 20 tests — Performance Smoke
npm run test:regression    # 50 tests — Regression

# Generate reports manually
npm run report:excel       # Excel report
npm run report:html        # HTML dashboard
npm run report:summary     # Markdown summary + JSON
```

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | **MANDATORY** Live GitHub Pages URL | `https://...github.io/PDD` |
| `BROWSER` | Browser to use | `chrome` |
| `HEADLESS` | Run headless | `true` |
| `IMPLICIT_WAIT` | Implicit wait (ms) | `15000` |
| `EXPLICIT_WAIT` | Explicit wait (ms) | `45000` |
| `TEST_BUYER_EMAIL` | Buyer seed account | `buyer@propai.com` |
| `TEST_SELLER_EMAIL` | Seller seed account | `seller@propai.com` |
| `TEST_ADMIN_EMAIL` | Admin seed account | `admin@propai.com` |

### Reports Location
```
automation/reports/
├── excel/          # Automation_Test_Report.xlsx
├── html/           # dashboard.html + execution-report-*.html
├── screenshots/    # Step screenshots
├── failures/       # Failure screenshots + console logs
├── json/           # execution-results.json per suite
├── summary/        # summary.md
├── logs/           # selenium-*.log
└── mochawesome/    # Raw JSON + HTML from Mocha
```

---

## 2. CI/CD Execution Guide

### How the Pipeline Works

```
Push to master/main
        ↓
[Job: deploy]
  Stage 1: Checkout
  Stage 2: Install frontend deps
  Stage 3: Build (VITE_BASE_PATH=/PDD/)
  Stage 4: Static analysis (lint)
  Stage 5: Deploy to GitHub Pages
        ↓
[Job: selenium-live-tests] × 13 suites (parallel)
  Stage 6: Wait for GitHub Pages to be live (HTTP 200)
  Stage 7: Verify deployment (HTML + CSS + JS assets)
  Stage 8: Run Selenium tests against LIVE URL
  Stage 9: Generate HTML reports (mochawesome)
  Stage 10: Generate Excel reports
  Stage 11: Upload all artifacts (30 days)
  Stage 12: Publish per-suite GitHub Step Summary
        ↓
[Job: final-summary]
  Stage 13: Merge all JSON results → Master report
  Stage 12: Publish final aggregated GitHub Summary
  Stage 13: Store historical test record
```

### Triggering the Pipeline
```
# Auto-trigger on push
git add .
git commit -m "feat: your change"
git push origin main

# Manual trigger (GitHub UI)
Actions → "PropAI Deploy + Live E2E Tests" → Run workflow
  Options: skip_tests=false, test_suite=all
```

### Required GitHub Settings

**1. Enable GitHub Pages:**
- Settings → Pages → Source: **GitHub Actions**

**2. Required Permissions (already in workflow):**
```yaml
permissions:
  contents: write
  pages: write
  id-token: write
```

**3. Optional Secrets:**
| Secret | Description |
|--------|-------------|
| `BACKEND_API_URL` | Backend API URL (defaults to Render) |

**4. Deployment URL:**
```
https://chittabattinamrudhula-alt.github.io/PDD
```

### Pass/Fail Logic
- ❌ **FAILS** if: GitHub Pages deployment fails
- ⚠️ **DEGRADES** if: Pass rate < 95% (but doesn't block merge)
- ✅ **PASSES** if: Deployment succeeds + pass rate ≥ 95%

---

## 3. Troubleshooting Guide

### Problem: `BASE_URL is localhost` error in CI
**Cause:** `config/config.js` blocks localhost in CI environments.
**Fix:** Ensure `BASE_URL` env var is set to the GitHub Pages URL in the workflow.
```yaml
env:
  BASE_URL: ${{ needs.deploy.outputs.deployment_url }}
```

### Problem: `Deployment did not become available after 300s`
**Cause:** GitHub Pages takes time to propagate after first deploy.
**Fix:**
1. Check Settings → Pages shows the deployment
2. Increase `MAX_RETRIES` in Stage 6 of the workflow
3. Wait 5 minutes and re-trigger

### Problem: `ChromeDriver version mismatch`
**Cause:** Chrome version in CI changed.
**Fix:** The workflow auto-detects Chrome major version:
```bash
CHROME_VERSION=$(google-chrome --version | grep -oP '\d+' | head -1)
npm install -g chromedriver@$CHROME_VERSION
```

### Problem: Tests fail with `StaleElementReferenceException`
**Cause:** React re-renders between finding and using an element.
**Fix:** `webUtils.isDisplayed()` catches stale refs and returns `false`. For click/type, the `waitForElement` retries automatically via Mocha's `retries: 2`.

### Problem: `element click intercepted` error
**Fix:** Use `jsClick()` instead of `click()`:
```javascript
await utils.jsClick(app.loc.someButton);
```

### Problem: Valuation test times out
**Cause:** GitHub Pages serves static files only — the backend API may be unreachable.
**Fix:** The valuation tab's `Calculate` button makes a client-side call to the backend. If backend (Render) is sleeping (free tier), it needs a wake-up call. Add `VITE_API_BASE` secret pointing to your backend.

### Problem: `Module not found: exceljs`
**Fix:**
```bash
cd automation && npm install
```

### Problem: Screenshot directory not found
**Fix:** The workflow creates directories automatically:
```bash
mkdir -p automation/reports/screenshots automation/reports/failures
```
Or run locally:
```bash
npm run test:auth  # directories are auto-created by webUtils.js
```

### Problem: No artifacts uploaded on failure
**Fix:** All upload steps use `if: always()` so artifacts are uploaded regardless of test outcome.

### Problem: Vite build fails with base path error
**Fix:** Ensure `vite.config.js` has the base path config:
```javascript
base: process.env.VITE_BASE_PATH || '/',
```
And the CI step sets:
```yaml
env:
  VITE_BASE_PATH: /PDD/
```

---

## 4. Test Count Summary

| Suite | Category | Test IDs | Count |
|-------|----------|----------|-------|
| auth | Authentication | TC-AUTH-001 to TC-AUTH-040 | 40 |
| navigation | Navigation | TC-NAV-001 to TC-NAV-030 | 30 |
| ui | UI Validation | TC-UI-001 to TC-UI-050 | 50 |
| forms | Forms | TC-FORM-001 to TC-FORM-050 | 50 |
| crud | CRUD Operations | TC-CRUD-001 to TC-CRUD-050 | 50 |
| validation | Input Validation | TC-VAL-001 to TC-VAL-040 | 40 |
| error | Error Handling | TC-ERR-001 to TC-ERR-020 | 20 |
| session | Session Management | TC-SES-001 to TC-SES-020 | 20 |
| upload | File Upload | TC-UPL-001 to TC-UPL-020 | 20 |
| accessibility | Accessibility | TC-ACC-001 to TC-ACC-020 | 20 |
| responsive | Responsive Design | TC-RES-001 to TC-RES-020 | 20 |
| performance | Performance Smoke | TC-PERF-001 to TC-PERF-020 | 20 |
| regression | Regression | TC-REG-001 to TC-REG-050 | 50 |
| **TOTAL** | | | **430** |

*Content was written for compliance with documentation licensing restrictions.*
