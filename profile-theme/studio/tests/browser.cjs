// Isolated QA only. Never connects to the user's Firefox session.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{pathToFileURL}=require('node:url');
const base=path.resolve(__dirname,'..'),ext=path.join(base,'extension'),art=path.join(base,'test-results');
const o=require(path.join(ext,'options.js')),presets=require(path.join(ext,'presets.js')),checks=[];
const fixture='<!doctype html><html><head><meta charset="utf-8"><style>body{background:#0d1117;color:white;font:16px Arial;margin:0}main{min-height:140vh;padding:30px}.vcard-names{padding:20px}.avatar-user{width:170px;height:170px}.Layout-main{margin-left:230px}article{padding:20px}</style></head><body><header>Native GitHub</header><main><aside><img class="avatar-user width-full" src="data:image/png;base64,'+fs.readFileSync(path.join(ext,'media/profile-avatar.png')).toString('base64')+'" srcset=""><div class="vcard-names"><span class="p-name">Original Name</span><span class="p-nickname">demo-user</span></div><div class="p-note"><b>Original bio</b></div></aside><div class="Layout-main"><article class="markdown-body"><h1>Original README</h1><button id="retained">Event listener</button></article><a id="repo" href="/demo-user/project">Real project</a></div></main></body></html>';
async function main(){
 fs.mkdirSync(art,{recursive:true});
 for(const p of presets){const t=o.parseTheme(fs.readFileSync(path.join(base,'packs',p.id+'.json'),'utf8'));assert.equal(t.name,p.name);assert.equal(t.appearance.accent,p.accent);assert.ok(!Object.hasOwn(t.appearance,'customAvatar'));}
 assert.equal(o.parseTheme(JSON.stringify({format:'winter-profile-theme',version:1,appearance:{accent:'#abcdef',font:'mono'}})).appearance.font,'mono');
 for(const bad of [{css:'body{}'},{customAvatar:'https://evil.example/p.png'},{customFont:'data:text/html;base64,AAEAAA=='},{accent:'red;display:none'},{frameSpeed:0},{font:'url(evil)'}])assert.throws(()=>o.parseTheme(JSON.stringify({format:'winter-profile-theme',version:2,appearance:bad})));
 assert.throws(()=>o.appearanceChanges({},null,{displayName:'Wrong everywhere'}));assert.equal(o.effective({profiles:{a:{bio:'Only a'}}},'b').bio,'');
 const exported=JSON.parse(o.serializeTheme({...o.defaults,bio:'private',displayName:'private',customAvatar:'data:image/png;base64,AAAA'},{name:'Safe'}));assert.ok(!Object.hasOwn(exported.appearance,'bio'));
 checks.push('all six packs import; v1 compatibility; rejects CSS/remote images/invalid fonts; personal content is profile-scoped and excluded from default exports');
 const context=await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(),'studio-qa-')),{channel:'chromium',headless:true,viewport:{width:1500,height:1050},args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`]});
 const errors=[];context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
 try{
  await context.route('https://github.com/**',r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:fixture}));
  const page=await context.newPage();await page.goto('https://github.com/demo-user');await page.locator('#pc-theme-root').waitFor();
  const origin=await page.locator('#pc-theme-root').evaluate(n=>new URL(n.shadowRoot.querySelector('link').href).origin);
  await page.locator('#retained').evaluate(n=>{window.retainedClicks=0;n.addEventListener('click',()=>window.retainedClicks++);});
  const studio=await context.newPage();await studio.goto(origin+'/studio.html?profile=demo-user');await studio.locator('.preset').last().waitFor();assert.equal(await studio.locator('.preset').count(),6);
  assert.match(await studio.locator('#mode').textContent(),/Редактор расширения/);
  for(const p of presets){await studio.locator('[data-preset="'+p.id+'"]').click();assert.equal(await studio.locator('#background').inputValue(),p.background);assert.equal(await studio.locator('#frame').inputValue(),p.frame);}
  await studio.locator('[data-preset="neon"]').click();await studio.locator('#save').click();await studio.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Оформление сохранено'));
  await page.waitForFunction(()=>document.querySelector('.pc-avatar-frame')?.dataset.frame==='neon');
  assert.equal(await studio.evaluate(()=>chrome.storage.local.get('accent')).then(r=>r.accent),undefined);
  await studio.locator('#personal-fields').evaluate(n=>n.open=true);await studio.locator('#displayName').fill('Custom Demo');await studio.locator('#bio').fill('Changed locally');await studio.locator('#about').fill('<script>not executable</script>');
  await studio.locator('#avatar-file').setInputFiles(path.join(ext,'media/profile-avatar.png'));await studio.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Изображение добавлено'));
  await studio.locator('#font-file').setInputFiles('C:/Windows/Fonts/consola.ttf');await studio.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Шрифт загружен'));
  await studio.locator('#save').click();await studio.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Оформление сохранено'));
  await page.waitForFunction(()=>document.querySelector('.p-name').textContent==='Custom Demo');assert.equal(await page.locator('.p-note').textContent(),'Changed locally');assert.equal(await page.locator('article.markdown-body').textContent(),'<script>not executable</script>');assert.equal(await page.locator('article.markdown-body script').count(),0);
  await page.waitForFunction(()=>document.querySelector('main').dataset.pcFontStatus==='loaded');assert.match(await page.locator('.avatar-user').getAttribute('src'),/^data:image\/webp/);assert.equal(await page.locator('#repo').getAttribute('href'),'/demo-user/project');
  checks.push('MV3 Studio saves presets, uploaded avatar and real TTF; local text uses textContent and native repository links remain intact');
  const other=await context.newPage();await other.goto('https://github.com/other-user');await other.locator('#pc-theme-root').waitFor();assert.equal(await other.locator('.p-name').textContent(),'Original Name');
  // Disabling must restore original DOM nodes and their event handlers.
  await page.evaluate(()=>{document.querySelector('article').dataset.listener='original';});
  const personal=await context.newPage();await personal.goto('https://github.com/psichopodobny');await personal.locator('.winter-view').waitFor();assert.equal(await personal.locator('.portrait img').evaluate(n=>n.naturalWidth),1080);
  await studio.evaluate(()=>chrome.storage.local.set({enabled:false}));await page.locator('#pc-theme-root').waitFor({state:'detached'});assert.equal(await page.locator('.p-name').textContent(),'Original Name');assert.equal(await page.locator('.p-note b').textContent(),'Original bio');assert.equal(await page.locator('#retained').count(),1);assert.equal(await page.locator('.pc-avatar-frame').count(),0);assert.equal(await page.locator('.avatar-user').getAttribute('srcset'),'');
  // The restored original button object kept its event listener.
  await page.locator('#retained').click();assert.equal(await page.evaluate(()=>window.retainedClicks),1);
  await studio.evaluate(()=>chrome.storage.local.set({enabled:true}));await page.locator('#pc-theme-root').waitFor();
  checks.push('other profiles retain identities; custom owner view keeps original 1080px Arima; disabling restores original DOM, image attributes and removes frame');
  const downloadEvent=studio.waitForEvent('download');await studio.locator('#export').click();const download=await downloadEvent;const text=fs.readFileSync(await download.path(),'utf8');const safe=JSON.parse(text);assert.ok(!Object.hasOwn(safe.appearance,'displayName'));assert.ok(safe.appearance.customFont.length>10000);
  await studio.locator('#include-personal').check();const fullEvent=studio.waitForEvent('download');await studio.locator('#export').click();const full=JSON.parse(fs.readFileSync(await (await fullEvent).path(),'utf8'));assert.equal(full.appearance.displayName,'Custom Demo');
  const before=await studio.evaluate(()=>chrome.storage.local.get(null));await studio.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"format":"winter-profile-theme","version":2,"appearance":{"script":"bad"}}')});await studio.waitForFunction(()=>document.getElementById('status').textContent.includes('неподдерживаемые'));assert.deepEqual(await studio.evaluate(()=>chrome.storage.local.get(null)),before);
  await studio.locator('#reset').click();await studio.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Сохранённое оформление сброшено'));await page.waitForFunction(()=>document.querySelector('.p-name').textContent==='Original Name');
  await studio.locator('#import-file').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(text)});await studio.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Тема загружена в предпросмотр'));await studio.locator('#save').click();await studio.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Оформление сохранено'));assert.equal(await studio.locator('#font').inputValue(),'custom');
  checks.push('export omits avatar/text unless opted in; font round-trips; unsafe import leaves storage unchanged; profile reset restores originals');
  // Standalone EXE opens this exact local page, without extension storage APIs.
  const local=await context.newPage();await local.goto(pathToFileURL(path.join(ext,'studio.html')).href);await local.locator('.preset').last().waitFor();assert.match(await local.locator('#mode').textContent(),/Редактор файла темы/);
  await local.locator('[data-preset="aurora"]').click();await local.locator('#save').click();await local.waitForFunction(()=>document.getElementById('status').textContent.startsWith('Черновик сохранён'));await local.reload();await local.waitForFunction(()=>document.getElementById('background').value==='aurora');
  await local.locator('[data-preset="frost"]').click();await local.screenshot({path:path.join(art,'studio-desktop.png'),fullPage:false});
  await local.setViewportSize({width:390,height:844});assert.equal(await local.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await local.screenshot({path:path.join(art,'studio-mobile.png'),fullPage:false});
  await local.emulateMedia({reducedMotion:'reduce'});assert.equal(await local.locator('.preview-fog').evaluate(n=>getComputedStyle(n).animationName),'none');
  checks.push('standalone file editor stores local draft; responsive mobile layout has no horizontal overflow; reduced-motion disables animations');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(art,'verification.json'),JSON.stringify({browser:context.browser().version(),checks,pageErrors:errors,firefoxRuntimeTested:false},null,2));console.log(JSON.stringify({passed:checks.length,checks},null,2));
 }finally{await context.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
