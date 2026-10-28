(function (root) {
  'use strict';
  const keys = ['enabled','motion','snow','background','customBackground','accent','font'];
  const fonts = {system:'"Segoe UI",system-ui,sans-serif',mono:'Consolas,"Courier New",monospace',serif:'Georgia,"Times New Roman",serif'};
  const appearanceKeys = keys.filter(key => key !== 'enabled');
  const storageKeys = [...keys,'profiles'];
  function loginFor(value) {
    const name = typeof value === 'string' ? value.trim().replace(/^@/,'').toLowerCase() : '';
    return /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/.test(name) ? name : null;
  }
  function normalize(input = {}, motion = true) {
    const bool = (key, fallback) => typeof input[key] === 'boolean' ? input[key] : fallback;
    const custom = typeof input.customBackground === 'string' && input.customBackground.length <= 7000000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(input.customBackground) ? input.customBackground : '';
    return {enabled:bool('enabled',true),motion:bool('motion',motion),snow:bool('snow',true),
      background:['forest','lake','custom'].includes(input.background) ? input.background : 'forest',
      customBackground:custom,accent:/^#[0-9a-f]{6}$/i.test(input.accent || '') ? input.accent : '#d0e0ed',
      font:Object.hasOwn(fonts,input.font) ? input.font : 'system'};
  }
  function overrides(input, motion = true) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
    const valid = normalize(input,motion);
    return Object.fromEntries(appearanceKeys.filter(key => Object.hasOwn(input,key)).map(key => [key,valid[key]]));
  }
  function normalizeState(input = {}, motion = true) {
    const entries = input.profiles && typeof input.profiles === 'object' && !Array.isArray(input.profiles) ? Object.entries(input.profiles) : [];
    const profiles = Object.fromEntries(entries.filter(([name]) => loginFor(name) === name).slice(0,50).map(([name,value])=>[name,overrides(value,motion)]));
    return {...normalize(input,motion),profiles};
  }
  function effective(input, login, motion = true) {
    const state = normalizeState(input,motion), name = loginFor(login);
    return normalize({...state,...(name && Object.hasOwn(state.profiles,name) ? state.profiles[name] : {})},motion);
  }
  function appearanceChanges(input, login, patch) {
    const state = normalizeState(input), changes = overrides(patch);
    if (!login) return changes;
    const name = loginFor(login);
    if (!name) throw new Error('Введи корректный ник GitHub.');
    if (!Object.hasOwn(state.profiles,name) && Object.keys(state.profiles).length >= 50) throw new Error('Достигнут лимит 50 отдельных профилей.');
    return {profiles:{...state.profiles,[name]:{...(Object.hasOwn(state.profiles,name)?state.profiles[name]:{}),...changes}}};
  }
  function serializeTheme(preferences) {
    const valid = normalize(preferences);
    if(valid.background !== 'custom') valid.customBackground = '';
    return JSON.stringify({format:'winter-profile-theme',version:1,name:'Winter Profile',appearance:Object.fromEntries(appearanceKeys.map(key=>[key,valid[key]]))},null,2);
  }
  function parseTheme(text) {
    if (typeof text !== 'string' || text.length > 8000000) throw new Error('Файл темы слишком большой.');
    let theme;
    try { theme = JSON.parse(text); } catch { throw new Error('Не удалось прочитать JSON-файл темы.'); }
    if (!theme || theme.format !== 'winter-profile-theme' || theme.version !== 1 || Object.keys(theme).some(key=>!['format','version','name','appearance'].includes(key))) throw new Error('Неподдерживаемый формат темы.');
    if (theme.name != null && (typeof theme.name !== 'string' || theme.name.length > 80)) throw new Error('Некорректное название темы.');
    const appearance = theme.appearance;
    if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance) || Object.keys(appearance).some(key=>!appearanceKeys.includes(key))) throw new Error('Тема содержит неподдерживаемые настройки.');
    const valid = normalize(appearance);
    if (Object.keys(appearance).some(key=>appearance[key]!==valid[key]) || (valid.background === 'custom' && !valid.customBackground)) throw new Error('В теме указаны некорректные значения.');
    return {name:theme.name || 'Winter Profile',appearance:Object.fromEntries(appearanceKeys.map(key=>[key,valid[key]]))};
  }
  const api = {keys,appearanceKeys,storageKeys,fonts,normalize,loginFor,normalizeState,effective,appearanceChanges,serializeTheme,parseTheme};
  root.PCWinterOptions = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
