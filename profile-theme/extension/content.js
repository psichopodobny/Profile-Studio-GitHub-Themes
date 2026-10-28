(function () {
  'use strict';
  if (window.top !== window || window.__pcWinter) return;
  const storage = {
    get: keys => chrome.storage.local.get(keys),
    set: data => chrome.storage.local.set(data),
    subscribe: callback => {
      const listener = (changes, area) => {
        if (area !== 'local') return;
        callback(Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, value.newValue])));
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  };
  window.__pcWinter = PCWinterController.start({window, document, storage,
    asset: path => chrome.runtime.getURL(path), routeFor: PCWinterScope.routeFor, createView: PCWinterView.createView});
})();
