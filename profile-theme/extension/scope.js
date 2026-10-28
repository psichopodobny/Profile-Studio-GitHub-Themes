(function (root) {
  'use strict';
  function routeFor(input) {
    let url;
    try { url = new URL(input); } catch { return null; }
    if (url.origin !== 'https://github.com' || url.username || url.password) return null;
    const path = url.pathname.replace(/\/$/, '').toLowerCase();
    const tab = url.searchParams.get('tab');
    if (path === '/psichopodobny' && (!tab || tab === 'overview')) return 'personal';
    if (path === '/psichopodobny/psichopodobny-and-uikole' && !tab) return 'duo';
    return null;
  }
  root.PCWinterScope = {routeFor};
  if (typeof module !== 'undefined') module.exports = {routeFor};
})(globalThis);
