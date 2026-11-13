(async function () {
  "use strict";
  const api = globalThis.browser || globalThis.chrome,
    $ = (id) => document.getElementById(id),
    o = PCWinterOptions;
  const installed = Boolean(api?.runtime?.id && api?.storage?.local);
  let name = "";
  const status = (text) => ($("status").textContent = text);
  const openPage = (page) => {
    if (installed) api.tabs.create({ url: api.runtime.getURL(page) });
    else location.href = page;
  };
  if (!installed) {
    for (const key of ["enabled", "showPublished", "styleUnpublished"])
      $(key).disabled = true;
    $("clear-profile").disabled = true;
    status("Локальный предпросмотр. Для настройки профиля открой редактор.");
  }
  try {
    if (installed) {
      const state = await api.storage.local.get([
        "enabled",
        "showPublished",
        "styleUnpublished",
      ]);
      for (const k of ["enabled", "showPublished", "styleUnpublished"])
        $(k).checked = state[k] ?? o.defaults[k];
      const [tab] = await api.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        try {
          const ctx = await api.tabs.sendMessage(tab.id, {
            type: "winter-profile-context",
          });
          name = o.loginFor(ctx?.login) || "";
          $("profile-login").value = name;
        } catch {}
      }
    }
  } catch {
    status("Не удалось прочитать настройки.");
  }
  for (const key of ["enabled", "showPublished", "styleUnpublished"])
    $(key).addEventListener("change", async () => {
      try {
        if (
          key === "showPublished" &&
          $(key).checked &&
          !(await PCStudioConsent.request())
        ) {
          $(key).checked = false;
          status("Загрузка тем не включена.");
          return;
        }
        await api.storage.local.set({ [key]: $(key).checked });
        status("Сохранено.");
      } catch (e) {
        status(e.message);
      }
    });
  function selected() {
    return o.loginFor($("profile-login").value) || name;
  }
  $("studio").addEventListener("click", () =>
    openPage("studio.html" + (selected() ? "?profile=" + selected() : "")),
  );
  $("gallery").addEventListener("click", () => openPage("gallery.html"));
  $("open-profile").addEventListener("click", () => {
    const login = selected();
    if (!login) {
      status("Введи GitHub-ник.");
      return;
    }
    const url = "https://github.com/" + login;
    if (installed) api.tabs.create({ url });
    else location.href = url;
  });
  $("clear-profile").addEventListener("click", async () => {
    const login = selected();
    if (!login) {
      status("Открой профиль GitHub или введи ник.");
      return;
    }
    try {
      const state = o.normalizeState(
          await api.storage.local.get(o.storageKeys),
        ),
        profiles = { ...state.profiles };
      delete profiles[login];
      await api.storage.local.set({ profiles });
      status("Локальная тема @" + login + " убрана.");
    } catch (e) {
      status(e.message);
    }
  });
})();
