(function () {
  "use strict";
  const $ = (id) => document.getElementById(id),
    api = /^(moz|chrome)-extension:$/.test(location.protocol)
      ? globalThis.browser || globalThis.chrome
      : null,
    share = PCStudioSharing;
  let request = 0;
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }
  function status(text) {
    $("gallery-status").textContent = text;
  }
  function card(item, local) {
    const n = el("div", "theme-card"),
      art = el("div", "theme-art");
    art.style.setProperty("--art-accent", item.accent);
    art.style.setProperty(
      "--art-bg",
      `radial-gradient(ellipse at 90% 10%,${item.accent}66,transparent 70%),#111924`,
    );
    n.append(
      art,
      el("b", "", item.name),
      el("small", "", local ? item.label : "@" + item.owner),
    );
    if (local || item.appearance)
      PCStudioBackgrounds.thumbnail(
        art,
        PCWinterOptions.normalize({
          ...PCWinterOptions.defaults,
          ...item.appearance,
        }),
      );
    const a = el(
      "a",
      "button secondary",
      local ? "Открыть в Studio ↗" : "Сделать свою версию ↗",
    );
    a.href = local
      ? "studio.html?preset=" + item.id
      : "studio.html?remix=" +
        encodeURIComponent(item.owner) +
        "&file=" +
        encodeURIComponent(item.file) +
        (item.repo ? "&repo=" + encodeURIComponent(item.repo) : "");
    if (!local) {
      const profile = el("a", "button primary", "Смотреть профиль ↗");
      profile.href = "https://github.com/" + item.owner;
      profile.target = "_blank";
      profile.rel = "noopener noreferrer";
      n.append(profile);
    }
    if (local || item.allowRemix !== false) n.append(a);
    else n.append(el("small", "", "Автор отключил ремиксы"));
    return n;
  }
  for (const p of PCWinterPresets) $("built-in").append(card(p, true));
  async function send(message) {
    if (!api)
      throw Error(
        "Онлайн-темы доступны из установленного расширения. Сейчас открыт локальный HTML.",
      );
    if (!(await PCStudioConsent.request()))
      throw Error("Без разрешения онлайн-темы не загружаются.");
    const r = await api.runtime.sendMessage(message);
    if (!r?.ok) throw Error(r?.error || "Не удалось получить ответ GitHub.");
    return r;
  }
  $("load-community").addEventListener("click", async () => {
    const id = ++request;
    $("load-community").disabled = true;
    status("Читаем публичные заявки GitHub…");
    try {
      const r = await send({ type: "studio-gallery", refresh: true });
      if (id !== request) return;
      $("community").replaceChildren();
      $("community-count").textContent = r.entries.length + " ТЕМ";
      if (!r.entries.length)
        $("community").append(
          el(
            "div",
            "empty-state",
            "В каталоге ещё нет опубликованных тем. Можно начать со своей.",
          ),
        );
      r.entries.forEach((p) => $("community").append(card(p, false)));
      status("Каталог загружен. Содержимое темы проверяется при открытии.");
    } catch (e) {
      status(e.message);
    } finally {
      $("load-community").disabled = false;
    }
  });
  $("load-owner").addEventListener("click", async () => {
    const id = ++request,
      owner = PCWinterOptions.loginFor($("owner").value);
    if (!owner) {
      status("Введи корректный GitHub-ник.");
      return;
    }
    status("Ищем тему @" + owner + "…");
    try {
      const r = await send({
        type: "studio-find-owner",
        owner,
        refresh: true,
      });
      if (id !== request) return;
      if (!r.theme)
        throw Error("У @" + owner + " нет публичного profile-studio.json.");
      $("community").replaceChildren(
        card(
          {
            owner,
            file: share.FILE,
            ...(r.ref || {}),
            name: r.theme.theme.name,
            accent: r.theme.theme.appearance.accent || "#a8c8e5",
            appearance: r.theme.theme.appearance,
            allowRemix: r.theme.allowRemix,
          },
          false,
        ),
      );
      $("community-count").textContent = "@" + owner;
      status(
        r.theme.allowRemix
          ? "Тема найдена. Можно открыть для ремикса."
          : "Тема найдена. Автор отключил ремиксы.",
      );
    } catch (e) {
      status(e.message);
    }
  });
  $("suggest-form").addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const owner = PCWinterOptions.loginFor($("suggest-owner").value);
      if (!owner) throw Error("Введи корректный ник.");
      const url = share.issueURL({
        owner,
        file: share.FILE,
        name: $("suggest-name").value,
        description: $("suggest-description").value,
      });
      window.open(url, "_blank", "noopener,noreferrer");
      status("Открыт черновик. Проверь его и отправь самостоятельно.");
    } catch (e) {
      status(e.message);
    }
  });
})();
