(function (root) {
  "use strict";
  const api = globalThis.browser || globalThis.chrome;
  function firefox() {
    return Boolean(api?.runtime.getManifest().browser_specific_settings?.gecko);
  }
  async function granted() {
    if (!firefox()) return true;
    const permissions = await api.permissions.getAll();
    return permissions.data_collection?.includes("browsingActivity") === true;
  }
  async function request() {
    if (!firefox()) return true;
    return api.permissions.request({ data_collection: ["browsingActivity"] });
  }
  root.PCStudioConsent = { granted, request };
})(globalThis);
