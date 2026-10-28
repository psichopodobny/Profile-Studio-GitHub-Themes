(function (root) {
  'use strict';
  function start({window: win, document: doc, storage, asset, routeFor, createView}) {
    const media = win.matchMedia('(prefers-reduced-motion: reduce)');
    let preferences = {enabled: true, motion: !media.matches, snow: true};
    let ready = false, disposed = false, scheduled = false, mounting = false, current = null;
    const listeners = ['turbo:load', 'turbo:render', 'pjax:end', 'popstate'];
    function unmount() {
      if (current) {
        current.view.destroy();
        current.root.remove();
        current.main.removeAttribute('data-pc-main');
        current = null;
      }
      doc.documentElement.removeAttribute('data-pc-theme');
    }
    async function preference(key, value) {
      if (!['enabled', 'motion', 'snow'].includes(key) || typeof value !== 'boolean') return;
      preferences = {...preferences, [key]: value};
      sync();
      try { await storage.set({[key]: value}); } catch { /* Current tab still responds when extension storage is unavailable. */ }
    }
    function sync() {
      if (disposed || !ready || mounting) return;
      const route = routeFor(win.location.href);
      const main = doc.querySelector('main') || doc.querySelector('[role="main"]');
      if (!preferences.enabled || !route || !main) { unmount(); return; }
      if (current && current.route === route && current.main === main && current.root.isConnected) {
        current.view.update(preferences);
        return;
      }
      unmount();
      mounting = true;
      let host, view;
      try {
        host = doc.createElement('div'); host.id = 'pc-theme-root';
        const shadow = host.attachShadow({mode: 'open'});
        const style = doc.createElement('link'); style.rel = 'stylesheet'; style.href = asset('theme.css');
        view = createView({document: doc, asset, route, preferences, onPreference: preference, onExit: () => preference('enabled', false)});
        shadow.append(style, view.element);
        main.prepend(host);
        view.activate(win);
        current = {root: host, main, view, route};
        main.setAttribute('data-pc-main', '');
        doc.documentElement.setAttribute('data-pc-theme', 'on');
      } catch (error) {
        if (view) view.destroy();
        if (host) host.remove();
        main.removeAttribute('data-pc-main');
        doc.documentElement.removeAttribute('data-pc-theme');
        console.warn('Winter Profile: не удалось открыть оформление.', error);
      } finally { mounting = false; }
    }
    function schedule() {
      if (scheduled || disposed) return;
      scheduled = true;
      win.queueMicrotask(() => { scheduled = false; sync(); });
    }
    const observer = new win.MutationObserver(records => {
      if (records.some(record => record.type === 'childList')) schedule();
    });
    observer.observe(doc.documentElement, {childList: true, subtree: true});
    listeners.forEach(name => win.addEventListener(name, schedule));
    const stopStorage = storage.subscribe(changes => {
      for (const key of ['enabled', 'motion', 'snow']) if (typeof changes[key] === 'boolean') preferences[key] = changes[key];
      schedule();
    });
    const loaded = (async () => {
      try {
        const saved = await storage.get(['enabled', 'motion', 'snow']);
        for (const key of ['enabled', 'motion', 'snow']) if (typeof saved[key] === 'boolean') preferences[key] = saved[key];
      } catch { /* Defaults are intentionally usable without saved preferences. */ }
      ready = true;
      sync();
    })();
    return {loaded, sync, stop() {
      disposed = true; observer.disconnect();
      listeners.forEach(name => win.removeEventListener(name, schedule));
      if (stopStorage) stopStorage();
      unmount();
    }};
  }
  root.PCWinterController = {start};
  if (typeof module !== 'undefined') module.exports = {start};
})(globalThis);
