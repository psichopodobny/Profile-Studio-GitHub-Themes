(async function () {
  "use strict";
  const $ = (id) => document.getElementById(id),
    o = PCWinterOptions,
    api = /^(moz|chrome)-extension:$/.test(location.protocol)
      ? globalThis.browser || globalThis.chrome
      : null;
  const icons = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    image:
      '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    cursor: '<path d="m5 3 14 10-7 1-4 7z"/>',
    type: '<path d="M4 5V3h16v2M12 3v18M8 21h8"/>',
    spark:
      '<path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z"/>',
    palette:
      '<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.7 1.7 0 0 1 .8-3.3H18a3 3 0 0 0 3-3 9 9 0 0 0-9-8Z"/><circle cx="7" cy="10" r=".8"/><circle cx="11" cy="7" r=".8"/><circle cx="16" cy="8" r=".8"/>',
    share:
      '<path d="M12 16V3m-5 5 5-5 5 5M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>',
    desktop:
      '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>',
    mobile:
      '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
    expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    undo: '<path d="m8 4-5 5 5 5M3 9h10a7 7 0 0 1 0 14"/>',
    redo: '<path d="m16 4 5 5-5 5m5-5H11a7 7 0 0 0 0 14"/>',
    upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
    ring: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1"/>',
    dot: '<circle cx="12" cy="12" r="3" fill="currentColor"/>',
    crosshair: '<path d="M12 2v20M2 12h20"/>',
    glow: '<circle cx="12" cy="12" r="7"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
    check: '<path d="m5 12 4 4L20 5"/>',
  };
  const icon = (name) =>
    document.importNode(
      new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.spark}</svg>`,
        "image/svg+xml",
      ).documentElement,
      true,
    );
  const skins = [
    ["black", "Black", "#e6e6e6", "#101010", "#181818"],
    ["white", "White", "#303030", "#f7f7f7", "#ffffff"],
    ["winter", "Winter", "#a8c8e5", "#101319", "#151920"],
    ["fire", "Fire", "#f0aa7b", "#171211", "#211916"],
    ["water", "Water", "#75d0e7", "#0e151b", "#131f27"],
    ["autumn", "Autumn", "#dcb38a", "#171510", "#201d16"],
    ["aurora", "Aurora", "#9adfbd", "#101713", "#16211c"],
    ["neon", "Neon", "#ba9af7", "#13111c", "#1c1728"],
    ["sakura", "Sakura", "#e6a9c3", "#191218", "#231a23"],
    ["sunset", "Sunset", "#efa9a2", "#1b1318", "#261b25"],
    ["graphite", "Graphite", "#c6cbd3", "#121315", "#1b1d20"],
    ["coffee", "Espresso", "#d4ba9e", "#171411", "#221e19"],
    ["lavender", "Lavender", "#beb0e9", "#15131d", "#201d2a"],
    ["terminal", "Terminal", "#9bdbab", "#101610", "#172018"],
    ["cosmos", "Cosmos", "#a5b1f2", "#101220", "#181d30"],
    ["lemon", "Citrus", "#d7df91", "#15170e", "#202319"],
    ["ruby", "Ruby", "#e69aaa", "#1a1016", "#27191f"],
    ["sand", "Sand", "#d9c9a8", "#181611", "#242119"],
    ["ocean", "Abyss", "#91b9c9", "#10181b", "#172329"],
    ["pearl", "Pearl", "#d2d3e1", "#15151b", "#202029"],
  ];
  const sections = [
    [
      "collection",
      "grid",
      "Темы",
      "Коллекция",
      "НАЧНИ С НАСТРОЕНИЯ",
      "Готовая основа. Дальше всё под тебя.",
    ],
    [
      "background",
      "image",
      "Фон",
      "Пространство",
      "СЛОИ И ГЛУБИНА",
      "Свой фон, правильный свет и немного глубины.",
    ],
    [
      "profile",
      "user",
      "Профиль",
      "Личное",
      "ТВОЙ ПРОФИЛЬ",
      "Аватар, рамка и то, что ты хочешь сказать.",
    ],
    [
      "type",
      "type",
      "Шрифт",
      "Типографика",
      "КАК ЗВУЧИТ ТЕКСТ",
      "От аккуратного гротеска до своего шрифта.",
    ],
    [
      "cursor",
      "cursor",
      "Курсор",
      "Движение руки",
      "МАЛЕНЬКАЯ ДЕТАЛЬ",
      "Курсор и след работают прямо на предпросмотре.",
    ],
    [
      "effects",
      "spark",
      "Эффекты",
      "Атмосфера",
      "МЕНЬШЕ ШУМА. БОЛЬШЕ ЖИЗНИ.",
      "Снег, дождь, свет и плавное появление блоков.",
    ],
    [
      "interface",
      "palette",
      "Редактор",
      "Интерфейс",
      "ТВОЁ РАБОЧЕЕ МЕСТО",
      "Оформление самого редактора. Профиль не меняется.",
    ],
    [
      "sharing",
      "share",
      "Сборки",
      "Сохранить и делиться",
      "ЗАБЕРИ СВОЙ СТИЛЬ",
      "Сохрани сборку, импортируй чужую или опубликуй свою.",
    ],
  ];
  let prefs = o.normalize(),
    login = "",
    themeName = "My space",
    showcaseId = "",
    basedOn = null,
    publication = { includePersonal: false, allowRemix: true, repo: "" },
    editorMode = "extension",
    readmeDraft = {},
    readmeEditor = null,
    ui = { skin: "black", accent: "", follow: false, motion: true },
    library = [],
    state = o.normalizeState(),
    activeSection = "collection",
    history = [],
    historyIndex = 0,
    saveTimer = 0,
    toastTimer = 0,
    uploadTarget = "",
    fontFace = null,
    fontSource = "",
    fontGeneration = 0,
    persistRevision = 0,
    db = null;
  let currentPreviewPrefs = prefs,
    comparisonBaseline = null,
    comparisonActive = false,
    studioTools = null;
  sections.splice(
    3,
    0,
    [
      "projects",
      "grid",
      "Проекты",
      "Карточки проектов",
      "ТВОИ ЗАКРЕПЛЕНИЯ",
      "Добавляй карточки, меняй порядок и выбирай раскладку.",
    ],
    [
      "mini",
      "user",
      "Мини",
      "Мини-профиль",
      "КОМПАКТНЫЙ ВИД",
      "Аватар, имя, описание и свои кнопки в одной карточке.",
    ],
  );
  sections.push([
    "publish",
    "share",
    "Публикация",
    "Твой профиль в сети",
    "ВИДНО ДРУГИМ",
    "Опубликуй оформление и проверь, что увидят посетители.",
  ]);
  let projectRenderKey = "",
    extraRenderKey = "",
    miniRenderKey = "";
  const query = new URLSearchParams(location.search);
  login = o.loginFor(query.get("profile")) || login;
  function node(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function toast(message, error = false) {
    const n = $("toast");
    n.textContent = message;
    n.classList.toggle("error", error);
    n.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (n.hidden = true), error ? 6500 : 4000);
  }
  function button(text, fn, cls = "button secondary wide") {
    const n = node("button", cls, text);
    n.type = "button";
    n.addEventListener("click", () =>
      Promise.resolve(fn()).catch((e) => toast(e.message, true)),
    );
    return n;
  }
  function group(title, small = "") {
    const n = node("section", "settings-group"),
      h = node("h2", "group-title", title);
    if (small) h.append(node("small", "", small));
    n.append(h);
    return n;
  }
  const controls = new Map();
  function field(key, label, kind = "text", config = {}) {
    const wrap = node("label", "field"),
      head = node("span", "field-head"),
      caption = node("span", "", label);
    head.append(caption);
    wrap.append(head);
    let input;
    if (kind === "select") {
      input = node("select");
      for (const [value, text] of config.items) {
        const opt = node("option", "", text);
        opt.value = value;
        input.append(opt);
      }
    } else if (kind === "textarea") input = node("textarea");
    else {
      input = node("input");
      input.type = kind;
    }
    input.id = key;
    input.name = key;
    Object.assign(
      input,
      Object.fromEntries(
        Object.entries(config).filter(
          ([k]) => k !== "items" && k !== "format" && k !== "scale",
        ),
      ),
    );
    if (key === "login") input.autocomplete = "off";
    if (kind === "range") {
      const out = node("output");
      out.htmlFor = key;
      out.id = key + "-value";
      head.append(out);
      input.dataset.scale = String(config.scale || 1);
      input.dataset.unit = config.format || "";
    }
    if (kind === "color") {
      const row = node("span", "color-field");
      row.append(input, node("code", "", prefs[key]));
      wrap.append(row);
    } else wrap.append(input);
    const change = () => {
      if (key === "login") {
        const next = o.loginFor(input.value);
        if (!next) return;
        login = next;
        setPrefs({}, false);
        scheduleSave();
        return;
      }
      let value =
        kind === "range"
          ? Number(input.value) / Number(input.dataset.scale || 1)
          : input.value;
      if (key === "colorMode") {
        const light = value === "light";
        setPrefs({
          colorMode: value,
          ...(prefs.background === "solid"
            ? { backgroundColor: light ? "#f3f3f3" : "#141414" }
            : {}),
          accent: light ? "#353535" : "#e5e5e5",
          secondary: light ? "#777777" : "#ffffff",
          cursorColor: light ? "#353535" : "#e5e5e5",
        });
        return;
      }
      if (
        value === "custom" &&
        ((key === "font" && !prefs.customFont) ||
          (key === "background" && !prefs.customBackground))
      ) {
        uploadTarget = key === "font" ? "font" : "background";
        input.value = prefs[key];
        $(key === "font" ? "font-file" : "image-file").click();
        return;
      }
      if (o.leafKeys.includes(key)) {
        setPrefs(o.leafPatch(prefs, key, value));
        return;
      }
      if (key === "miniAlign") {
        setPrefs({ miniAlign: value, profileLayout: "compact" });
        return;
      }
      if (key === "frame" && value === "custom" && !prefs.customFrame) {
        input.value = prefs.frame;
        $("animated-frame-file").click();
        return;
      }
      if (key === "frame") {
        const item = PCStudioFrames.catalog.find((c) => c.id === value);
        setPrefs({
          frame: value,
          ...(item?.source ? PCStudioFrameSettings.reset(item) : {}),
          ...(["steam", "original"].includes(item?.source)
            ? {
                ...PCStudioFrameSettings.reset(item),
                avatarShape: item.shape,
                frameOriginalColors: item.source === "steam",
                framePlaybackRate: 1,
                frameScale: 100,
                frameIntensity: 100,
                frameWidth: 2,
              }
            : {}),
          ...(item?.accent
            ? {
                frameUseThemeColors: false,
                frameAccent: item.accent,
                frameSecondary: item.secondary,
              }
            : {}),
        });
        return;
      }
      if (key === "particles") {
        setPrefs({
          particles: value,
          snow: value !== "none",
          ...(value !== "none" && prefs.density === 0 ? { density: 35 } : {}),
        });
        return;
      }
      setPrefs({
        [key]: value,
        ...(["frameAccent", "frameSecondary", "frameColorStrength"].includes(
          key,
        )
          ? { frameOriginalColors: false }
          : {}),
      });
    };
    input.addEventListener("input", change);
    if (kind === "color") {
      let beforeColor = null;
      input.addEventListener("studio-color-open", () => {
        beforeColor = { ...prefs };
      });
      input.addEventListener("studio-color-cancel", () => {
        if (beforeColor) setPrefs(beforeColor);
      });
    }
    input.addEventListener("change", () => {
      change();
      commit();
    });
    controls.set(key, { input, wrap, kind, config });
    return wrap;
  }
  function toggle(key, label, description = "") {
    const wrap = node("label", "toggle-row"),
      text = node("span", "", label);
    if (description) text.append(node("small", "", description));
    const input = node("input");
    input.type = "checkbox";
    input.id = key;
    input.addEventListener("change", () => {
      setPrefs({
        [key]: input.checked,
        ...(key === "frameColorCycle" && input.checked
          ? { frameOriginalColors: false }
          : {}),
        ...(key === "snow" && input.checked
          ? {
              ...(prefs.particles === "none" ? { particles: "snow" } : {}),
              ...(prefs.density === 0 ? { density: 35 } : {}),
            }
          : {}),
      });
      commit();
    });
    wrap.append(text, input);
    controls.set(key, { input, wrap, kind: "checkbox", config: {} });
    return wrap;
  }
  function upload(kind, label, detail) {
    const n = button(
      "",
      () => {
        uploadTarget = kind;
        $(kind === "font" ? "font-file" : "image-file").click();
      },
      "upload-card",
    );
    n.replaceChildren(icon("upload"));
    n.append(node("strong", "", label), node("small", "", detail));
    return n;
  }
  function options(key, items) {
    const n = node("div", "mini-options");
    for (const [value, label, glyph] of items) {
      const b = button(
        "",
        () => {
          if (value === "custom" && !prefs.cursorImage) {
            uploadTarget = "cursor";
            $("image-file").click();
            return;
          }
          setPrefs({
            [key]: value,
            ...([
              "frameAccent",
              "frameSecondary",
              "frameColorStrength",
            ].includes(key)
              ? { frameOriginalColors: false }
              : {}),
          });
          commit();
        },
        "option-tile",
      );
      b.dataset.optionKey = key;
      b.dataset.optionValue = value;
      b.setAttribute("aria-label", label);
      b.replaceChildren(icon(glyph || "ring"));
      b.append(node("span", "", label));
      n.append(b);
    }
    return n;
  }
  function applyUI() {
    const skin = skins.find((s) => s[0] === ui.skin) || skins[0],
      accent = ui.follow ? prefs.accent : ui.accent || skin[2];
    document.documentElement.dataset.ui = skin[0];
    document.documentElement.dataset.uiMotion = String(ui.motion);
    for (const [k, v] of Object.entries({
      "--ui": accent,
      "--ui2": skin[2],
      "--ui-bg": skin[3],
      "--ui-panel": skin[4],
      "--ui-raised": `color-mix(in srgb,${skin[2]} 7%,${skin[4]})`,
    }))
      document.documentElement.style.setProperty(k, v);
    document
      .querySelectorAll("[data-skin]")
      .forEach((n) =>
        n.setAttribute("aria-pressed", String(n.dataset.skin === ui.skin)),
      );
    if ($("editor-follow")) $("editor-follow").checked = ui.follow;
    if ($("editor-accent") && document.activeElement !== $("editor-accent"))
      $("editor-accent").value = accent;
  }
  async function database() {
    if (db) return db;
    db = await new Promise((resolve, reject) => {
      const r = indexedDB.open("ProfileStudioWorkspaceNeutral", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("workspace");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return db;
  }
  async function disk(mode, value) {
    const d = await database();
    return new Promise((resolve, reject) => {
      const tx = d.transaction("workspace", mode),
        r =
          mode === "readonly"
            ? tx.objectStore("workspace").get("draft")
            : tx.objectStore("workspace").put(value, "draft");
      let result;
      r.onsuccess = () => (result = r.result);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
    });
  }
  async function persist() {
    const revision = ++persistRevision;
    try {
      await disk("readwrite", {
        prefs,
        login,
        themeName,
        showcaseId,
        basedOn,
        publication,
        editorMode,
        readme: readmeEditor?.state() || readmeDraft,
        ui,
        library,
      });
      if (revision === persistRevision)
        $("save-status").textContent = "Черновик сохранён";
      return true;
    } catch {
      $("save-status").textContent = "Экспортируй тему, чтобы сохранить";
      return false;
    }
  }
  function scheduleSave() {
    clearTimeout(saveTimer);
    $("save-status").textContent = "Есть изменения";
    saveTimer = setTimeout(persist, 650);
  }
  function commit() {
    if (
      history[historyIndex] &&
      o.appearanceKeys.every((k) => o.same(history[historyIndex][k], prefs[k]))
    )
      return;
    history = history.slice(0, historyIndex + 1);
    history.push({ ...prefs });
    if (history.length > 35) history.shift();
    historyIndex = history.length - 1;
    historyButtons();
  }
  function historyButtons() {
    $("undo").disabled = historyIndex <= 0;
    $("redo").disabled = historyIndex >= history.length - 1;
  }
  function travel(delta) {
    commit();
    const next = historyIndex + delta;
    if (next < 0 || next >= history.length) return;
    historyIndex = next;
    prefs = { ...history[next] };
    render();
    scheduleSave();
    historyButtons();
  }
  function setPrefs(patch, save = true) {
    prefs = o.normalize({ ...prefs, ...patch });
    render();
    if (save) scheduleSave();
  }
  const scene = PCStudioScene.create({
    target: $("profile-preview"),
    viewport: $("preview-scroll"),
  });
  $("profile-preview")
    .querySelector(".ps-scene-image")
    .addEventListener("load", updateBackgroundSize);
  function updateBackgroundSize() {
    const label = $("background-image-size");
    if (!label) return;
    const image = $("profile-preview").querySelector(".ps-scene-image");
    label.textContent = image.hidden
      ? "Можно использовать фото, градиент или однотонный фон."
      : image.naturalWidth
        ? "Текущее изображение: " +
          image.naturalWidth +
          " × " +
          image.naturalHeight +
          " px." +
          (image.naturalWidth < 1280
            ? " Для широкого экрана лучше выбрать фото крупнее."
            : "")
        : "Открываем изображение…";
  }
  async function updateFont(prefs = currentPreviewPrefs) {
    const bundled = o.bundledFonts[prefs.font];
    const source =
      prefs.font === "custom"
        ? prefs.customFont
        : bundled
          ? PCStudioAssets.source(bundled.file)
          : "";
    if (source === fontSource) return;
    fontSource = source;
    const generation = ++fontGeneration;
    if (fontFace) {
      document.fonts.delete(fontFace);
      fontFace = null;
    }
    if (!source) return;
    try {
      const bytes = Uint8Array.from(atob(source.split(",")[1]), (c) =>
          c.charCodeAt(0),
        ),
        loaded = await new FontFace(
          bundled?.family || "WinterUploaded",
          bytes,
          bundled ? { weight: bundled.weight } : {},
        ).load();
      if (generation !== fontGeneration) return;
      fontFace = loaded;
      document.fonts.add(loaded);
    } catch {
      if (generation === fontGeneration)
        toast("Не удалось открыть шрифт. Выбери другой файл.", true);
    }
  }
  function render() {
    PCStudioColorPicker.enhance($("settings"));
    for (const [key, c] of controls) {
      const value = key === "login" ? login : prefs[key];
      if (c.kind === "checkbox") c.input.checked = value;
      else if (document.activeElement !== c.input) {
        c.input.value =
          c.kind === "range"
            ? String(
                Math.round(value * Number(c.input.dataset.scale || 1) * 100) /
                  100,
              )
            : value;
      }
      if (c.kind === "range") {
        const out = $(key + "-value"),
          scaled = value * Number(c.input.dataset.scale || 1);
        out.textContent =
          (Number.isInteger(scaled)
            ? scaled
            : scaled.toFixed(key === "effectSpeed" ? 2 : 1)) +
          (c.config.format || "");
      }
      if (c.kind === "color")
        c.wrap.querySelector("code").textContent = value.toUpperCase();
    }
    document
      .querySelectorAll("[data-option-key]")
      .forEach((n) =>
        n.setAttribute(
          "aria-pressed",
          String(prefs[n.dataset.optionKey] === n.dataset.optionValue),
        ),
      );
    document.querySelectorAll("[data-preset]").forEach((n) => {
      const p = PCWinterPresets.find((p) => p.id === n.dataset.preset);
      n.setAttribute(
        "aria-pressed",
        String(p.background === prefs.background && p.accent === prefs.accent),
      );
    });
    if (ui.follow) applyUI();
    updatePublication();
    showComparison(false);
    document.querySelectorAll("[data-frame-preset]").forEach((n) => {
      n.setAttribute(
        "aria-pressed",
        String(n.dataset.framePreset === prefs.frame),
      );
      PCStudioAvatars.set(n.querySelector("img"), prefs.customAvatar);
      PCStudioFrames.update(n.querySelector(".ps-avatar-frame"), {
        ...prefs,
        frame: n.dataset.framePreset,
        ...(n.dataset.framePreset !== prefs.frame
          ? {
              frameUseThemeColors: false,
              frameOriginalColors: true,
              framePlaybackRate: 1,
              frameScale: 100,
              frameIntensity: 100,
              frameWidth: 2,
              avatarShape:
                PCStudioFrames.catalog.find(
                  (c) => c.id === n.dataset.framePreset,
                )?.shape || prefs.avatarShape,
              frameAccent:
                PCStudioFrames.catalog.find(
                  (c) => c.id === n.dataset.framePreset,
                )?.accent || prefs.accent,
              frameSecondary:
                PCStudioFrames.catalog.find(
                  (c) => c.id === n.dataset.framePreset,
                )?.secondary || prefs.secondary,
            }
          : {}),
      });
      n.dataset.psMotion = String(prefs.motion);
    });
    const mediaFrame =
      prefs.frame === "custom" ||
      Boolean(PCStudioFrameMedia.record(prefs.frame));
    if (controls.has("frameSpeed"))
      controls.get("frameSpeed").wrap.hidden = mediaFrame;
    if (controls.has("framePlaybackRate"))
      controls.get("framePlaybackRate").wrap.hidden = !mediaFrame;
    if (controls.has("frameOriginalColors"))
      controls.get("frameOriginalColors").wrap.hidden = !mediaFrame;
    if ($("leaf-controls"))
      $("leaf-controls").hidden = prefs.particles !== "leaves";
    if ($("effect-status")) {
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const reason = reduced
        ? "Анимации приостановлены системной настройкой уменьшения движения."
        : !prefs.motion
          ? "Живая сцена выключена."
          : !prefs.snow
            ? "Показ частиц выключен."
            : prefs.particles === "none"
              ? "Эффект не выбран."
              : prefs.density === 0
                ? "Плотность равна нулю."
                : "Частицы включены. Движение видно на фоне профиля.";
      $("effect-status").textContent = reason;
      $("start-particles").hidden =
        reduced ||
        (prefs.motion &&
          prefs.snow &&
          prefs.particles !== "none" &&
          prefs.density > 0);
    }
    if ($("leaf-colors-link"))
      $("leaf-colors-link").hidden = prefs.particles !== "leaves";
    if ($("leaf-mixture"))
      for (const key of o.leafKeys) {
        const segment = $("leaf-mixture").querySelector(
          `[data-share="${key}"]`,
        );
        segment.style.width = prefs[key] + "%";
        segment.title = prefs[key] + "%";
      }
  }
  function renderPreview(prefs, owner) {
    currentPreviewPrefs = prefs;
    scene.update(prefs);
    updateBackgroundSize();
    void updateFont(prefs);
    const previewLogin = owner || "username";
    $("preview-name").textContent = prefs.displayName || owner || "Имя профиля";
    $("preview-bio").textContent =
      prefs.bio || "Добавьте короткое описание профиля.";
    for (const id of [
      "preview-label",
      "address-login",
      "readme-login",
      "profile-link-login",
    ])
      $(id).textContent = previewLogin;
    $("preview-login").textContent = "@" + previewLogin;
    PCStudioAvatars.set($("preview-avatar"), prefs.customAvatar);
    PCStudioFrames.update($("preview-avatar-frame"), prefs);
    $("preview-avatar-frame").dataset.frame = prefs.frame;
    $("preview-avatar-frame").style.borderRadius =
      prefs.avatarShape === "circle"
        ? "50%"
        : prefs.avatarShape === "square"
          ? "4px"
          : "22%";
    if (prefs.headline) $("preview-headline").textContent = prefs.headline;
    else if (prefs.displayName)
      $("preview-headline").textContent = prefs.displayName;
    else $("preview-headline").textContent = "Ваш профиль";
    $("preview-about").textContent =
      prefs.about ||
      prefs.bio ||
      "Добавьте свой заголовок, текст и проекты. Всё содержимое здесь можно настроить.";
    $("preview-stats").hidden = prefs.hideStats;
    $("preview-stats").querySelector("p").textContent =
      prefs.miniNote || "Добавь подпись в разделе «Мини».";
    $("preview-extra").hidden = !prefs.miniNote && !prefs.miniLinks.length;
    $("preview-extra-note").textContent = prefs.miniNote;
    const extraKey = JSON.stringify(prefs.miniLinks);
    if (extraKey !== extraRenderKey) {
      extraRenderKey = extraKey;
      $("preview-extra-links").replaceChildren();
      for (const link of prefs.miniLinks) {
        const anchor = node("a", "", link.label + " ↗");
        anchor.href = link.url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        $("preview-extra-links").append(anchor);
      }
    }
    $("preview-readme").hidden = prefs.hideReadme;
    $("preview-contributions").hidden = prefs.hideContributions;
    const preview = $("profile-preview");
    preview.dataset.layout = prefs.profileLayout;
    const projectKey = JSON.stringify([
      prefs.projects,
      prefs.projectsTitle,
      prefs.projectsLayout,
      prefs.projectColumns,
      prefs.useCustomProjects,
    ]);
    if (projectKey !== projectRenderKey) {
      projectRenderKey = projectKey;
      PCStudioComponents.projectCards($("preview-projects"), prefs, {
        demo: !prefs.useCustomProjects,
      });
    }
    $("projects-heading").textContent = prefs.projectsTitle || "Проекты";
    $("preview-projects").hidden = prefs.hideProjects;
    $("projects-label").hidden = prefs.hideProjects;
    $("preview-mini").hidden = prefs.profileLayout !== "compact";
    const miniKey = JSON.stringify([
      prefs.customAvatar,
      prefs.miniAvatar,
      prefs.displayName,
      prefs.bio,
      prefs.miniNote,
      prefs.miniLinks,
      prefs.miniAlign,
      prefs.miniCover,
      prefs.frame,
      prefs.avatarShape,
      previewLogin,
    ]);
    if (miniKey !== miniRenderKey) {
      miniRenderKey = miniKey;
      PCStudioComponents.miniCard($("preview-mini"), prefs, {
        login: previewLogin,
      });
    }
    document
      .querySelectorAll("#preview-mini .ps-avatar-frame")
      .forEach((n) => PCStudioFrames.update(n, prefs));
    $("preview-detail").textContent =
      (prefs.motion ? "Движение включено" : "Без анимации") +
      " · " +
      (prefs.background === "custom"
        ? "свой фон"
        : PCWinterPresets.find((p) => p.background === prefs.background)
            ?.name || prefs.background);
  }

  function showComparison(before) {
    comparisonActive = Boolean(before && comparisonBaseline);
    const view = comparisonActive ? comparisonBaseline : { prefs, login };
    renderPreview(view.prefs, view.login);
    $("compare-before").setAttribute("aria-pressed", String(comparisonActive));
    $("compare-current").setAttribute(
      "aria-pressed",
      String(!comparisonActive),
    );
    $("comparison-banner").hidden = !comparisonActive;
    $("comparison-state").textContent = comparisonActive
      ? "Вариант до изменений"
      : "Текущий черновик";
  }
  function pinComparison() {
    comparisonBaseline = { prefs: o.normalize(prefs), login };
    showComparison(false);
    toast("Текущий вид запомнен как «До» на время этой сессии.");
  }
  function nameLibraryVariant(item = null) {
    studioTools?.nameVariant({
      title: item ? "Переименовать сборку" : "Сохранить свой вариант",
      name: item?.name || themeName,
      submit: item ? "Переименовать" : "Сохранить сборку",
      onSave: async (name) => {
        const previous = library;
        if (item)
          library = library.map((x) => (x.id === item.id ? { ...x, name } : x));
        else {
          if (library.length >= 12)
            throw Error(
              "Сохранено 12 сборок. Экспортируй или удали одну из них.",
            );
          library = [
            { id: crypto.randomUUID(), name, appearance: o.normalize(prefs) },
            ...library,
          ];
          if (JSON.stringify(library).length > 20000000) {
            library = previous;
            throw Error(
              "Сборки занимают слишком много места. Экспортируй часть в файлы.",
            );
          }
        }
        if (!(await persist())) {
          library = previous;
          throw Error("Не удалось сохранить. Экспортируй тему в файл.");
        }
        navigate("sharing");
        toast(
          item
            ? "Название сборки сохранено."
            : "Сборка сохранена на этом устройстве.",
        );
      },
    });
  }
  function backgroundGuide() {
    const guide = node("div", "background-guide");
    const size = node("p");
    size.id = "background-image-size";
    guide.append(
      node("strong", "", "Фон без потери деталей"),
      node(
        "p",
        "",
        "Для компьютера: 2560 × 1440 (16:9), минимум 1920 × 1080. Для телефона: 1440 × 2560 (9:16).",
      ),
      node(
        "p",
        "",
        "Квадрат 1920 × 1920 тоже подойдёт. Изображение заполняет экран с обрезкой краёв: настрой положение ниже. Файлы крупнее 2560 px уменьшаются, маленькие не увеличиваются при сохранении.",
      ),
      size,
    );
    return guide;
  }

  function makeCollection(panel) {
    const base = group("Основа");
    base.append(
      field("colorMode", "Оформление профиля", "select", {
        items: [
          ["dark", "Чёрное"],
          ["light", "Белое"],
        ],
      }),
    );
    panel.append(base);
    const top = node("div", "collection-top");
    top.append(
      node("span", "", "CURATED COLLECTION"),
      node("span", "", PCWinterPresets.length + " тем"),
    );
    panel.append(top);
    const search = node("input", "search-input");
    search.type = "search";
    search.placeholder = "Найти своё настроение";
    search.setAttribute("aria-label", "Поиск тем");
    panel.append(search);
    const grid = node("div", "theme-grid");
    for (const p of PCWinterPresets) {
      const b = button(
        "",
        () => {
          setPrefs(p.appearance);
          themeName = p.name;
          basedOn = null;
          commit();
          toast("Основа " + p.name + " применена. Дальше можно менять всё.");
        },
        "theme-card",
      );
      b.dataset.preset = p.id;
      b.setAttribute("aria-pressed", "false");
      const art = node("span", "theme-art");
      art.style.setProperty("--art-accent", p.accent);
      PCStudioBackgrounds.thumbnail(
        art,
        o.normalize({ ...o.defaults, ...p.appearance }),
      );
      b.append(art, node("b", "", p.name), node("small", "", p.label));
      grid.append(b);
    }
    search.addEventListener("input", () =>
      grid
        .querySelectorAll(".theme-card")
        .forEach(
          (b) =>
            (b.hidden = !b.textContent
              .toLowerCase()
              .includes(search.value.toLowerCase())),
        ),
    );
    panel.append(grid);
    const note = node(
      "p",
      "footnote",
      "Темы профиля и интерфейса редактора независимы. Цвет кнопок меняется в разделе «Редактор».",
    );
    panel.append(note);
  }
  function makeBackground(panel) {
    const g = group("Источник фона");
    g.append(
      field("background", "Фоновый слой", "select", {
        items: [
          ["forest", "Зимний лес"],
          ["lake", "Туманное озеро"],
          ["solid", "Однотонный"],
          ["gradient", "Своя палитра"],
          ...PCWinterPresets.filter(
            (p) => !["forest", "lake", "gradient"].includes(p.background),
          ).map((p) => [p.background, p.name]),
          ["custom", "Загруженное изображение"],
        ],
      }),
      upload("background", "Загрузить изображение", "PNG, JPG, WebP · до 6 МБ"),
      backgroundGuide(),
      button("Подобрать цвета из фона", autoPalette),
      field("backgroundColor", "Однотонный фон", "color"),
    );
    const light = group("Свет и глубина");
    light.append(
      field("dim", "Затемнение", "range", {
        min: 0,
        max: 95,
        step: 1,
        format: "%",
      }),
      field("blur", "Размытие", "range", {
        min: 0,
        max: 100,
        step: 1,
        scale: 100 / 32,
        format: "%",
      }),
      field("backgroundZoom", "Масштаб", "range", {
        min: 100,
        max: 180,
        step: 1,
        format: "%",
      }),
    );
    const pos = group("Композиция");
    pos.append(
      field("backgroundX", "По горизонтали", "range", {
        min: 0,
        max: 100,
        step: 1,
        format: "%",
      }),
      field("backgroundY", "По вертикали", "range", {
        min: 0,
        max: 100,
        step: 1,
        format: "%",
      }),
      toggle(
        "parallax",
        "Реакция на курсор",
        "Мягкое смещение фона без движения текста.",
      ),
    );
    panel.append(g, light, pos);
  }
  function makeProfile(panel) {
    const who = group("Профиль");
    who.append(
      field("login", "GitHub-ник", "text", {
        maxLength: 39,
        placeholder: "username",
      }),
      field("displayName", "Имя на странице", "text", {
        maxLength: 60,
        placeholder: login,
      }),
      field("bio", "Коротко о себе", "textarea", {
        maxLength: 280,
        placeholder: "Что ты создаёшь?",
      }),
    );
    const avatar = group("Аватар темы", "Отдельно от GitHub");
    avatar.append(
      node(
        "p",
        "footnote",
        "Здесь можно поставить другое фото для оформления. Фото аккаунта GitHub не меняется. В предпросмотре без своего изображения показан нейтральный аватар, а на GitHub используется фото аккаунта.",
      ),
      upload("avatar", "Своя аватарка", "PNG, JPG, WebP · до 6 МБ"),
      button("Использовать аватар GitHub", () => {
        setPrefs({ customAvatar: "" });
        commit();
      }),
      field("avatarShape", "Форма", "select", {
        items: [
          ["circle", "Круг"],
          ["rounded", "Мягкий квадрат"],
          ["square", "Квадрат"],
        ],
      }),
      field("frame", "Анимированная рамка", "select", {
        items: [
          ["none", "Без рамки"],
          ["custom", "Свой файл PNG/APNG"],
          ...PCStudioFrames.catalog.map((c) => [
            c.id,
            c.name + " / " + c.description,
          ]),
        ],
      }),
      field("framePlaybackRate", "Скорость оригинальной анимации", "range", {
        min: 25,
        max: 200,
        step: 5,
        scale: 100,
        format: " ×",
      }),
      field("frameWidth", "Толщина", "range", {
        min: 1,
        max: 8,
        step: 0.5,
        format: " px",
      }),
      field("frameGlow", "Свечение", "range", {
        min: 0,
        max: 100,
        step: 1,
        format: "%",
      }),
      field("frameSpeed", "Цикл рамки", "range", {
        min: 3,
        max: 48,
        step: 1,
        format: " с",
      }),
      field("frameScale", "Размер украшений", "range", {
        min: 85,
        max: 125,
        step: 1,
        format: "%",
      }),
      field("frameIntensity", "Насыщенность рамки", "range", {
        min: 15,
        max: 100,
        step: 1,
        format: "%",
      }),
    );
    const frameUpload = node("input");
    frameUpload.type = "file";
    frameUpload.accept = "image/png,.png,.apng";
    frameUpload.hidden = true;
    frameUpload.id = "animated-frame-file";
    frameUpload.addEventListener("change", async () => {
      const file = frameUpload.files[0];
      if (!file) return;
      try {
        if (file.size > 3000000) throw Error("Рамка должна быть меньше 3 МБ.");
        PCStudioFrameMedia.inspect(new Uint8Array(await file.arrayBuffer()));
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setPrefs({
          frame: "custom",
          customFrame: data.replace(/^data:[^;]+;/, "data:image/png;"),
          avatarShape: "square",
          frameOriginalColors: true,
          framePlaybackRate: 1,
          frameScale: 100,
          frameIntensity: 100,
          frameWidth: 2,
        });
        commit();
      } catch (error) {
        toast(error.message || "Не удалось открыть рамку.");
      }
      frameUpload.value = "";
    });
    avatar.append(
      button("Загрузить свою рамку PNG/APNG", () => frameUpload.click()),
      frameUpload,
    );
    const frameGallery = node("div", "frame-gallery");
    const showcase = node(
      "a",
      "button secondary wide",
      "Посмотреть все рамки крупно ↗",
    );
    showcase.href = "frame-gallery.html";
    showcase.target = "_blank";
    showcase.rel = "noopener";
    avatar.append(showcase);
    for (const item of PCStudioFrames.catalog) {
      const { id, name } = item;
      const tile = button(
        "",
        () => {
          setPrefs({
            frame: id,
            ...(item.source ? PCStudioFrameSettings.reset(item) : {}),
            ...(["steam", "original"].includes(item.source)
              ? {
                  avatarShape: item.shape,
                  frameOriginalColors: item.source === "steam",
                  framePlaybackRate: 1,
                  frameScale: 100,
                  frameIntensity: 100,
                  frameWidth: 2,
                }
              : {}),
            ...(item.accent
              ? {
                  frameUseThemeColors: false,
                  frameAccent: item.accent,
                  frameSecondary: item.secondary,
                }
              : {}),
          });
          commit();
        },
        "frame-tile",
      );
      tile.dataset.framePreset = id;
      tile.setAttribute("aria-label", "Рамка " + name);
      tile.title = item.description;
      const frame = node("span", "ps-avatar-frame"),
        img = node("img");
      PCStudioAvatars.set(img, prefs.customAvatar);
      frame.append(img);
      PCStudioFrames.update(frame, {
        ...prefs,
        frame: id,
        ...(item.accent
          ? {
              frameUseThemeColors: false,
              frameAccent: item.accent,
              frameSecondary: item.secondary,
            }
          : {}),
      });
      tile.append(frame, node("span", "", name));
      frameGallery.append(tile);
    }
    const palettes = node("div", "frame-palette");
    for (const [name, a, b] of [
      ["Лёд", "#edf5ff", "#92badd"],
      ["Розовый", "#ffe2f1", "#e989c4"],
      ["Чёрный", "#15171c", "#89919e"],
      ["Красный", "#ef5369", "#ffc2a2"],
      ["Мята", "#53d9b9", "#c9ffec"],
      ["Лайм", "#a6f22c", "#eeff9e"],
      ["Фиолетовый", "#9869e4", "#e6d2ff"],
      ["Золото", "#e3b77b", "#fff1ce"],
    ]) {
      const chip = button(
        "",
        () => {
          setPrefs({
            frameUseThemeColors: false,
            frameOriginalColors: false,
            frameAccent: a,
            frameSecondary: b,
          });
          commit();
        },
        "frame-color-chip",
      );
      chip.setAttribute("aria-label", "Палитра рамки: " + name);
      chip.title = name;
      chip.style.background = `linear-gradient(135deg,${a},${b})`;
      palettes.append(chip);
    }
    const search = node("input", "search-input");
    search.type = "search";
    search.placeholder = "Найти рамку";
    search.setAttribute("aria-label", "Поиск рамок");
    search.addEventListener("input", () => {
      for (const tile of frameGallery.children)
        tile.hidden = !(tile.textContent + " " + tile.title)
          .toLowerCase()
          .includes(search.value.toLowerCase());
    });
    avatar.append(
      search,
      frameGallery,
      button("Вернуть оригинальный вид рамки", () => {
        const item = PCStudioFrames.catalog.find((c) => c.id === prefs.frame);
        setPrefs(PCStudioFrameSettings.reset(item));
        commit();
      }),
      toggle("frameOriginalColors", "Оригинальные цвета рамки Steam"),
      field("frameColorStrength", "Сила перекраски", "range", {
        min: 0,
        max: 100,
        step: 1,
        format: "%",
      }),
      toggle("frameColorCycle", "Перелив цветов"),
      toggle("frameUseThemeColors", "Цвета рамки из темы"),
      palettes,
      field("frameAccent", "Первый цвет рамки", "color"),
      field("frameSecondary", "Второй цвет рамки", "color"),
      node(
        "p",
        "footnote",
        "Рамки Steam сохраняют собственную форму и темп. Для перекраски отключи «Оригинальные цвета» или выбери палитру. Цикл ниже относится к рамкам Studio.",
      ),
    );
    const text = group("Текст профиля", "Только локально");
    text.append(
      field("headline", "Заголовок", "textarea", {
        maxLength: 180,
        placeholder: "Своя среда. Свой подход.",
      }),
      field("about", "Текст README", "textarea", {
        maxLength: 6000,
        placeholder: "Твой текст. Без HTML и скриптов.",
      }),
      node(
        "p",
        "footnote",
        "Переопределения видны в твоём браузере. Файл темы может включать их только по твоему выбору. Оригинальный README на GitHub не редактируется.",
      ),
    );
    panel.append(who, avatar, text);
  }
  function makeType(panel) {
    const g = group("Шрифт профиля");
    g.append(
      field("font", "Гарнитура", "select", {
        items: [
          ["system", "System / Segoe UI"],
          ["mono", "Mono / Consolas"],
          ["serif", "Serif / Georgia"],
          ["rounded", "Rounded / Trebuchet"],
          ["book", "Book / Cambria"],
          ["manrope", "Manrope / современный"],
          ["jetbrains", "JetBrains Mono / код"],
          ["unbounded", "Unbounded / заголовки"],
          ["cormorant", "Cormorant Garamond / редакционный"],
          ["custom", "Мой загруженный шрифт"],
        ],
      }),
      upload("font", "Загрузить свой шрифт", "TTF, OTF, WOFF, WOFF2 · до 2 МБ"),
      field("fontSize", "Размер текста", "range", {
        min: 12,
        max: 20,
        step: 0.5,
        format: " px",
      }),
      field("letterSpacing", "Межбуквенный интервал", "range", {
        min: -0.5,
        max: 2,
        step: 0.1,
        format: " px",
      }),
      node(
        "p",
        "footnote",
        prefs.fontName
          ? "Загружен: " + prefs.fontName
          : "Manrope, JetBrains Mono, Unbounded и Cormorant включены в расширение и работают офлайн. Свой шрифт сохраняется в теме. Установка в Windows не нужна.",
      ),
    );
    const c = group("Палитра профиля"),
      row = node("div", "palette-row");
    row.append(
      field("accent", "Акцент", "color"),
      field("secondary", "Второй цвет", "color"),
    );
    c.append(row, button("Автопалитра из фона", autoPalette));
    const surface = group("Карточки");
    surface.append(
      field("surfaceOpacity", "Плотность подложки", "range", {
        min: 0,
        max: 100,
        step: 1,
        format: "%",
      }),
      field("cardRadius", "Скругление", "range", {
        min: 0,
        max: 28,
        step: 1,
        format: " px",
      }),
    );
    panel.append(g, c, surface);
  }
  function makeCursor(panel) {
    const g = group("Стиль курсора");
    g.append(
      options("cursor", [
        ["system", "Системный", "cursor"],
        ["dot", "Точка", "dot"],
        ["ring", "Кольцо", "ring"],
        ["crosshair", "Прицел", "crosshair"],
        ["glow", "Свечение", "glow"],
        ["custom", "Свой PNG", "upload"],
      ]),
      upload(
        "cursor",
        "Загрузить курсор",
        "Прозрачный PNG / WebP · 48 × 48 px",
      ),
      field("cursorColor", "Цвет курсора", "color"),
      field("cursorSize", "Размер", "range", {
        min: 12,
        max: 48,
        step: 1,
        format: " px",
      }),
      field("cursorThickness", "Толщина контура", "range", {
        min: 1,
        max: 4,
        step: 0.25,
        format: " px",
      }),
      field("cursorGlow", "Свечение курсора", "range", {
        min: 0,
        max: 100,
        step: 1,
        format: "%",
      }),
      toggle("cursorTrail", "Световой след", "Тонкий шлейф за движением руки."),
      field("trailLength", "Длина следа", "range", {
        min: 60,
        max: 350,
        step: 10,
        format: " мс",
      }),
      field("trailWidth", "Толщина следа", "range", {
        min: 1,
        max: 6,
        step: 0.5,
        format: " px",
      }),
      node(
        "p",
        "notice",
        "Перемести мышь в предпросмотр. Курсор редактора остаётся системным, чтобы настройки было удобно менять.",
      ),
    );
    const cross = group("Прицел");
    cross.append(
      field("crosshairGap", "Зазор в центре", "range", {
        min: 0,
        max: 14,
        step: 1,
        format: " px",
      }),
      field("crosshairArms", "Длина лучей", "range", {
        min: 2,
        max: 16,
        step: 1,
        format: " px",
      }),
      toggle("crosshairDot", "Точка по центру"),
      toggle("crosshairOutline", "Контрастная обводка"),
    );
    panel.append(g, cross);
  }
  function makeEffects(panel) {
    const g = group("Движение");
    g.append(
      toggle(
        "motion",
        "Живая сцена",
        "Один плавный цикл. Пауза, когда вкладка скрыта.",
      ),
      toggle("parallax", "Глубина фона", "Лёгкий параллакс вслед за курсором."),
      toggle(
        "reveal",
        "Появление при прокрутке",
        "Блоки проявляются, когда попадают в кадр.",
      ),
    );
    const p = group("Частицы");
    p.append(
      field("particles", "Эффект", "select", {
        items: [
          ["none", "Без частиц"],
          ["snow", "Снег / снежинки"],
          ["dust", "Световая пыль"],
          ["rain", "Ночной дождь"],
          ["embers", "Искры"],
          ["stars", "Мерцание звёзд"],
          ["leaves", "Осенние листья"],
        ],
      }),
      toggle("snow", "Показывать частицы"),
      field("density", "Плотность", "range", {
        min: 0,
        max: 100,
        step: 1,
        format: "%",
      }),
      field("effectSpeed", "Скорость", "range", {
        min: 0.25,
        max: 2,
        step: 0.05,
        format: "×",
      }),
      button(
        "Посмотреть только фон",
        () => {
          const target = $("profile-preview"),
            on = target.classList.toggle("weather-only");
          $("weather-preview").textContent = on
            ? "Вернуть профиль"
            : "Посмотреть только фон";
        },
        "button secondary wide",
      ),
    );
    p.lastElementChild.id = "weather-preview";
    const effectStatus = node("p", "notice");
    effectStatus.id = "effect-status";
    effectStatus.setAttribute("role", "status");
    const start = button("Включить эффект", () => {
      setPrefs({
        motion: true,
        snow: true,
        particles: prefs.particles === "none" ? "snow" : prefs.particles,
        density: prefs.density || 35,
      });
      commit();
    });
    start.id = "start-particles";
    p.append(effectStatus, start);
    const leafLink = button("Цвета листвы · 5 оттенков", () => {
      $("leaf-controls").scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    });
    leafLink.id = "leaf-colors-link";
    p.append(leafLink);
    const leaf = group("Смесь листвы", "Всего 100%");
    leaf.id = "leaf-controls";
    const bar = node("div", "leaf-mixture");
    bar.id = "leaf-mixture";
    const leafLabels = [
      ["leafGreen", "Зелёные", "#71854a"],
      ["leafYellow", "Жёлтые", "#ceb34f"],
      ["leafOrange", "Оранжевые", "#bd743a"],
      ["leafBrown", "Коричневые", "#75533c"],
      ["leafMixed", "Зелёно-жёлтые", "#9d9b4d"],
    ];
    for (const [key, label, color] of leafLabels) {
      const part = node("span");
      part.dataset.share = key;
      part.style.background = color;
      bar.append(part);
      leaf.append(
        field(key, label, "range", { min: 0, max: 100, step: 1, format: "%" }),
      );
    }
    leaf.prepend(bar);
    const mixes = node("div", "chip-row");
    for (const [name, mix] of [
      ["Ранняя", [40, 20, 15, 5, 20]],
      ["Золотая", [5, 45, 35, 10, 5]],
      ["Поздняя", [0, 10, 35, 50, 5]],
      ["Поровну", [20, 20, 20, 20, 20]],
    ])
      mixes.append(
        button(
          name,
          () => {
            setPrefs(Object.fromEntries(o.leafKeys.map((k, i) => [k, mix[i]])));
            commit();
          },
          "chip",
        ),
      );
    leaf.append(
      mixes,
      node(
        "p",
        "footnote",
        "Изменённая доля фиксируется, остальные пропорционально занимают остаток. Палитра меняется без перезапуска падения листьев.",
      ),
    );
    const v = group("Что показывать");
    v.append(
      toggle("hideStats", "Скрыть краткую статистику"),
      toggle("hideContributions", "Скрыть график активности"),
      toggle("hideReadme", "Скрыть README"),
      node(
        "p",
        "footnote",
        "Системная настройка уменьшения движения имеет приоритет. Анимации не требуют фиксированных 60 кадров: скорость движения рассчитывается по времени.",
      ),
    );
    panel.append(g, p, leaf, v);
  }
  function makeInterface(panel) {
    const g = group("Оболочка редактора", skins.length + " вариантов"),
      grid = node("div", "ui-grid");
    for (const [id, name, color, bg] of skins) {
      const b = button(
        "",
        () => {
          ui = { ...ui, skin: id, accent: "", follow: false };
          applyUI();
          scheduleSave();
        },
        "ui-swatch",
      );
      b.dataset.skin = id;
      b.style.setProperty("--swatch-bg", bg);
      b.style.setProperty("--swatch-color", color);
      b.append(node("i"), node("span", "", name));
      grid.append(b);
    }
    g.append(grid);
    const custom = group("Свой акцент");
    const wrap = node("label", "field", "Цвет кнопок и подсветки"),
      input = node("input");
    input.type = "color";
    input.id = "editor-accent";
    input.value =
      ui.accent || skins.find((s) => s[0] === ui.skin)?.[2] || "#a8c8e5";
    input.addEventListener("input", () => {
      ui.accent = input.value;
      ui.follow = false;
      applyUI();
      scheduleSave();
    });
    wrap.append(input);
    const follow = node("label", "toggle-row"),
      check = node("input");
    check.type = "checkbox";
    check.checked = ui.follow;
    check.id = "editor-follow";
    check.addEventListener("change", () => {
      ui.follow = check.checked;
      applyUI();
      scheduleSave();
    });
    follow.append(node("span", "", "Автоцвет из темы профиля"), check);
    custom.append(
      wrap,
      follow,
      button("Подобрать из фона", async () => {
        const [a] = await samplePalette();
        ui.accent = a;
        ui.follow = false;
        applyUI();
        scheduleSave();
      }),
      node(
        "p",
        "notice",
        "Эта палитра меняет только редактор: кнопки, панели и подсветку. Она не попадает в экспорт темы профиля.",
      ),
    );
    panel.append(g, custom);
    applyUI();
  }
  function makeSharing(panel) {
    const g = group("Файлы темы");
    g.append(
      button("Экспортировать оформление ↗", openExport, "button primary wide"),
      button("Импортировать .json", () => $("import-file").click()),
      node(
        "p",
        "footnote",
        "Поддерживаются темы версий 1, 2 и 3. Импорт проверяет данные до применения.",
      ),
    );
    const local = group("Мои сборки", library.length + "/12");
    local.append(
      button("Сохранить текущую сборку", () => nameLibraryVariant()),
    );
    if (!library.length)
      local.append(
        node(
          "div",
          "empty-state",
          "Здесь будут твои варианты. Сохрани тему и возвращайся к ней в один клик.",
        ),
      );
    for (const item of library) {
      const row = node("div", "library-item"),
        i = node("i");
      i.style.background = item.appearance.accent;
      row.append(
        i,
        node("strong", "", item.name),
        button(
          "Открыть",
          () => {
            themeName = item.name;
            setPrefs(item.appearance);
            commit();
          },
          "",
        ),
        button("Имя", () => nameLibraryVariant(item), ""),
        button(
          "Удалить",
          async () => {
            library = library.filter((p) => p.id !== item.id);
            await persist();
            navigate("sharing");
          },
          "",
        ),
      );
      local.append(row);
    }
    const pub = group("Публичный профиль");
    pub.append(
      node(
        "p",
        "footnote",
        "Публикация вынесена в отдельный раздел: скачать файл, открыть GitHub и проверить результат.",
      ),
      button("Перейти к публикации →", () => navigate("publish")),
      button("Открыть темы сообщества ↗", () =>
        window.open("gallery.html", "_blank", "noopener,noreferrer"),
      ),
    );
    panel.append(g, local, pub);
  }
  function makePublication(panel) {
    const intro = node("div", "publication-intro");
    intro.append(
      node(
        "strong",
        "",
        "Одно оформление - для всех посетителей с Profile Studio.",
      ),
      node(
        "p",
        "footnote",
        "Обычный README виден всем. Фон, рамку и эффекты увидят пользователи расширения, включившие темы владельцев.",
      ),
    );
    const identity = group("1. Профиль и название");
    const name = cardField(
      "Название темы",
      themeName,
      (v) => {
        themeName = v.slice(0, 80);
        scheduleSave();
      },
      { max: 80 },
    );
    name.querySelector("input").id = "publish-name";
    identity.append(
      field("login", "GitHub-ник", "text", {
        maxLength: 39,
        placeholder: "username",
      }),
      name,
    );
    const repository = cardField(
      "Существующий публичный репозиторий",
      publication.repo || login,
      (v) => {
        publication.repo = v.trim();
        updatePublication();
        scheduleSave();
      },
      { max: 100, placeholder: "имя-репозитория" },
    );
    repository.querySelector("input").id = "publish-repo";
    identity.append(
      repository,
      node(
        "p",
        "footnote",
        "Можно использовать любой свой публичный репозиторий. Создавать новый для темы не требуется.",
      ),
    );
    const pub = group("2. Содержимое публикации");
    const contentLabel = node("label", "check-row"),
      contentCheck = node("input");
    contentCheck.type = "checkbox";
    contentCheck.id = "publish-content";
    contentCheck.checked = publication.includePersonal;
    contentCheck.addEventListener("change", () => {
      publication.includePersonal = contentCheck.checked;
      scheduleSave();
    });
    contentLabel.append(
      contentCheck,
      node("span", "", "Включить аватар, тексты, проекты и ссылки"),
    );
    const remixLabel = node("label", "check-row"),
      remixCheck = node("input");
    remixCheck.type = "checkbox";
    remixCheck.id = "publish-remix";
    remixCheck.checked = publication.allowRemix;
    remixCheck.addEventListener("change", () => {
      publication.allowRemix = remixCheck.checked;
      scheduleSave();
    });
    remixLabel.append(
      remixCheck,
      node("span", "", "Разрешить другим использовать и изменять тему"),
    );
    pub.append(contentLabel, remixLabel);
    const steps = group("3. Опубликовать на GitHub");
    const downloadButton = button(
      "Скачать profile-studio.json",
      publishTheme,
      "button primary wide",
    );
    downloadButton.id = "publish-download";
    const openButton = button(
      "Открыть репозиторий профиля ↗",
      openPublicationTarget,
    );
    openButton.id = "publish-github";
    const checkButton = button("Проверить публикацию", checkPublication);
    checkButton.id = "publish-check";
    const target = node("code", "publication-path");
    target.id = "publish-path";
    const result = node("p", "notice");
    result.id = "publish-status";
    result.setAttribute("role", "status");
    const profileLink = node(
      "a",
      "button secondary wide",
      "Посмотреть профиль на GitHub ↗",
    );
    profileLink.id = "view-public-profile";
    profileLink.target = "_blank";
    profileLink.rel = "noopener noreferrer";
    steps.append(
      target,
      downloadButton,
      openButton,
      node(
        "p",
        "footnote",
        "Загрузи файл в корень выбранного репозитория через Add file → Upload files и сохрани изменения. Для автоматического поиска другими людьми добавь тему в каталог кнопкой ниже.",
      ),
      checkButton,
      result,
      profileLink,
    );
    pub.append(
      node(
        "p",
        "footnote",
        "Расширение читает публичный profile-studio.json. Тему в любом существующем репозитории владельца можно зарегистрировать в каталоге.",
      ),
      node(
        "p",
        "footnote",
        "Фон, шрифт и оформление включаются всегда. Галочка выше добавляет личное содержимое в публичный файл.",
      ),
    );
    const visitors = group("Темы других владельцев");
    const register = button("Добавить свою тему в каталог ↗", () => {
      const ref = publicationReference();
      const target = PCStudioSharing.issueURL({
        ...ref,
        name: themeName,
        description: prefs.bio || "Оформление GitHub-профиля",
        accent: prefs.accent,
      });
      window.open(target, "_blank", "noopener,noreferrer");
      toast("Открыт черновик заявки. Проверь и отправь его на GitHub.");
    });
    register.id = "publish-register";
    const gallery = node("a", "button secondary wide", "Открыть сообщество ↗");
    gallery.href = "gallery.html";
    visitors.append(
      register,
      gallery,
      node(
        "p",
        "footnote",
        "В меню расширения включи «Темы владельцев профилей». На чужой странице загрузится оформление её автора. Твоя локальная тема имеет приоритет. Заявка в каталог отправляется с твоего аккаунта GitHub.",
      ),
    );
    panel.append(intro, identity, pub, steps, visitors);
    updatePublication();
  }
  function cardField(
    label,
    value,
    onChange,
    { type = "text", max = 240, placeholder = "" } = {},
  ) {
    const wrap = node("label", "field", label),
      input = node(type === "textarea" ? "textarea" : "input");
    if (type !== "textarea") input.type = type;
    input.value = value;
    input.maxLength = max;
    input.placeholder = placeholder;
    input.addEventListener("input", () => onChange(input.value));
    input.addEventListener("change", () => commit());
    if (type === "url")
      input.addEventListener("blur", () => {
        if (input.value && !o.safeURL(input.value))
          toast("Укажи полную ссылку https://…", true);
      });
    wrap.append(input);
    return wrap;
  }
  function makeProjects(panel) {
    const style = group("Вид карточек");
    style.append(
      toggle(
        "useCustomProjects",
        "Свои карточки",
        "Видны в теме. Настоящие закрепления GitHub не перезаписываются.",
      ),
      toggle("hideProjects", "Скрыть блок проектов"),
      field("projectsTitle", "Заголовок блока", "text", { maxLength: 60 }),
      field("projectsLayout", "Раскладка", "select", {
        items: [
          ["grid", "Сетка"],
          ["list", "Список"],
          ["spotlight", "Первый проект крупнее"],
        ],
      }),
      field("projectColumns", "Колонки", "range", { min: 1, max: 3, step: 1 }),
    );
    panel.append(style);
    const list = group("Карточки", prefs.projects.length + "/8");
    prefs.projects.forEach((project, index) => {
      const card = node("div", "project-editor"),
        bar = node("div", "project-editor-bar"),
        label = node(
          "strong",
          "",
          String(index + 1).padStart(2, "0") +
            " / " +
            (project.title || "Проект"),
        );
      const reorder = (delta) => {
        const data = [...prefs.projects],
          [item] = data.splice(index, 1);
        data.splice(index + delta, 0, item);
        setPrefs({ projects: data, useCustomProjects: true });
        commit();
        navigate("projects");
      };
      const up = button("↑", () => reorder(-1), "small-action"),
        down = button("↓", () => reorder(1), "small-action"),
        del = button(
          "×",
          () => {
            setPrefs({
              projects: prefs.projects.filter((_, i) => i !== index),
            });
            commit();
            navigate("projects");
          },
          "small-action",
        );
      up.disabled = index === 0;
      down.disabled = index === prefs.projects.length - 1;
      up.setAttribute("aria-label", "Поднять проект " + (index + 1));
      down.setAttribute("aria-label", "Опустить проект " + (index + 1));
      del.setAttribute("aria-label", "Удалить проект " + (index + 1));
      bar.append(label, up, down, del);
      card.append(bar);
      const patch = (key, value) => {
        const data = prefs.projects.map((p, i) =>
          i === index ? { ...p, [key]: value } : p,
        );
        setPrefs({ projects: data, useCustomProjects: true });
        if (key === "title")
          label.textContent =
            String(index + 1).padStart(2, "0") + " / " + (value || "Проект");
      };
      card.append(
        cardField("Название проекта", project.title, (v) => patch("title", v), {
          max: 60,
        }),
        cardField(
          "Описание проекта",
          project.description,
          (v) => patch("description", v),
          { type: "textarea", max: 240 },
        ),
        cardField("Ссылка проекта", project.url, (v) => patch("url", v), {
          type: "url",
          max: 300,
          placeholder: "https://github.com/name/repo",
        }),
        cardField(
          "Язык или подпись",
          project.language,
          (v) => patch("language", v),
          { max: 24, placeholder: "JavaScript" },
        ),
        cardField("Цвет метки", project.color, (v) => patch("color", v), {
          type: "color",
        }),
      );
      list.append(card);
    });
    const add = button(
      "+ Добавить проект",
      () => {
        setPrefs({
          projects: [
            ...prefs.projects,
            {
              title: "Новый проект",
              description: "",
              url: "",
              language: "",
              color: "#999999",
            },
          ],
          useCustomProjects: true,
        });
        commit();
        navigate("projects");
      },
      "button primary wide",
    );
    add.id = "add-project";
    add.disabled = prefs.projects.length >= 8;
    list.append(add);
    panel.append(
      list,
      node(
        "p",
        "footnote",
        "Порядок меняется стрелками. Карточки можно включить в экспорт вместе с содержимым профиля. Ссылки принимаются только с https://.",
      ),
    );
  }
  function makeMini(panel) {
    const mode = group("Размещение");
    mode.append(
      field("profileLayout", "Формат профиля", "select", {
        items: [
          ["full", "Полный / боковая колонка"],
          ["compact", "Компактный / карточка сверху"],
        ],
      }),
      field("miniAlign", "Выравнивание карточки", "select", {
        items: [
          ["left", "Аватар слева"],
          ["center", "По центру"],
        ],
      }),
      toggle("miniCover", "Мягкий фон карточки"),
      field("miniNote", "Дополнительная строка", "textarea", {
        maxLength: 140,
        placeholder: "Короткая подпись или статус",
      }),
    );
    panel.append(mode);
    const avatar = group("Аватар мини-профиля");
    avatar.append(
      upload(
        "mini",
        "Отдельный аватар мини-профиля",
        "PNG, JPG, WebP · до 6 МБ",
      ),
      button("Использовать общий аватар", () => {
        setPrefs({ miniAvatar: "" });
        commit();
      }),
      node(
        "p",
        "footnote",
        "Можно загрузить другое изображение для компактной карточки. Общий аватар останется прежним.",
      ),
    );
    panel.append(avatar);
    const links = group("Кнопки и ссылки", prefs.miniLinks.length + "/4");
    prefs.miniLinks.forEach((link, index) => {
      const box = node("div", "project-editor"),
        bar = node("div", "project-editor-bar");
      bar.append(
        node("strong", "", "Ссылка " + (index + 1)),
        button(
          "Удалить",
          () => {
            setPrefs({
              miniLinks: prefs.miniLinks.filter((_, i) => i !== index),
            });
            commit();
            navigate("mini");
          },
          "text-button",
        ),
      );
      box.append(bar);
      const patch = (key, value) =>
        setPrefs({
          miniLinks: prefs.miniLinks.map((p, i) =>
            i === index ? { ...p, [key]: value } : p,
          ),
        });
      box.append(
        cardField("Текст кнопки", link.label, (v) => patch("label", v), {
          max: 40,
        }),
        cardField("Адрес ссылки", link.url, (v) => patch("url", v), {
          type: "url",
          max: 300,
          placeholder: "https://…",
        }),
      );
      links.append(box);
    });
    const add = button("+ Добавить ссылку", () => {
      setPrefs({
        miniLinks: [...prefs.miniLinks, { label: "Моя ссылка", url: "" }],
      });
      commit();
      navigate("mini");
    });
    add.id = "add-mini-link";
    add.disabled = prefs.miniLinks.length >= 4;
    links.append(add);
    panel.append(
      links,
      node(
        "p",
        "notice",
        "Имя, био, аватар и рамка берутся из раздела «Профиль». Формат можно переключать, не теряя заполненные данные.",
      ),
    );
  }
  const makers = {
    collection: makeCollection,
    background: makeBackground,
    profile: makeProfile,
    projects: makeProjects,
    mini: makeMini,
    type: makeType,
    cursor: makeCursor,
    effects: makeEffects,
    interface: makeInterface,
    sharing: makeSharing,
    publish: makePublication,
  };
  const interfaceMaker = makers.interface;
  makers.interface = (panel) => {
    interfaceMaker(panel);
    const g = group("Живые акценты"),
      label = node("label", "toggle-row"),
      input = node("input");
    input.type = "checkbox";
    input.checked = ui.motion;
    input.id = "editor-motion";
    input.addEventListener("change", () => {
      ui.motion = input.checked;
      applyUI();
      scheduleSave();
    });
    label.append(node("span", "", "Мягкое движение света"), input);
    g.append(
      label,
      node(
        "p",
        "footnote",
        "Едва заметные переливы в панели редактора. Можно отключить независимо от анимации профиля.",
      ),
    );
    panel.append(g);
  };
  const sharingMaker = makers.sharing;
  makers.sharing = (panel) => {
    sharingMaker(panel);
    if (api) {
      const g = group("Моя базовая тема");
      g.append(
        button("Использовать на профилях без темы", async () => {
          const clean = { ...prefs };
          for (const k of o.personalKeys) clean[k] = "";
          const latest = o.normalizeState(
              await api.storage.local.get(o.storageKeys),
            ),
            patch = {
              ...o.appearanceChanges(latest, null, clean),
              styleUnpublished: true,
            };
          if (JSON.stringify({ ...latest, ...patch }).length > 8000000)
            throw Error("Недостаточно места. Уменьши изображения.");
          await api.storage.local.set(patch);
          state = o.normalizeState({ ...latest, ...patch });
          toast(
            "Базовое оформление сохранено. Темы владельцев и отдельные настройки имеют приоритет.",
          );
        }),
        node(
          "p",
          "footnote",
          "Аватар и тексты сюда не входят. Отключить базовую тему можно во всплывающем меню расширения.",
        ),
      );
      panel.append(g);
    }
  };
  function navigate(id) {
    if (id !== "effects") $("profile-preview").classList.remove("weather-only");
    activeSection = id;
    controls.clear();
    $("settings").replaceChildren();
    const s = sections.find((s) => s[0] === id);
    $("section-kicker").textContent = s[4];
    $("section-title").textContent = s[3];
    $("section-description").textContent = s[5];
    document
      .querySelectorAll("[data-section]")
      .forEach((n) =>
        n.setAttribute(
          "aria-current",
          n.dataset.section === id ? "page" : "false",
        ),
      );
    makers[id]($("settings"));
    $("settings").scrollTop = 0;
    render();
  }
  for (const [id, glyph, label] of sections) {
    const b = button(
      "",
      () => navigate(id),
      "nav-item" + (id === "publish" ? " rail-bottom" : ""),
    );
    b.dataset.section = id;
    b.title = label;
    b.replaceChildren(icon(glyph));
    b.append(node("span", "", label));
    $("navigation").append(b);
  }
  async function samplePalette() {
    let source = prefs.customBackground;
    if (prefs.background !== "custom")
      source =
        prefs.background === "forest"
          ? "media/winter-forest-wide.webp"
          : prefs.background === "lake"
            ? "media/winter-lake.png"
            : "";
    if (!source) return [prefs.accent, prefs.secondary];
    const img = new Image();
    img.src = source;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 48;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 48, 48);
    const data = ctx.getImageData(0, 0, 48, 48).data,
      bins = new Map();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 160) continue;
      const rgb = [data[i], data[i + 1], data[i + 2]],
        max = Math.max(...rgb),
        min = Math.min(...rgb);
      if (max < 25 || min > 235) continue;
      const key = rgb.map((v) => Math.floor(v / 32)).join(",");
      const entry = bins.get(key) || { count: 0, total: [0, 0, 0] };
      entry.count++;
      rgb.forEach((v, j) => (entry.total[j] += v));
      bins.set(key, entry);
    }
    const best = [...bins.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((e) => e.total.map((v) => Math.round(v / e.count)));
    if (!best.length) return ["#a8c8e5", "#ddd9ff"];
    const lift = (rgb) => {
      const max = Math.max(...rgb),
        factor = max < 155 ? 155 / Math.max(max, 1) : 1;
      return (
        "#" +
        rgb
          .map((v) =>
            Math.min(235, Math.round(v * factor * 0.65 + 245 * 0.35))
              .toString(16)
              .padStart(2, "0"),
          )
          .join("")
      );
    };
    const a = best[0],
      b =
        best
          .slice(1)
          .sort(
            (x, y) =>
              y.reduce((s, v, i) => s + (v - a[i]) ** 2, 0) -
              x.reduce((s, v, i) => s + (v - a[i]) ** 2, 0),
          )[0] || a;
    return [lift(a), lift(b)];
  }
  async function autoPalette() {
    const [a, b] = await samplePalette();
    setPrefs({ accent: a, secondary: b, cursorColor: a });
    commit();
    toast("Палитра подобрана. Цвета можно поправить вручную.");
  }
  async function imageData(file, kind) {
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 6 * 1024 * 1024
    )
      throw Error("Нужен PNG, JPG или WebP до 6 МБ.");
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (image.width * image.height > 60000000)
        throw Error("Изображение слишком большое. Максимум 60 мегапикселей.");
      const limit =
          kind === "cursor"
            ? 48
            : ["avatar", "mini"].includes(kind)
              ? 1600
              : 2560,
        scale = Math.min(1, limit / Math.max(image.width, image.height)),
        canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const value = canvas.toDataURL(
        kind === "cursor" ? "image/png" : "image/webp",
        0.96,
      );
      if (value.length > 6000000)
        throw Error("Изображение слишком тяжёлое. Выбери файл поменьше.");
      return value;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  $("image-file").addEventListener("change", async (e) => {
    const file = e.target.files[0],
      kind = uploadTarget;
    e.target.value = "";
    if (!file) return;
    try {
      const value = await imageData(file, kind);
      setPrefs(
        kind === "background"
          ? { customBackground: value, background: "custom" }
          : kind === "mini"
            ? { miniAvatar: value, profileLayout: "compact" }
            : kind === "avatar"
              ? { customAvatar: value }
              : { cursorImage: value, cursor: "custom" },
      );
      commit();
      toast("Изображение добавлено.");
    } catch (e) {
      toast(e.message, true);
    }
  });
  $("font-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024)
        throw Error("Максимальный размер шрифта 2 МБ.");
      const bytes = new Uint8Array(await file.arrayBuffer()),
        ext = file.name.split(".").pop().toLowerCase();
      if (!["ttf", "otf", "woff", "woff2"].includes(ext))
        throw Error("Поддерживаются TTF, OTF, WOFF и WOFF2.");
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192)
        binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      const data = "data:font/" + ext + ";base64," + btoa(binary);
      if (!o.validFont(data))
        throw Error("Файл не похож на поддерживаемый шрифт.");
      await new FontFace("StudioValidation", bytes).load();
      setPrefs({
        font: "custom",
        customFont: data,
        fontName: file.name.slice(0, 80).replace(/[\\/]/g, ""),
      });
      commit();
      toast("Шрифт " + file.name + " подключён.");
    } catch (e) {
      toast(e.message || "Не удалось загрузить шрифт.", true);
    }
  });
  function download(source, name) {
    const url = URL.createObjectURL(
        new Blob([source], { type: "application/json" }),
      ),
      a = node("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  function openExport() {
    if (editorMode === "readme") {
      readmeEditor.download();
      return;
    }
    $("theme-name").value = themeName;
    $("export-dialog").showModal();
  }
  $("export-top").addEventListener("click", openExport);
  $("download-theme").addEventListener("click", () => {
    themeName = $("theme-name").value.trim() || "My space";
    const source = o.serializeTheme(prefs, {
      name: themeName,
      includePersonal: $("include-personal").checked,
    });
    if (source.length > 8000000) {
      toast("Тема слишком большая. Уменьши изображение или шрифт.", true);
      return;
    }
    download(
      source,
      (themeName.replace(/[^a-z0-9_-]/gi, "-").slice(0, 50) || "my-theme") +
        ".json",
    );
    $("export-dialog").close();
    scheduleSave();
    toast("Тема экспортирована.");
  });
  $("import-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      if (file.size > 8000000) throw Error("Тема должна быть меньше 8 МБ.");
      const source = await file.text();
      let parsed;
      try {
        parsed = o.parseTheme(source);
      } catch (error) {
        const wrapper = PCStudioSharing.parse(source);
        if (!wrapper.allowRemix)
          throw Error("Автор отключил использование этой темы для ремикса.");
        parsed = wrapper.theme;
        basedOn = { owner: wrapper.owner, file: PCStudioSharing.FILE };
      }
      setPrefs({ ...o.defaults, ...parsed.appearance });
      themeName = parsed.name;
      commit();
      toast("Тема «" + themeName + "» импортирована.");
    } catch (e) {
      toast(e.message, true);
    }
  });
  function publicationSource() {
    const owner = o.loginFor(login);
    if (!owner) throw Error("Укажи свой GitHub-ник в разделе «Профиль».");
    return PCStudioSharing.serialize(prefs, {
      owner,
      name: themeName,
      includePersonal: publication.includePersonal,
      allowRemix: publication.allowRemix,
      basedOn,
    });
  }
  function publicationReference() {
    return PCStudioSharing.reference({
      owner: o.loginFor(login),
      repo: publication.repo || o.loginFor(login),
    });
  }
  function updatePublication() {
    if (!$("publish-path")) return;
    const owner = o.loginFor(login);
    let ref;
    try {
      ref = publicationReference();
    } catch {}
    $("publish-path").textContent = ref
      ? owner + "/" + (ref.repo || owner) + "/profile-studio.json"
      : "Укажи свой ник и корректное имя репозитория";
    $("view-public-profile").hidden = !owner;
    $("view-public-profile").href = owner ? "https://github.com/" + owner : "#";
    for (const id of [
      "publish-download",
      "publish-github",
      "publish-check",
      "publish-register",
    ])
      if ($(id)) $(id).disabled = !ref;
    $("publish-status").textContent = api
      ? "Проверка читает публичный файл с GitHub после твоего нажатия."
      : "Это локальный предпросмотр. Проверка опубликованной темы доступна в установленном расширении.";
    $("publish-check").disabled = !ref || !api;
  }
  async function publicationMessage(message) {
    if (!api) throw Error("Открой этот раздел в установленном расширении.");
    if (!(await PCStudioConsent.request()))
      throw Error("Разреши загрузку публичных тем GitHub.");
    const r = await api.runtime.sendMessage(message);
    if (!r?.ok) throw Error(r?.error || "Не удалось проверить GitHub.");
    return r;
  }
  async function openPublicationTarget() {
    const owner = o.loginFor(login);
    if (!owner) throw Error("Укажи GitHub-ник.");
    if (!api) {
      const ref = publicationReference();
      window.open(
        "https://github.com/" + owner + "/" + (ref.repo || owner),
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }
    const r = await publicationMessage({
      type: "studio-publish-target",
      ref: publicationReference(),
    });
    window.open(r.uploadURL || r.createURL, "_blank", "noopener,noreferrer");
    $("publish-status").textContent = r.createURL
      ? "Сначала создай публичный репозиторий с тем же ником. Затем загрузи скачанный файл."
      : "Открыта загрузка файлов. Выбери profile-studio.json и сохрани изменения на GitHub.";
  }
  async function checkPublication() {
    const owner = o.loginFor(login);
    if (!owner) throw Error("Укажи GitHub-ник.");
    $("publish-status").textContent = "Проверяем опубликованную тему…";
    try {
      const r = await publicationMessage({
        type: "studio-fetch-theme",
        ref: publicationReference(),
        refresh: true,
      });
      if (!r.theme)
        throw Error(
          "Публичный profile-studio.json пока не найден. Проверь имя репозитория и сохранение файла.",
        );
      const current = PCStudioSharing.parse(publicationSource(), owner);
      const matches = JSON.stringify(current) === JSON.stringify(r.theme);
      $("publish-status").textContent = matches
        ? "Опубликовано. Текущая тема доступна посетителям с Profile Studio."
        : "Тема владельца найдена: «" +
          r.theme.theme.name +
          "». Она отличается от текущего черновика.";
    } catch (e) {
      $("publish-status").textContent = e.message;
    }
  }
  async function publishTheme() {
    const ref = publicationReference();
    download(publicationSource(), "profile-studio.json");
    if ($("publish-status"))
      $("publish-status").textContent =
        "Файл скачан. Загрузи его в корень выбранного репозитория и сохрани изменения.";
    toast(
      "Загрузи profile-studio.json в корень публичного репозитория " +
        ref.owner +
        "/" +
        (ref.repo || ref.owner) +
        ".",
    );
  }
  async function save() {
    if (editorMode === "readme") {
      readmeEditor.save();
      await persist();
      return;
    }
    commit();
    clearTimeout(saveTimer);
    if (api) {
      if (!o.loginFor(login)) {
        navigate("profile");
        $("login").focus();
        throw Error("Укажи GitHub-ник, чтобы применить тему к профилю.");
      }
      const patch = o.appearanceChanges(state, login, prefs),
        next = { ...state, ...patch, enabled: true };
      if (JSON.stringify(next).length > 8000000)
        throw Error("Лимит настроек 8 МБ. Уменьши изображения или шрифты.");
      await api.storage.local.set({ ...patch, enabled: true });
      state = o.normalizeState(next);
      $("save-status").textContent = "Применено к @" + login;
      toast(
        "Оформление @" +
          login +
          " сохранено в расширении. Обнови вкладку профиля.",
      );
    } else {
      await persist();
      toast(
        "Черновик сохранён. Чтобы применить к GitHub, экспортируй тему и импортируй её в расширение.",
      );
    }
  }
  $("save").addEventListener("click", () =>
    save().catch((e) => toast(e.message, true)),
  );
  $("publish-top").addEventListener("click", () => {
    if (editorMode === "readme") {
      readmeEditor.download();
      return;
    }
    navigate("publish");
  });
  function setEditorMode(mode) {
    editorMode = mode === "readme" ? "readme" : "extension";
    const basic = editorMode === "readme";
    $("readme-workspace").hidden = !basic;
    $("extension-workspace").hidden = basic;
    $("mode-readme").setAttribute("aria-selected", String(basic));
    $("mode-extension").setAttribute("aria-selected", String(!basic));
    $("mode-readme").tabIndex = basic ? 0 : -1;
    $("mode-extension").tabIndex = basic ? -1 : 0;
    $("mode-explainer").textContent = basic
      ? "Баннеры, текст и значки, которые увидят все"
      : "Фон, рамки и эффекты для посетителей с Profile Studio";
    $("publish-top").textContent = basic ? "Скачать README" : "Опубликовать";
    $("undo").disabled = $("redo").disabled = basic;
    if (!basic) historyButtons();
    document.body.dataset.editorMode = editorMode;
    scheduleSave();
  }
  for (const mode of ["readme", "extension"]) {
    $("mode-" + mode).addEventListener("click", () => setEditorMode(mode));
    $("mode-" + mode).addEventListener("keydown", (e) => {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const next =
          e.key === "Home"
            ? "readme"
            : e.key === "End"
              ? "extension"
              : mode === "readme"
                ? "extension"
                : "readme";
        setEditorMode(next);
        $("mode-" + next).focus();
      }
    });
  }
  $("undo").replaceChildren(icon("undo"));
  $("redo").replaceChildren(icon("redo"));
  $("undo").addEventListener("click", () => travel(-1));
  $("redo").addEventListener("click", () => travel(1));
  $("reset").addEventListener("click", () => {
    setPrefs({ ...o.defaults });
    commit();
    toast("Оформление сброшено. Можно отменить кнопкой ↶.");
  });
  document.querySelectorAll("[data-device]").forEach((b) => {
    b.replaceChildren(icon(b.dataset.device));
    b.addEventListener("click", () => {
      $("browser-frame").classList.toggle(
        "mobile",
        b.dataset.device === "mobile",
      );
      document
        .querySelectorAll("[data-device]")
        .forEach((n) => n.setAttribute("aria-pressed", String(n === b)));
    });
  });
  $("focus-mode").replaceChildren(icon("expand"));
  $("focus-mode").addEventListener("click", () =>
    document.body.classList.toggle("focused"),
  );
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      void save().catch((e) => toast(e.message, true));
    }
    if (
      editorMode === "extension" &&
      !document.querySelector("dialog[open]") &&
      (e.ctrlKey || e.metaKey) &&
      e.key.toLowerCase() === "z" &&
      !/INPUT|TEXTAREA/.test(document.activeElement.tagName)
    ) {
      e.preventDefault();
      travel(e.shiftKey ? 1 : -1);
    }
    if (e.key === "Escape") document.body.classList.remove("focused");
  });
  const grid = $("contribution-grid");
  for (let i = 0; i < 245; i++) {
    const cell = node("i");
    cell.style.setProperty(
      "--level",
      String(
        [6, 10, 18, 28, 45, 65][
          Math.floor(((Math.sin(i * 27.113) + 1) / 2) * 6) % 6
        ],
      ) + "%",
    );
    grid.append(cell);
  }
  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          if (prefs.reveal) e.target.classList.add("show");
        } else e.target.classList.remove("show");
      }),
    { root: $("preview-scroll"), threshold: 0.15 },
  );
  document.querySelectorAll(".ps-reveal").forEach((n) => reveal.observe(n));
  try {
    const saved = await disk("readonly");
    if (saved) {
      prefs = o.normalize(saved.prefs);
      login =
        o.loginFor(query.get("profile")) || o.loginFor(saved.login) || login;
      try {
        basedOn = saved.basedOn
          ? PCStudioSharing.reference(saved.basedOn)
          : null;
      } catch {
        basedOn = null;
      }
      themeName =
        typeof saved.themeName === "string"
          ? saved.themeName.slice(0, 80)
          : themeName;
      showcaseId =
        saved.showcaseId === "psichopodobny/1.5.4" ? saved.showcaseId : "";
      ui = { ...ui, ...saved.ui };
      publication = {
        includePersonal: saved.publication?.includePersonal === true,
        allowRemix: saved.publication?.allowRemix !== false,
        repo:
          typeof saved.publication?.repo === "string"
            ? saved.publication.repo.slice(0, 100)
            : "",
      };
      editorMode = saved.editorMode === "readme" ? "readme" : "extension";
      readmeDraft = PCStudioReadmeCore.normalize(saved.readme);
      library = Array.isArray(saved.library)
        ? saved.library
            .slice(0, 12)
            .filter((p) => p && typeof p.name === "string" && p.appearance)
            .map((p) => ({
              id: String(p.id),
              name: p.name.slice(0, 80),
              appearance: o.normalize(p.appearance),
            }))
        : [];
    }
  } catch {
    toast("Хранилище недоступно. Можно работать и экспортировать тему.", true);
  }
  if (api) {
    try {
      state = o.normalizeState(await api.storage.local.get(o.storageKeys));
      if (!query.has("draft")) prefs = o.effective(state, login);
      $("mode-label").textContent = "Расширение · @" + login;
    } catch (e) {
      toast("Не удалось прочитать настройки расширения.", true);
    }
  }
  if (query.has("preset")) {
    const preset = PCWinterPresets.find((p) => p.id === query.get("preset"));
    if (preset) {
      prefs = o.normalize({ ...prefs, ...preset.appearance });
      themeName = preset.name;
      basedOn = null;
    }
  }
  if (
    query.get("showcase") === "psichopodobny" &&
    showcaseId !== "psichopodobny/1.5.4"
  ) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "personal-profile.js";
        script.onload = resolve;
        script.onerror = () => reject(Error("Не удалось открыть личную тему."));
        document.head.append(script);
      });
      const personal = PCStudioSharing.parse(
        JSON.stringify(PCStudioPersonalProfile),
        "psichopodobny",
      );
      prefs = o.normalize({ ...o.defaults, ...personal.theme.appearance });
      login = personal.owner;
      themeName = personal.theme.name;
      showcaseId = "psichopodobny/1.5.4";
      basedOn = null;
      publication = {
        includePersonal: true,
        allowRemix: true,
        repo: "Profile-Studio-GitHub-Themes",
      };
    } catch (e) {
      toast(e.message, true);
    }
  }
  const requestedFrame = PCStudioFrames.catalog.find(
    (c) => c.id === query.get("frame"),
  );
  if (requestedFrame)
    prefs = o.normalize({
      ...prefs,
      frame: requestedFrame.id,
      ...(requestedFrame.source
        ? PCStudioFrameSettings.reset(requestedFrame)
        : {}),
      ...(["steam", "original"].includes(requestedFrame.source)
        ? {
            ...PCStudioFrameSettings.reset(requestedFrame),
            avatarShape: requestedFrame.shape,
            frameOriginalColors: requestedFrame.source === "steam",
            framePlaybackRate: 1,
            frameScale: 100,
            frameIntensity: 100,
            frameWidth: 2,
          }
        : {}),
      ...(requestedFrame.accent
        ? {
            frameUseThemeColors: false,
            frameAccent: requestedFrame.accent,
            frameSecondary: requestedFrame.secondary,
          }
        : {}),
    });
  if (requestedFrame && query.has("frameSettings"))
    prefs = o.normalize({
      ...prefs,
      ...PCStudioFrameSettings.parse(query.get("frameSettings")),
      frame: requestedFrame.id,
    });
  if (requestedFrame) {
    const url = new URL(location.href);
    url.searchParams.delete("frame");
    url.searchParams.delete("frameSettings");
    window.history.replaceState(null, "", url.href);
  }
  history = [{ ...prefs }];
  historyIndex = 0;
  applyUI();
  navigate(
    query.get("section") === "publish"
      ? "publish"
      : requestedFrame
        ? "profile"
        : "collection",
  );
  if (requestedFrame) scheduleSave();
  historyButtons();
  readmeEditor = PCStudioReadme.create({
    container: $("readme-workspace"),
    initial: readmeDraft,
    fromTheme: () => ({ login, prefs }),
    notify: toast,
    onChange: (value) => {
      readmeDraft = value;
      scheduleSave();
    },
  });
  setEditorMode(
    query.get("mode") === "readme"
      ? "readme"
      : query.get("mode") === "extension"
        ? "extension"
        : editorMode,
  );
  if (api && query.has("remix")) {
    try {
      const owner = o.loginFor(query.get("remix"));
      if (!owner) throw Error("Некорректный автор.");
      const result = await api.runtime.sendMessage({
        type: "studio-fetch-theme",
        ref: {
          owner,
          file: query.get("file") || PCStudioSharing.FILE,
          ...(query.get("repo") ? { repo: query.get("repo") } : {}),
        },
      });
      if (!result?.ok || !result.theme)
        throw Error(result?.error || "Автор ещё не опубликовал тему.");
      if (!result.theme.allowRemix)
        throw Error("Автор не разрешил ремикс этой темы.");
      setPrefs({ ...o.defaults, ...result.theme.theme.appearance });
      themeName = result.theme.theme.name + " remix";
      basedOn = PCStudioSharing.reference({
        owner,
        file: query.get("file") || PCStudioSharing.FILE,
        ...(query.get("repo") ? { repo: query.get("repo") } : {}),
      });
      commit();
      toast("Тема автора загружена для ремикса.");
    } catch (e) {
      toast(e.message, true);
    }
  }
  comparisonBaseline = { prefs: o.normalize(prefs), login };
  studioTools = PCStudioTools.create({
    sections,
    extraEntries: () => [
      {
        id: "save-variant",
        label: "Сохранить свой вариант",
        detail: "Мои сборки · только на этом устройстве",
        keywords: "save snapshot сохранить сборка вариант",
        run: () => nameLibraryVariant(),
      },
      {
        id: "ordinary",
        label: "Обычный GitHub",
        detail: "Баннер, текст и проекты без расширения",
        keywords: "readme markdown баннер",
        run: () => setEditorMode("readme"),
      },
      ...library.map((item) => ({
        id: "library-" + item.id,
        label: item.name,
        detail: "Моя сборка · открыть",
        keywords: "сборка saved",
        run: () => {
          themeName = item.name;
          setPrefs(item.appearance);
          commit();
        },
      })),
    ],
    navigate: (section, target) => {
      setEditorMode("extension");
      showComparison(false);
      navigate(section);
      const control = target ? document.getElementById(target) : null;
      if (control && !control.closest("[hidden]")) {
        control.scrollIntoView({ block: "center", behavior: "instant" });
        control.focus({ preventScroll: true });
        const field = control.closest(".field, .toggle-row") || control;
        field.classList.remove("search-highlight");
        requestAnimationFrame(() => field.classList.add("search-highlight"));
        setTimeout(() => field.classList.remove("search-highlight"), 1900);
      }
    },
    enterExtension: () => setEditorMode("extension"),
  });
  $("compare-before").addEventListener("click", () => showComparison(true));
  $("compare-current").addEventListener("click", () => showComparison(false));
  $("compare-pin").addEventListener("click", pinComparison);
  $("compare-return").addEventListener("click", () => showComparison(false));
  for (const id of ["compare-before", "compare-current", "compare-pin"])
    $(id).disabled = false;
  showComparison(false);
  window.addEventListener("pagehide", () => {
    clearTimeout(saveTimer);
    void persist();
    scene.destroy();
    reveal.disconnect();
  });
})();
