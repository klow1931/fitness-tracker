const { appendFileSync, mkdirSync, writeFileSync } = require('node:fs');
const { basename, resolve } = require('node:path');
const { execFileSync } = require('node:child_process');
const { version } = require('../package.json');
const { buildNumber } = require('../release.json');

function checkoutEvidence() {
  const cwd = resolve(__dirname, '..');
  try {
    const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const changes = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return { commit, changes: changes ? 'Tracked changes present; commit alone does not identify this run' : 'No tracked changes' };
  } catch {
    return { commit: 'Unavailable', changes: 'Unavailable' };
  }
}

const labels = {
  'mobile-chromium': 'Android-style Chromium',
  'mobile-webkit': 'iPhone-style WebKit',
};

function markdownText(value) {
  return String(value).replace(/[\r\n]+/g, ' ').replace(/[&<>]/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]
  ).replace(/[\\|`*_\[\]]/g, '\\$&');
}

class MobileReviewReporter {
  constructor({ areas }) {
    this.areas = areas;
    this.errors = [];
  }

  onBegin(config, suite) {
    this.tests = suite.allTests();
    this.projects = config.projects.map(project => project.name);
    this.checkout = checkoutEvidence();
    const source = process.env.LOADNOTE_SOURCE_COMMIT;
    this.source = source === undefined ? this.checkout.commit : /^[a-f0-9]{40}$/i.test(source) ? source : 'Unavailable';
    this.targets = [...new Set(config.projects.map(project => project.use?.baseURL).filter(Boolean))];
  }

  onError(error) {
    this.errors.push(error.message || 'Browser runner error');
  }

  onEnd(result) {
    const lines = [
      '# Loadnote automated mobile review',
      '',
      `Version ${version} · Browser run **${result.status}**`,
      '',
      '## Provenance and coverage',
      '',
      '| Evidence | Value |',
      '| --- | --- |',
      `| Source commit | ${markdownText(this.source)} |`,
      `| Tested checkout commit | ${markdownText(this.checkout.commit)} |`,
      `| Checkout state | ${markdownText(this.checkout.changes)} |`,
      `| Build | ${markdownText(buildNumber)} |`,
      `| Target | ${markdownText(this.targets.join(', ') || 'Not reported')} |`,
      '| Coverage | Served-build browser profiles with isolated synthetic data; not deployed-site or physical-phone acceptance |',
      '',
      'Target is the configured base origin; worker/update journeys use their own dedicated loopback origins. See individual test steps for those targets.',
      '',
      'Offline acceptance is not evaluated by this report, including when the regular browser run passes. The later separate step may be missing, failed or cancelled: inspect its workflow status, [offline HTML report](../playwright-report/offline-release/index.html) and `offline-release/` traces for exact source/tested commit, target, network method and stage results. These results are not included in the grouped counts below. Chromium uses context network emulation; pinned WebKit uses a dedicated loopback-server stop, not live-site network emulation.',
      '',
      '| Review area | ' + this.projects.map(name => labels[name] || name).join(' | ') + ' |',
      '| --- | ' + this.projects.map(() => '---').join(' | ') + ' |',
    ];
    for (const [area, files] of Object.entries(this.areas)) {
      const cells = this.projects.map(project => {
        const cases = this.tests.filter(test =>
          test.parent.project()?.name === project && files.includes(basename(test.location.file))
        );
        if (!cases.length) return 'No cases selected';
        const counts = { passed: 0, flaky: 0, failed: 0, skipped: 0 };
        for (const test of cases) {
          const outcome = test.outcome();
          if (!test.results.length) counts.skipped++;
          else if (outcome === 'expected') counts.passed++;
          else if (outcome === 'unexpected') counts.failed++;
          else counts[outcome]++;
        }
        return Object.entries(counts).filter(([, count]) => count)
          .map(([status, count]) => `${count} ${status}`).join(', ');
      });
      lines.push(`| ${area} | ${cells.join(' | ')} |`);
    }

    const findings = this.tests.filter(test => ['unexpected', 'flaky'].includes(test.outcome()));
    if (findings.length || this.errors.length) {
      lines.push('', '## Findings to investigate', '');
      for (const test of findings) {
        const failure = test.results.find(attempt => attempt.status !== test.expectedStatus);
        const project = test.parent.project()?.name;
        const status = test.outcome() === 'flaky' ? 'Passed on retry' : 'Failed';
        const detail = failure?.errors[0]?.message?.split('\n').find(line => line.trim()) || 'See the HTML report';
        lines.push(`- **${status}** · ${labels[project] || project} · ${markdownText(test.title)} (${basename(test.location.file)}:${test.location.line}). ${markdownText(detail)}`);
      }
      for (const error of this.errors) lines.push(`- **Runner error** · ${markdownText(error.split('\n')[0])}`);
    }

    lines.push('', 'The HTML report and test-results folder contain the test steps, screenshots, and available failure traces.', '',
      'These runs use mobile browser profiles and synthetic data. Physical keyboard, touch ergonomics, VoiceOver/TalkBack, installation, and real low-storage behavior require device testing.', '');
    const report = lines.join('\n');
    mkdirSync('test-results', { recursive: true });
    writeFileSync('test-results/mobile-review.md', report);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  }
}

module.exports = MobileReviewReporter;
