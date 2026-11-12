const { defineConfig } = require('playwright/test');

process.env.LOADNOTE_WEBKIT = '1';
const base = require('./playwright.config');

const areas = {
  'Onboarding and first workout': ['v71-beginner-training.spec.js', 'v72-history-setup.spec.js'],
  'Navigation and History': ['mobile-navigation.spec.js', 'v73-history-return.spec.js'],
  'Verified history and adaptation evidence': ['v64-verified-history.spec.js', 'v4-adaptive-loop.spec.js', 'v41-evidence-integrity.spec.js', 'v42-next-session-context.spec.js'],
  'Workout logging and rest': ['v70-workout-review.spec.js', 'v75-rest-entry.spec.js', 'v76-workout-continuation.spec.js'],
  'Coach and research': ['v68-mobile-coach-ux.spec.js', 'v69-coach-continuity.spec.js'],
  'Accessibility and layout': ['iphone-interface.spec.js'],
  'Offline Coach, updates and cache repair': ['v44-offline-dialogue.spec.js', 'v72-offline-repair.spec.js', 'v77-update-status.spec.js'],
};

module.exports = defineConfig({
  ...base,
  workers: 2,
  projects: base.projects
    .filter(project => project.name.startsWith('mobile-'))
    .map(project => ({
      ...project,
      testMatch: Object.values(areas).flat(),
      use: { ...project.use, screenshot: 'only-on-failure' },
    })),
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['./scripts/mobile-review-reporter.js', { areas }],
  ],
});
