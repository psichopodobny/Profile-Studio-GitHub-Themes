(function(root){
  'use strict';
  const fonts={system:'"Segoe UI",system-ui,sans-serif',mono:'Consolas,"Courier New",monospace',serif:'Georgia,"Times New Roman",serif',rounded:'"Trebuchet MS",Verdana,sans-serif',book:'Cambria,Georgia,serif',custom:'"WinterUploaded",system-ui,sans-serif'};
  const defaults={enabled:true,motion:true,snow:true,background:'forest',customBackground:'',accent:'#d0e0ed',secondary:'#ffffff',font:'system',customFont:'',fontName:'',frame:'frost',frameSpeed:12,avatarShape:'circle',customAvatar:'',displayName:'',bio:'',headline:'',about:'',dim:55,blur:0};
  const keys=Object.keys(defaults),appearanceKeys=keys.filter(k=>k!=='enabled'),personalKeys=['customAvatar','displayName','bio','headline','about'],storageKeys=[...keys,'profiles'];
  const images=v=>typeof v==='string'&&v.length<=6000000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v)?v:'';
  function validFont(v){
    if(typeof v!=='string'||v.length>2800000||!/^data:font\/(ttf|otf|woff|woff2);base64,[A-Za-z0-9+/]+={0,2}$/.test(v))return '';
    return ['AAEAAA','T1RUTw','d09GRg','d09GMg'].includes(v.split(',')[1].slice(0,6))?v:'';
  }
  const text=(v,max)=>typeof v==='string'?v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').slice(0,max):'';
  function normalize(input={},motion=true){
    input=input&&typeof input==='object'?input:{};const v={...defaults,motion};
    for(const k of ['enabled','motion','snow'])if(typeof input[k]==='boolean')v[k]=input[k];
    for(const [k,allowed] of Object.entries({background:['forest','lake','midnight','neon','aurora','uikole','ember','custom'],font:Object.keys(fonts),frame:['none','frost','orbit','neon','pulse'],avatarShape:['circle','rounded']}))if(allowed.includes(input[k]))v[k]=input[k];
    for(const k of ['accent','secondary'])if(/^#[0-9a-f]{6}$/i.test(input[k]||''))v[k]=input[k];
    for(const [k,min,max] of [['frameSpeed',3,30],['dim',15,85],['blur',0,16]])if(Number.isFinite(input[k])&&input[k]>=min&&input[k]<=max)v[k]=input[k];
    v.customBackground=images(input.customBackground);v.customAvatar=images(input.customAvatar);v.customFont=validFont(input.customFont);v.fontName=text(input.fontName,80).replace(/[\\/]/g,'');
    for(const [k,max] of [['displayName',60],['bio',280],['headline',180],['about',6000]])v[k]=text(input[k],max);return v;
  }
  function loginFor(value){const name=typeof value==='string'?value.trim().replace(/^@/,'').toLowerCase():'';return /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/.test(name)?name:null;}
  function overrides(input){if(!input||typeof input!=='object'||Array.isArray(input))return {};const valid=normalize(input);return Object.fromEntries(appearanceKeys.filter(k=>Object.hasOwn(input,k)).map(k=>[k,valid[k]]));}
  function normalizeState(input={},motion=true){
    const entries=input.profiles&&typeof input.profiles==='object'&&!Array.isArray(input.profiles)?Object.entries(input.profiles):[];const base=normalize(input,motion);for(const k of personalKeys)base[k]='';
    return {...base,profiles:Object.fromEntries(entries.filter(([n])=>loginFor(n)===n).slice(0,50).map(([n,v])=>[n,overrides(v)]))};
  }
  function effective(input,login,motion=true){const state=normalizeState(input,motion),name=loginFor(login);return normalize({...state,...(name&&Object.hasOwn(state.profiles,name)?state.profiles[name]:{})},motion);}
  function appearanceChanges(input,login,patch){
    const state=normalizeState(input),changes=overrides(patch);
    if(!login){if(personalKeys.some(k=>changes[k]))throw Error('Аватар и текст сохраняются для конкретного GitHub-профиля.');return changes;}
    const name=loginFor(login);if(!name)throw Error('Введи корректный ник GitHub.');if(!Object.hasOwn(state.profiles,name)&&Object.keys(state.profiles).length>=50)throw Error('Достигнут лимит 50 профилей.');
    return {profiles:{...state.profiles,[name]:{...(Object.hasOwn(state.profiles,name)?state.profiles[name]:{}),...changes}}};
  }
  function serializeTheme(preferences,{name='Моя тема',includePersonal=false}={}){
    const v=normalize(preferences);if(v.background!=='custom')v.customBackground='';if(v.font!=='custom'){v.customFont='';v.fontName='';}
    return JSON.stringify({format:'winter-profile-theme',version:2,name:text(name,80),appearance:Object.fromEntries(appearanceKeys.filter(k=>includePersonal||!personalKeys.includes(k)).map(k=>[k,v[k]]))},null,2);
  }
  function parseTheme(source){
    if(typeof source!=='string'||source.length>8000000)throw Error('Файл темы слишком большой.');let theme;try{theme=JSON.parse(source);}catch{throw Error('Не удалось прочитать JSON-файл темы.');}
    if(!theme||theme.format!=='winter-profile-theme'||![1,2].includes(theme.version)||Object.keys(theme).some(k=>!['format','version','name','appearance'].includes(k)))throw Error('Неподдерживаемый формат темы.');
    if(theme.name!=null&&(typeof theme.name!=='string'||theme.name.length>80))throw Error('Некорректное название темы.');const a=theme.appearance;
    if(!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).some(k=>!appearanceKeys.includes(k)))throw Error('Тема содержит неподдерживаемые настройки.');const v=normalize(a);
    if(Object.keys(a).some(k=>a[k]!==v[k])||(v.background==='custom'&&!v.customBackground)||(v.font==='custom'&&!v.customFont))throw Error('В теме указаны некорректные значения.');
    return {name:theme.name||'Winter Profile',appearance:overrides(a)};
  }
  const api={keys,appearanceKeys,personalKeys,storageKeys,fonts,defaults,normalize,normalizeState,loginFor,effective,appearanceChanges,serializeTheme,parseTheme,validFont};root.PCWinterOptions=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
