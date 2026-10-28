const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {routeFor} = require('../extension/scope.js');
test('only the intended profile overview and shared landing page are themed', () => {
  for (const url of ['https://github.com/psichopodobny', 'https://github.com/psichopodobny/', 'https://github.com/psichopodobny?tab=overview', 'https://github.com/psichopodobny?from=2026-01-01', 'https://github.com/Psichopodobny']) assert.equal(routeFor(url), 'personal', url);
  assert.equal(routeFor('https://github.com/psichopodobny/psichopodobny-and-uikole'), 'duo');
  assert.equal(routeFor('https://github.com/psichopodobny/psichopodobny-and-uikole/'), 'duo');
  for (const url of ['bad url', 'http://github.com/psichopodobny', 'https://github.com.evil.example/psichopodobny', 'https://evil.example/psichopodobny', 'https://github.com/uikoll', 'https://github.com/psichopodobny2', 'https://github.com/psichopodobny?tab=repositories', 'https://github.com/psichopodobny?tab=stars', 'https://github.com/psichopodobny/psichopodobny', 'https://github.com/psichopodobny/psichopodobny-and-uikole/issues', 'https://github.com/psichopodobny/psichopodobny-and-uikole/tree/main', 'https://github.com/psichopodobny/psichopodobny-and-uikole/settings', 'https://github.com/login', 'https://someone@github.com/psichopodobny']) assert.equal(routeFor(url), null, url);
});
test('manifest has only local storage permission and all files are packaged', () => {
  const dir = path.resolve(__dirname, '../extension');
  const manifest = JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.equal(manifest.background, undefined);
  assert.equal(manifest.host_permissions, undefined);
  const names = [...Object.values(manifest.icons), manifest.action.default_popup, ...manifest.content_scripts.flatMap(x => [...x.js,...x.css]), ...manifest.web_accessible_resources.flatMap(x=>x.resources)];
  for (const name of names) assert.ok(fs.existsSync(path.join(dir,name)), name);
  const scripts = fs.readdirSync(dir).filter(x=>x.endsWith('.js')).map(x=>fs.readFileSync(path.join(dir,x),'utf8')).join('\n');
  assert.doesNotMatch(scripts, /\b(?:fetch|XMLHttpRequest|WebSocket|eval)\s*\(/);
  assert.doesNotMatch(scripts, /document\.cookie|chrome\.cookies|chrome\.identity/);
});
