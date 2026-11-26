const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflow = fs.readFileSync(path.join(__dirname, '../.github/workflows/pages.yml'), 'utf8');
// Read the inputs from the actual action step; absent inputs use GitHub's
// documented defaults. Simulate the run-scoped artifact list across retries.
function artifactInput(action, input) {
  const steps = workflow.split(/\n      - /);
  const step = steps.find(text => text.includes('uses: actions/' + action + '@'));
  assert(step, 'Expected the existing ' + action + ' action');
  return step.match(new RegExp('^          ' + input + ': (.+)$', 'm'))?.[1] || 'github-pages';
}
function nameAt(template, attempt) {
  return template.replace(/\$\{\{\s*github\.run_attempt\s*\}\}/g, String(attempt));
}
const upload = artifactInput('upload-pages-artifact', 'name');
const deploy = artifactInput('deploy-pages', 'artifact_name');
const artifacts = [];
for (const attempt of [1, 2, 3]) {
  const name = nameAt(upload, attempt);
  artifacts.push({ id: 'synthetic-upload-' + attempt, name });
  const matches = artifacts.filter(artifact => artifact.name === nameAt(deploy, attempt));
  assert.equal(matches.length, 1, 'Retry must select exactly its own upload while retaining earlier evidence');
  assert.equal(matches[0].id, 'synthetic-upload-' + attempt, 'Never deploy a previous attempt');
}
assert.equal(new Set(artifacts.map(artifact => artifact.name)).size, 3);
assert(!workflow.includes('delete-artifact'), 'Recovery must preserve earlier evidence');
// This changes artifact selection only: publication still requires the same
// exact-main and single-publisher guards, followed by live/offline acceptance.
assert(workflow.indexOf('check-publication-gates.js') < workflow.indexOf('uses: actions/upload-pages-artifact@'));
assert(workflow.indexOf('check-pages-source.js') < workflow.indexOf('uses: actions/deploy-pages@'));
assert.match(workflow, /name: Verify settled live assets twice/);
assert.match(workflow, /npx playwright test --config=playwright.offline.config.js/);
console.log('Pages retries select their own artifact without deleting prior evidence or bypassing release gates');
