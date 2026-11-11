const assert = require('node:assert/strict');
const { assertWorkflowSource, checkPagesSource } = require('../scripts/check-pages-source');

(async () => {
  assert.doesNotThrow(() => assertWorkflowSource({ build_type: 'workflow' }));
  for (const site of [undefined, {}, { build_type: 'legacy' }, { build_type: 'unknown' }]) {
    assert.throws(() => assertWorkflowSource(site), /select GitHub Actions/);
  }
  const options = { repository: 'synthetic/loadnote', token: 'synthetic-token' };
  let calls = 0;
  await checkPagesSource({ ...options, fetcher: async (url, init) => {
    calls++;
    assert.equal(url, 'https://api.github.com/repos/synthetic/loadnote/pages');
    assert.equal(init.method, undefined, 'Guard uses GET only; never changes hosting');
    assert.equal(init.body, undefined);
    assert.equal(init.headers.Authorization, 'Bearer synthetic-token');
    return { ok: true, json: async () => ({ build_type: 'workflow' }) };
  } });
  assert.equal(calls, 1);
  await assert.rejects(checkPagesSource({ ...options, fetcher: async () => ({ ok: true, json: async () => ({ build_type: 'legacy' }) }) }), /select GitHub Actions/);
  for (const status of [403, 404, 503]) {
    await assert.rejects(checkPagesSource({ ...options, fetcher: async () => ({ ok: false, status }) }), /publication is blocked/);
  }
  await assert.rejects(checkPagesSource({ ...options, fetcher: async () => { throw Error('synthetic-token'); } }), error => !error.message.includes(options.token) && /blocked/.test(error.message));
  await assert.rejects(checkPagesSource({ ...options, fetcher: async () => ({ ok: true, json: async () => { throw Error('bad JSON'); } }) }), /unreadable/);
  await assert.rejects(checkPagesSource({ ...options, repository: '../unexpected' }), /valid GITHUB_REPOSITORY/);
  await assert.rejects(checkPagesSource({ ...options, token: '' }), /GITHUB_TOKEN is required/);
  console.log('Pages source guard rejects competing publishers and fails closed without mutating hosting or exposing credentials');
})().catch(error => { console.error(error); process.exitCode = 1; });
