'use strict';
(async () => {
  const extensionAPI = globalThis.browser || globalThis.chrome;
  const {keys,normalize} = PCWinterOptions;
  const controls = ['enabled','motion','snow','background','accent','font'];
  const fields = Object.fromEntries(controls.map(key => [key,document.getElementById(key)]));
  const status = document.getElementById('status');
  let preferences = normalize({},!matchMedia('(prefers-reduced-motion: reduce)').matches);
  function render() {
    controls.forEach(key => {
      if (fields[key].type === 'checkbox') fields[key].checked = preferences[key];
      else fields[key].value = preferences[key];
    });
  }
  try { preferences = normalize(await extensionAPI.storage.local.get(keys),preferences.motion); render(); }
  catch { status.textContent = 'Не удалось прочитать настройки.'; }
  controls.forEach(key => fields[key].addEventListener('change',async () => {
    if (key === 'background' && fields[key].value === 'custom' && !preferences.customBackground) {
      fields[key].value = preferences.background; document.getElementById('upload').click(); return;
    }
    const value = fields[key].type === 'checkbox' ? fields[key].checked : fields[key].value;
    try { await extensionAPI.storage.local.set({[key]:value}); status.textContent = 'Сохранено'; }
    catch { status.textContent = 'Не удалось сохранить настройки.'; }
  }));
  extensionAPI.storage.onChanged.addListener((changes,area) => {
    if (area !== 'local') return;
    preferences = normalize({...preferences,...Object.fromEntries(Object.entries(changes).map(([k,v])=>[k,v.newValue]))},preferences.motion);
    render();
  });
  document.getElementById('upload').addEventListener('change',async event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size>4*1024*1024) {status.textContent='Выбери PNG, JPG или WebP до 4 МБ.';return;}
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1,2560/Math.max(bitmap.width,bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width*scale); canvas.height = Math.round(bitmap.height*scale);
      canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
      const data = canvas.toDataURL('image/webp',.94);
      await extensionAPI.storage.local.set({customBackground:data,background:'custom'});
      status.textContent='Фон сохранён только в этом браузере.';
    } catch { status.textContent='Не удалось загрузить изображение.'; }
  });
  document.getElementById('reset').addEventListener('click',async () => {
    const defaults=normalize({},!matchMedia('(prefers-reduced-motion: reduce)').matches);
    await extensionAPI.storage.local.set(defaults); status.textContent='Оформление сброшено';
  });
  document.getElementById('personal').addEventListener('click',()=>extensionAPI.tabs.create({url:'https://github.com/psichopodobny'}));
  document.getElementById('duo').addEventListener('click',()=>extensionAPI.tabs.create({url:'https://github.com/psichopodobny/psichopodobny-and-uikole'}));
})();
