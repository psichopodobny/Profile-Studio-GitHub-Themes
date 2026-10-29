// Browser adaptation only. Uses Node.js built-ins; no network or npm install.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = __dirname;
const source = path.join(root, 'src');
const output = path.join(root, 'dist', 'firefox');
fs.cpSync(source, output, {recursive: true});
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'));
if (manifest.version !== '1.2.0') throw new Error('This source archive is for version 1.2.0.');
manifest.browser_specific_settings = {
  gecko: {
    id: 'winter-profile@psichopodobny',
    strict_min_version: '140.0',
    data_collection_permissions: {required: ['none']}
  },
  gecko_android: {strict_min_version: '142.0'}
};
manifest.host_permissions = ['https://github.com/*'];
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
for (const name of ['content.js', 'popup.js']) {
  let code = fs.readFileSync(path.join(output, name), 'utf8').replaceAll('chrome.', 'extensionAPI.');
  const marker = name === 'content.js' ? '  const storage = {' : '(async () => {';
  if (!code.includes('const extensionAPI =')) {
    const declaration = 'const extensionAPI = globalThis.browser || globalThis.chrome;';
    code = code.replace(marker, name === 'content.js' ? '  ' + declaration + '\n' + marker : marker + '\n  ' + declaration);
  }
  fs.writeFileSync(path.join(output, name), code);
}
const view = path.join(output, 'view.js');
fs.writeFileSync(view, fs.readFileSync(view, 'utf8').replace("? 'smooth' : 'instant'", "? 'smooth' : 'auto'"));
fs.writeFileSync(path.join(output, 'INSTALL.ru.txt'), 'WINTER PROFILE / FIREFOX 1.2.0\n\nЭта сборка подготовлена для отправки в Mozilla Add-ons.\nОна пока НЕ подписана и не является файлом для обычной постоянной установки.\nДля распространения через кнопку нужно сначала получить подпись Mozilla.\nМенеджер дополнений Firefox: about:addons.\nПубликация: https://addons.mozilla.org/developers/addon/submit/\nИсходники: https://github.com/psichopodobny/psichopodobny/tree/main/profile-theme\n');
const expected = JSON.parse(fs.readFileSync(path.join(root, 'expected-files.json'), 'utf8'));
function files(directory, prefix = '') {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const relative = prefix + entry.name;
    return entry.isDirectory() ? files(path.join(directory, entry.name), relative + '/') : [relative];
  });
}
const actual = files(output).sort();
if (JSON.stringify(actual) !== JSON.stringify(Object.keys(expected.files).sort())) throw new Error('File list differs from submitted Firefox package.');
for (const name of actual) {
  const bytes = fs.readFileSync(path.join(output, ...name.split('/')));
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  if (hash !== expected.files[name]) throw new Error('File contents differ: ' + name);
}
console.log('Built dist/firefox: all ' + actual.length + ' files match the submitted Firefox 1.2.0 package byte for byte.');
