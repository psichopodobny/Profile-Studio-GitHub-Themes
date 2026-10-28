const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {routeFor} = require('../extension/scope.js');
test('personal profiles are candidates while repository and system routes are excluded', () => {
  for (const url of ['https://github.com/psichopodobny', 'https://github.com/psichopodobny/', 'https://github.com/psichopodobny?tab=overview', 'https://github.com/psichopodobny?from=2026-01-01', 'https://github.com/Psichopodobny']) assert.equal(routeFor(url), 'personal', url);
  assert.equal(routeFor('https://github.com/psichopodobny/psichopodobny-and-uikole'), 'duo');
  assert.equal(routeFor('https://github.com/psichopodobny/psichopodobny-and-uikole/'), 'duo');
  for (const url of ['https://github.com/uikoll','https://github.com/octocat','https://github.com/demo-dev','https://github.com/psichopodobny?tab=repositories','https://github.com/octocat?tab=stars']) assert.equal(routeFor(url),'profile',url);
  for (const url of ['bad url', 'http://github.com/psichopodobny', 'https://github.com.evil.example/psichopodobny', 'https://evil.example/psichopodobny', 'https://github.com/psichopodobny/psichopodobny', 'https://github.com/psichopodobny/psichopodobny-and-uikole/issues', 'https://github.com/psichopodobny/psichopodobny-and-uikole/tree/main', 'https://github.com/psichopodobny/psichopodobny-and-uikole/settings', 'https://github.com/login','https://github.com/settings','https://github.com/notifications','https://github.com/pulls', 'https://someone@github.com/psichopodobny']) assert.equal(routeFor(url), null, url);
});
test('manifest has only local storage permission and all files are packaged', () => {
  const dir = path.resolve(__dirname, '../extension');
  const manifest = JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.equal(manifest.background, undefined);
  assert.equal(manifest.host_permissions, undefined);
  assert.deepEqual(manifest.content_scripts[0].matches,['https://github.com/*']);
  const names = [...Object.values(manifest.icons), manifest.action.default_popup, ...manifest.content_scripts.flatMap(x => [...x.js,...x.css]), ...manifest.web_accessible_resources.flatMap(x=>x.resources)];
  for (const name of names) assert.ok(fs.existsSync(path.join(dir,name)), name);
  const scripts = fs.readdirSync(dir).filter(x=>x.endsWith('.js')).map(x=>fs.readFileSync(path.join(dir,x),'utf8')).join('\n');
  assert.doesNotMatch(scripts, /\b(?:fetch|XMLHttpRequest|WebSocket|eval)\s*\(/);
  assert.doesNotMatch(scripts, /document\.cookie|chrome\.cookies|chrome\.identity/);
});
test('options reject CSS injection, remote backgrounds and invalid preference values',()=>{
  const {normalize}=require('../extension/options.js');
  const opts=normalize({accent:'red;display:none',font:'evil',customBackground:'https://example.com/track.png',motion:'true',background:'evil'},false);
  assert.equal(opts.accent,'#d0e0ed');assert.equal(opts.font,'system');assert.equal(opts.customBackground,'');assert.equal(opts.motion,false);assert.equal(opts.background,'forest');
  assert.equal(normalize({accent:'#aabbcc',font:'mono',customBackground:'data:image/png;base64,YQ=='}).accent,'#aabbcc');
});
