const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testDir = __dirname;
const testFiles = fs
  .readdirSync(testDir)
  .filter((f) => f.endsWith('.test.ts') || f.endsWith('.test.js'))
  .sort()
  .map((f) => path.join(testDir, f));

console.log(`Exécution de ${testFiles.length} suites de tests AGRISAMA AI...`);
const res = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', '--test-concurrency=1', ...testFiles],
  { stdio: 'inherit' }
);
process.exit(res.status || 0);
