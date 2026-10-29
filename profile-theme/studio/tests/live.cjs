// Fresh Chromium profile, public unauthenticated pages only.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..'),ext=path.join(base,'extension'),art=path.join(base,'test-results');
(async()=>{const context=await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(),'studio-live-')),{channel:'chromium',headless:true,viewport:{width:1440,height:1000},args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`]});
try{
 const page=await context.newPage();await page.goto('https://github.com/octocat',{waitUntil:'domcontentloaded',timeout:60000});await page.locator('#pc-theme-root').waitFor();
 const origin=await page.locator('#pc-theme-root').evaluate(n=>new URL(n.shadowRoot.querySelector('link').href).origin),settings=await context.newPage();await settings.goto(origin+'/studio.html');
 const font='data:font/ttf;base64,'+fs.readFileSync('C:/Windows/Fonts/consola.ttf').toString('base64');
 await settings.evaluate(font=>chrome.storage.local.set({profiles:{octocat:{font:'custom',customFont:font,frame:'orbit',accent:'#81e5bd',secondary:'#8daeff',background:'aurora'}}}),font);
 await page.waitForFunction(()=>document.querySelector('main').dataset.pcFontStatus==='loaded');assert.ok(await page.locator('.pc-avatar-frame').count());assert.equal(await page.locator('.vcard-names .p-nickname').textContent().then(v=>v.trim()),'octocat');
 await page.screenshot({path:path.join(art,'github-native-live.png')});
 await page.goto('https://github.com/psichopodobny/psichopodobny-and-uikole',{waitUntil:'domcontentloaded'});await page.locator('.uiko-half .duo-art img').waitFor();await page.waitForFunction(()=>document.querySelector('#pc-theme-root').shadowRoot.querySelector('.uiko-half img').naturalWidth>0);
 const image=page.locator('.uiko-half .duo-art img');assert.equal(await image.evaluate(n=>n.naturalWidth),1920);assert.equal(await image.evaluate(n=>getComputedStyle(n).filter),'none');
 await page.screenshot({path:path.join(art,'github-duo-live.png')});
 fs.writeFileSync(path.join(art,'live-verification.json'),JSON.stringify({browser:context.browser().version(),publicPages:['https://github.com/octocat','https://github.com/psichopodobny/psichopodobny-and-uikole'],customFontLoadedWithGitHubCSP:true,nativeLoginPreserved:true,uikoleOriginalColorImage:{width:1920,filter:'none'},firefoxRuntimeTested:false},null,2));console.log('Public GitHub: custom font and native frame work; login and full-color K-ON image preserved.');
}finally{await context.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
