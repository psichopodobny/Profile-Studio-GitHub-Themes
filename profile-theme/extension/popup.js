'use strict';
(async () => {
  const keys = ['enabled', 'motion', 'snow'];
  const fields = Object.fromEntries(keys.map(key => [key, document.getElementById(key)]));
  const status = document.getElementById('status');
  try {
    const saved = await chrome.storage.local.get(keys);
    const defaults = {enabled: true, motion: !matchMedia('(prefers-reduced-motion: reduce)').matches, snow: true};
    keys.forEach(key => { fields[key].checked = typeof saved[key] === 'boolean' ? saved[key] : defaults[key]; });
  } catch { status.textContent = 'Не удалось прочитать настройки.'; }
  keys.forEach(key => fields[key].addEventListener('change', async () => {
    try { await chrome.storage.local.set({[key]: fields[key].checked}); status.textContent = 'Сохранено'; }
    catch { status.textContent = 'Не удалось сохранить настройки.'; }
  }));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    keys.forEach(key => {
      if (typeof changes[key]?.newValue === 'boolean') fields[key].checked = changes[key].newValue;
    });
  });
  document.getElementById('personal').addEventListener('click', () => chrome.tabs.create({url: 'https://github.com/psichopodobny'}));
  document.getElementById('duo').addEventListener('click', () => chrome.tabs.create({url: 'https://github.com/psichopodobny/psichopodobny-and-uikole'}));
})();
