(function (root) {
  'use strict';
  function start({window: win, document: doc, storage, asset, routeFor, createView}) {
    const media = win.matchMedia('(prefers-reduced-motion: reduce)');
    const options = root.PCWinterOptions;
    let state = options.normalizeState({}, !media.matches);
    const login = () => options.loginFor(win.location.pathname.split('/')[1]);
    let preferences = options.effective(state,login(),!media.matches);
    let ready = false, disposed = false, scheduled = false, mounting = false, current = null;
    const listeners = ['turbo:load', 'turbo:render', 'pjax:end', 'popstate'];
    function unmount() {
      if (current) {
        current.view.destroy();
        current.root.remove();
        current.main.removeAttribute('data-pc-main');
        current.main.removeAttribute('data-pc-native');
        current.main.removeAttribute('data-pc-motion');
        current.main.style.removeProperty('--pc-accent');
        current.main.style.removeProperty('--pc-font');
        current = null;
      }
      doc.documentElement.removeAttribute('data-pc-theme');
    }
    async function preference(key, value) {
      if (!options.keys.includes(key)) return;
      const name = login();
      const target = name && Object.hasOwn(state.profiles,name) ? name : null;
      const changes = key === 'enabled' ? {enabled:value} : options.appearanceChanges(state,target,{[key]:value});
      state = options.normalizeState({...state,...changes},!media.matches);
      preferences = options.effective(state,name,!media.matches);
      sync();
      try { await storage.set(changes); } catch { /* Current tab still responds when extension storage is unavailable. */ }
    }
    function sync() {
      if (disposed || !ready || mounting) return;
      preferences = options.effective(state,login(),!media.matches);
      const route = routeFor(win.location.href);
      const main = doc.querySelector('main') || doc.querySelector('[role="main"]');
      const native = route === 'profile';
      const profileLogin = win.location.pathname.split('/')[1];
      if (!preferences.enabled || !route || !main || (native && !main.querySelector('.vcard-names .p-nickname, .vcard-names .vcard-username'))) { unmount(); return; }
      const styleNative = () => {
        if (!native) return;
        main.style.setProperty('--pc-accent', preferences.accent);
        main.style.setProperty('--pc-font', options.fonts[preferences.font]);
        main.setAttribute('data-pc-motion', String(preferences.motion));
      };
      if (current && current.route === route && current.profileLogin === profileLogin && current.main === main && current.root.isConnected) {
        current.view.update(preferences);
        styleNative();
        current.view.refreshNative?.(main);
        return;
      }
      unmount();
      mounting = true;
      let host, view;
      try {
        host = doc.createElement('div'); host.id = 'pc-theme-root';
        const shadow = host.attachShadow({mode: 'open'});
        const style = doc.createElement('link'); style.rel = 'stylesheet'; style.href = asset('theme.css');
        view = createView({document: doc, asset, route, preferences, onPreference: preference, onExit: () => preference('enabled', false), profileLogin: win.location.pathname.split('/')[1]});
        shadow.append(style, view.element);
        main.prepend(host);
        view.activate(win, main);
        current = {root: host, main, view, route, profileLogin};
        main.setAttribute(native ? 'data-pc-native' : 'data-pc-main', '');
        styleNative();
        doc.documentElement.setAttribute('data-pc-theme', native ? 'native' : 'on');
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
      state = options.normalizeState({...state, ...changes}, !media.matches);
      schedule();
    });
    const loaded = (async () => {
      try {
        const saved = await storage.get(options.storageKeys);
        state = options.normalizeState(saved, !media.matches);
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
