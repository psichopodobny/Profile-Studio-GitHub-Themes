'use strict';
(async () => {
  const extensionAPI = globalThis.browser || globalThis.chrome;
  const options = PCWinterOptions;
  const fields = Object.fromEntries(options.keys.filter(key=>key!=='customBackground').map(key=>[key,document.getElementById(key)]));
  const status = document.getElementById('status'), scope = document.getElementById('scope'), loginInput = document.getElementById('profile-login');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let state = options.normalizeState({},!reduced), selectedLogin = null;
  let writes = Promise.resolve(), profileTouched = false;
  const queue = work => { const next=writes.then(work); writes=next.catch(()=>{}); return next; };
  const target = () => scope.value === 'profile' ? selectedLogin : null;
  const read = async () => options.normalizeState(await extensionAPI.storage.local.get(options.storageKeys),!reduced);
  function render() {
    const preferences = options.effective(state,target(),!reduced);
    for (const [key,node] of Object.entries(fields)) {
      if (node.type === 'checkbox') node.checked = preferences[key];
      else node.value = preferences[key];
    }
    const profileOption = document.getElementById('profile-option');
    profileOption.disabled = !selectedLogin;
    profileOption.textContent = selectedLogin ? 'Только @'+selectedLogin : 'Для отдельного профиля';
    const individual = target();
    document.getElementById('scope-note').textContent = individual
      ? '@'+individual+': '+(Object.hasOwn(state.profiles,individual) ? 'отдельные настройки.' : 'пока используется общее оформление.')
      : 'Общее оформление. Отдельные настройки профилей сохраняются.';
    document.getElementById('reset').textContent = individual ? 'Вернуть общее оформление для @'+individual : 'Сбросить оформление';
  }
  async function commit(changes, latest) {
    latest = latest || await read();
    if (new Blob([JSON.stringify({...latest,...changes})]).size > 8*1024*1024) throw new Error('Слишком много сохранённых фонов. Удали лишние или выбери картинку поменьше.');
    await extensionAPI.storage.local.set(changes);
    state = await read(); render();
  }
  function saveAppearance(patch, login = target()) {
    return queue(async()=>{const latest=await read();await commit(options.appearanceChanges(latest,login,patch),latest);});
  }
  try { state = await read(); render(); } catch { status.textContent='Не удалось прочитать настройки.'; }
  extensionAPI.storage.onChanged.addListener((changes,area) => {
    if (area !== 'local') return;
    state = options.normalizeState({...state,...Object.fromEntries(Object.entries(changes).map(([key,value])=>[key,value.newValue]))},!reduced);
    render();
  });
  async function detectProfile() {
    try {
      const [tab] = await extensionAPI.tabs.query({active:true,currentWindow:true});
      if (tab?.id == null) return;
      const context = await extensionAPI.tabs.sendMessage(tab.id,{type:'winter-profile-context'});
      const name = options.loginFor(context?.login);
      if (name && !profileTouched) { selectedLogin=name; loginInput.value=name; render(); }
    } catch { /* A manually entered nickname is available when the current tab has no content script. */ }
  }
  void detectProfile();
  loginInput.addEventListener('input',()=>{profileTouched=true;});
  scope.addEventListener('change',()=>{ if(scope.value==='profile'&&!selectedLogin)scope.value='global';render();status.textContent=''; });
  document.getElementById('select-profile').addEventListener('click',()=>{
    const name=options.loginFor(loginInput.value);
    if(!name){status.textContent='Введи корректный ник GitHub.';return;}
    profileTouched=true;selectedLogin=name;loginInput.value=name;document.getElementById('profile-option').disabled=false;scope.value='profile';render();status.textContent='Настройки для @'+name;
  });
  fields.enabled.addEventListener('change',async()=>{
    const enabled=fields.enabled.checked;
    try {await queue(()=>commit({enabled}));status.textContent='Сохранено';}catch(error){status.textContent=error.message;}
  });
  for(const key of options.appearanceKeys.filter(key=>key!=='customBackground')) fields[key].addEventListener('change',async()=>{
    const current=options.effective(state,target(),!reduced);
    if(key==='background'&&fields[key].value==='custom'&&!current.customBackground){fields[key].value=current.background;document.getElementById('upload').click();return;}
    const value=fields[key].type==='checkbox'?fields[key].checked:fields[key].value;
    try {await saveAppearance({[key]:value});status.textContent='Сохранено';}catch(error){status.textContent=error.message;}
  });
  document.getElementById('upload').addEventListener('change',async event=>{
    const file=event.target.files[0],login=target();if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>4*1024*1024){status.textContent='Выбери PNG, JPG или WebP до 4 МБ.';return;}
    try{
      const bitmap=await createImageBitmap(file),scale=Math.min(1,2560/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
      canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
      await saveAppearance({customBackground:canvas.toDataURL('image/webp',.94),background:'custom'},login);
      status.textContent='Фон сохранён только в этом браузере.';
    }catch(error){status.textContent=error.message||'Не удалось загрузить изображение.';}
    event.target.value='';
  });
  document.getElementById('reset').addEventListener('click',async()=>{
    const selected=target();
    try{
      await queue(async()=>{const latest=await read();if(selected){const profiles={...latest.profiles};delete profiles[selected];await commit({profiles},latest);}else await commit(options.normalize({},!reduced),latest);});
      status.textContent=selected?'Профиль использует общее оформление.':'Общее оформление сброшено.';
    }catch(error){status.textContent=error.message;}
  });
  document.getElementById('export').addEventListener('click',async()=>{
    const login=target();await writes;
    const contents=options.serializeTheme(options.effective(await read(),login,!reduced));
    const url=URL.createObjectURL(new Blob([contents],{type:'application/json'})),a=document.createElement('a');
    a.href=url;a.download='winter-profile-theme.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent='Файл темы содержит фон и оформление, без списка профилей.';
  });
  document.getElementById('import').addEventListener('click',()=>document.getElementById('import-file').click());
  document.getElementById('import-file').addEventListener('change',async event=>{
    const file=event.target.files[0],login=target();if(!file)return;
    try{
      if(file.size>8000000)throw new Error('Файл темы слишком большой.');
      const theme=options.parseTheme(await file.text());await saveAppearance(theme.appearance,login);
      status.textContent='Загружена тема: '+theme.name;
    }catch(error){status.textContent=error.message;}
    event.target.value='';
  });
  document.getElementById('personal').addEventListener('click',()=>extensionAPI.tabs.create({url:'https://github.com/psichopodobny'}));
  document.getElementById('duo').addEventListener('click',()=>extensionAPI.tabs.create({url:'https://github.com/psichopodobny/psichopodobny-and-uikole'}));
})();
