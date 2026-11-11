'use strict';

// Read-only: a legacy branch publisher can replace the bundled Pages artifact
// after its immediate live verification has passed.
function assertWorkflowSource(site) {
  if (site?.build_type !== 'workflow') {
    throw Error('Pages must use GitHub Actions as its build source. In repository Settings > Pages > Build and deployment, select GitHub Actions, then explicitly republish the approved release. A branch/Jekyll publisher can overwrite generated offline assets. No settings were changed.');
  }
}

async function checkPagesSource({ repository, token, fetcher = fetch }) {
  if (!/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(repository || '')) throw Error('A valid GITHUB_REPOSITORY is required.');
  if (!token) throw Error('GITHUB_TOKEN is required to read the Pages build source.');
  let response;
  try {
    response = await fetcher(`https://api.github.com/repos/${repository}/pages`, {
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' },
      signal: AbortSignal.timeout(15000),
    });
  } catch (_) { throw Error('Could not read the Pages build source; publication is blocked until it can be verified.'); }
  if (!response.ok) throw Error(`Could not verify the Pages build source (HTTP ${response.status}); publication is blocked. Check Pages access and configuration.`);
  let site;
  try { site = await response.json(); } catch (_) { throw Error('Pages returned an unreadable build source; publication is blocked.'); }
  assertWorkflowSource(site);
}

if (require.main === module) {
  checkPagesSource({ repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN })
    .then(() => console.log('Pages uses GitHub Actions; no competing branch publisher is configured.'))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { assertWorkflowSource, checkPagesSource };
