const {test}=require('node:test'),assert=require('node:assert/strict');
const options=require('../extension/options.js');
test('old settings migrate and per-profile changes inherit without changing other profiles',()=>{
 const old={font:'mono',accent:'#123456',snow:false};
 const migrated=options.normalizeState(old);
 assert.deepEqual(migrated.profiles,{});
 const changes=options.appearanceChanges(migrated,'@Demo-Dev',{accent:'#aabbcc'});
 const state={...migrated,...changes};
 assert.equal(options.effective(state,'demo-dev').accent,'#aabbcc');
 assert.equal(options.effective(state,'demo-dev').font,'mono');
 assert.equal(options.effective(state,'someone-else').accent,'#123456');
 assert.equal(state.accent,'#123456');
 assert.equal(options.effective({...state,enabled:false},'demo-dev').enabled,false);
 assert.equal(options.loginFor(' @Demo-Dev '),'demo-dev');
 assert.equal(options.loginFor('../../settings'),null);
});
test('shared theme round trips appearance without usernames, switches or inactive pictures',()=>{
 const preferences=options.effective({enabled:false,font:'serif',background:'lake',customBackground:'data:image/png;base64,YQ==',profiles:{'private-profile':{accent:'#fedcba'}}},'private-profile');
 const serialized=options.serializeTheme(preferences),parsed=options.parseTheme(serialized);
 assert.equal(parsed.appearance.accent,'#fedcba');assert.equal(parsed.appearance.font,'serif');
 assert.equal(parsed.appearance.customBackground,'');
 assert.doesNotMatch(serialized,/private-profile|profiles|enabled|data:image/);
 const custom=options.parseTheme(options.serializeTheme({...preferences,background:'custom'}));
 assert.equal(custom.appearance.customBackground,'data:image/png;base64,YQ==');
});
test('theme imports reject executable styling, remote URLs, bad schemas and invalid values',()=>{
 const theme=appearance=>JSON.stringify({format:'winter-profile-theme',version:1,appearance});
 for(const appearance of [{css:'body{display:none}'},{script:'alert(1)'},{enabled:false},{font:'remote-font'},{accent:'red;display:none'},{background:'custom',customBackground:'https://example.com/track'},{background:'custom'},{customBackground:'data:image/svg+xml;base64,YQ=='},{snow:'true'}]) assert.throws(()=>options.parseTheme(theme(appearance)));
 for(const text of ['null','[]','{}','not json',JSON.stringify({format:'winter-profile-theme',version:2,appearance:{}}),JSON.stringify({format:'winter-profile-theme',version:1,appearance:{},profiles:{}})])assert.throws(()=>options.parseTheme(text));
 assert.throws(()=>options.parseTheme('x'.repeat(8000001)));
});
