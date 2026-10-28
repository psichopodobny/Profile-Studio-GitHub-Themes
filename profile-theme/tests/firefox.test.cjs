const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.resolve(__dirname,'../firefox');
test('Firefox package declares Gecko identity, required host access and no data transmission',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
 assert.equal(manifest.version,'1.1.1');
 assert.equal(manifest.browser_specific_settings.gecko.id,'winter-profile@psichopodobny');
 assert.equal(manifest.browser_specific_settings.gecko.strict_min_version,'140.0');
 assert.deepEqual(manifest.browser_specific_settings.gecko.data_collection_permissions.required,['none']);
 assert.deepEqual(manifest.host_permissions,['https://github.com/*']);
 for(const f of manifest.content_scripts.flatMap(s=>[...s.js,...s.css]))assert.ok(fs.existsSync(path.join(dir,f)),f);
 assert.equal(fs.existsSync(path.join(dir,'META-INF')),false,'not signed yet');
});
test('content script uses Firefox browser namespace without depending on chrome',async()=>{
 let captured,listener;
 const browser={storage:{local:{get:async()=>({snow:false}),set:async()=>{}},onChanged:{addListener:fn=>listener=fn,removeListener:()=>{}}},runtime:{getURL:p=>'moz-extension://fixture/'+p}};
 const win={};win.top=win;
 vm.runInNewContext(fs.readFileSync(path.join(dir,'content.js'),'utf8'),{window:win,document:{},browser,PCWinterController:{start:args=>{captured=args;return{};}},PCWinterScope:{routeFor:()=>null},PCWinterView:{createView:()=>null}});
 assert.equal(captured.asset('theme.css'),'moz-extension://fixture/theme.css');
 assert.equal((await captured.storage.get(['snow'])).snow,false);
 let saved;
 captured.storage.subscribe(changes=>{saved=changes});
 listener({snow:{newValue:true}},'local');assert.equal(saved.snow,true);
});
