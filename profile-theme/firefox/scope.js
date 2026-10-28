(function (root) {
  'use strict';
  const reserved = new Set(['about','account','apps','business','codespaces','collections','contact','customer-stories','dashboard','enterprise','events','explore','features','github','issues','join','login','logout','marketplace','new','notifications','organizations','orgs','pricing','pulls','readme','search','security','sessions','settings','site','sponsors','team','topics','trending','users']);
  function routeFor(input) {
    let url;
    try { url = new URL(input); } catch { return null; }
    if (url.origin !== 'https://github.com' || url.username || url.password) return null;
    const path = url.pathname.replace(/\/$/, '').toLowerCase();
    const tab = url.searchParams.get('tab');
    if (path === '/psichopodobny' && (!tab || tab === 'overview')) return 'personal';
    if (path === '/psichopodobny/psichopodobny-and-uikole' && !tab) return 'duo';
    const login = path.slice(1);
    if (/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/.test(login) && !reserved.has(login)) return 'profile';
    return null;
  }
  root.PCWinterScope = {routeFor};
  if (typeof module !== 'undefined') module.exports = {routeFor};
})(globalThis);
