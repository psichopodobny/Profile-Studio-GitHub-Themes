(function () {
  'use strict';
  if (window.top !== window || window.__pcWinter) return;
  const extensionAPI = globalThis.browser || globalThis.chrome;
  extensionAPI.runtime.onMessage.addListener((message,sender,respond) => {
    if (message?.type !== 'winter-profile-context' || (sender.id && sender.id !== extensionAPI.runtime.id)) return false;
    const route = PCWinterScope.routeFor(window.location.href);
    const personal = route && (route !== 'profile' || document.querySelector('.vcard-names .p-nickname, .vcard-names .vcard-username'));
    respond({login:personal ? PCWinterOptions.loginFor(window.location.pathname.split('/')[1]) : null});
    return false;
  });
  const storage = {
    get: keys => extensionAPI.storage.local.get(keys),
    set: data => extensionAPI.storage.local.set(data),
    subscribe: callback => {
      const listener = (changes, area) => {
        if (area !== 'local') return;
        callback(Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue])));
      };
      extensionAPI.storage.onChanged.addListener(listener);
      return () => extensionAPI.storage.onChanged.removeListener(listener);
    }
  };
  window.__pcWinter = PCWinterController.start({window, document, storage,
    asset: path => extensionAPI.runtime.getURL(path), routeFor: PCWinterScope.routeFor, createView: PCWinterView.createView});
})();
