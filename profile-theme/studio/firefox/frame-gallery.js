(function () {
  "use strict";
  PCStudioColorPicker.enhance(document);
  const $ = (id) => document.getElementById(id),
    o = PCWinterOptions,
    settings = PCStudioFrameSettings;
  const catalog = PCStudioFrames.catalog;
  const fields = [
    "shape",
    "primary",
    "secondary",
    "recolor",
    "mix",
    "color-cycle",
    "speed",
    "scale",
    "width",
    "glow",
    "opacity",
    "motion",
    "collection",
  ];
  const storageKey = "profile-studio-frame-lab-v1";
  for (const id of ["primary", "secondary"]) {
    let beforeColor;
    $(id).addEventListener("studio-color-open", () => {
      beforeColor = Object.fromEntries(
        fields.map((k) => [
          k,
          $(k).type === "checkbox" ? $(k).checked : $(k).value,
        ]),
      );
    });
    $(id).addEventListener("studio-color-cancel", () => {
      if (!beforeColor) return;
      for (const [k, v] of Object.entries(beforeColor))
        if ($(k).type === "checkbox") $(k).checked = v;
        else $(k).value = v;
      render();
      save();
    });
  }
  let selected = catalog.find((c) => c.source === "original") || catalog[0],
    avatar = "",
    pending = 0;
  const palettes = [
    ["Арктика", "#b8e9fa", "#6c99d9"],
    ["Сакура", "#ffe6f1", "#df8eb4"],
    ["Аметист", "#b9a0ef", "#654a9b"],
    ["Нефрит", "#a0efd5", "#319c8a"],
    ["Алый", "#fa627c", "#7c223f"],
    ["Янтарь", "#f8cf82", "#ab743d"],
    ["Серебро", "#f0f2fa", "#9299ad"],
    ["Графит", "#3b3c47", "#13151c"],
  ];
  function prefsFor(c) {
    return o.normalize({
      ...o.defaults,
      frame: c.id,
      frameUseThemeColors: false,
      avatarShape: c.id === "roses" ? "circle" : $("shape").value,
      frameOriginalColors: !$("recolor").checked,
      frameAccent: $("recolor").checked
        ? $("primary").value
        : c.accent || "#b9d8ef",
      frameSecondary: $("recolor").checked
        ? $("secondary").value
        : c.secondary || "#ffffff",
      frameColorStrength: +$("mix").value,
      frameColorCycle: $("color-cycle").checked,
      framePlaybackRate: +$("speed").value / 100,
      frameSpeed: 12 / (+$("speed").value / 100),
      frameScale: +$("scale").value,
      frameWidth: +$("width").value,
      frameGlow: +$("glow").value,
      frameIntensity: +$("opacity").value,
      motion: $("motion").checked,
    });
  }
  function draw(frame, prefs) {
    frame.style.borderRadius =
      prefs.avatarShape === "circle"
        ? "50%"
        : prefs.avatarShape === "square"
          ? "4px"
          : "22%";
    PCStudioFrames.update(frame, prefs);
  }
  function save() {
    try {
      const data = { selected: selected.id };
      fields.forEach((id) => {
        const n = $(id);
        data[id] = n.type === "checkbox" ? n.checked : n.value;
      });
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {}
  }
  function restore() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!data) return;
      fields.forEach((id) => {
        const n = $(id);
        if (n.type === "checkbox" && typeof data[id] === "boolean")
          n.checked = data[id];
        else if (
          n.type !== "checkbox" &&
          typeof data[id] === "string" &&
          data[id].length < 30
        )
          n.value = data[id];
      });
      selected = catalog.find((c) => c.id === data.selected) || selected;
    } catch {}
  }
  for (const c of catalog) {
    const card = document.createElement("article");
    card.className = "sample";
    card.dataset.frame = c.id;
    card.dataset.collection = c.source || "studio";
    const badge = document.createElement("small");
    const choose = document.createElement("button");
    choose.type = "button";
    choose.className = "choose-frame";
    choose.setAttribute("aria-label", "Настроить " + c.name);
    const frame = document.createElement("span");
    frame.className = "ps-avatar-frame";
    const img = document.createElement("img");
    PCStudioAvatars.set(img);
    frame.append(img);
    choose.append(frame);
    choose.addEventListener("click", () => {
      selected = c;
      $("shape").value = c.shape || "square";
      render();
      save();
    });
    const h = document.createElement("h2");
    h.textContent = c.name;
    const caption = document.createElement("p");
    caption.textContent =
      c.source === "original" ? "Studio Originals" : c.description;
    const link = document.createElement("a");
    link.textContent = "В редактор ↗";
    link.setAttribute("aria-label", "Открыть " + c.name + " в редакторе");
    card.append(badge, choose, h, caption, link);
    $("frames").append(card);
  }
  function render() {
    pending = 0;
    let visible = 0;
    document.querySelectorAll(".sample").forEach((n) => {
      const c = catalog.find((c) => c.id === n.dataset.frame);
      n.hidden =
        $("collection").value !== "all" &&
        n.dataset.collection !== $("collection").value;
      if (!n.hidden)
        n.querySelector("small").textContent = String(++visible).padStart(
          2,
          "0",
        );
      n.dataset.selected = String(selected.id === c.id);
      const prefs =
        c.id === selected.id
          ? prefsFor(c)
          : o.normalize({
              ...o.defaults,
              ...settings.reset(c),
              frame: c.id,
              motion: $("motion").checked,
            });
      draw(n.querySelector(".ps-avatar-frame"), prefs);
      n.querySelector("a").href = settings.link(c.id, prefs);
    });
    const prefs = prefsFor(selected);
    draw($("focus-frame"), prefs);
    PCStudioAvatars.set($("focus-avatar"), avatar);
    $("focus-name").textContent = selected.name;
    $("focus-description").textContent =
      selected.source === "steam"
        ? "Исходная анимация Steam"
        : selected.description;
    $("focus-source").textContent =
      selected.source === "original"
        ? "STUDIO ORIGINALS"
        : selected.source === "steam"
          ? "STEAM / ORIGINAL"
          : "STUDIO";
    $("edit-selected").href = settings.link(selected.id, prefs);
    $("frame-count").textContent = visible;
    for (const [id, text] of [
      ["speed", prefs.framePlaybackRate + "×"],
      ["mix", prefs.frameColorStrength + "%"],
      ["scale", prefs.frameScale + "%"],
      ["width", prefs.frameWidth + " px"],
      ["glow", prefs.frameGlow + "%"],
      ["opacity", prefs.frameIntensity + "%"],
    ])
      $(id + "-label").textContent = text;
    const originalPalette =
      selected.source === "steam"
        ? prefs.frameOriginalColors
        : prefs.frameAccent === selected.accent &&
          prefs.frameSecondary === selected.secondary;
    const exact =
      originalPalette &&
      !prefs.frameColorCycle &&
      prefs.framePlaybackRate === 1 &&
      prefs.frameScale === 100 &&
      prefs.frameWidth === 2 &&
      prefs.frameGlow === 0 &&
      prefs.frameIntensity === 100;
    $("original-state").textContent = exact
      ? "Оригинальный вид"
      : "Твой вариант";
    document
      .querySelectorAll("[data-speed]")
      .forEach((n) =>
        n.setAttribute(
          "aria-pressed",
          String(+n.dataset.speed === +$("speed").value),
        ),
      );
  }
  function queue() {
    if (!pending) pending = requestAnimationFrame(render);
    save();
  }
  $("frame-controls").addEventListener("input", (event) => {
    if (
      ["primary", "secondary", "mix"].includes(event.target.id) ||
      (event.target.id === "color-cycle" && event.target.checked)
    )
      $("recolor").checked = true;
    queue();
  });
  $("collection").addEventListener("change", () => {
    const c = catalog.find(
      (c) =>
        $("collection").value === "all" ||
        (c.source || "studio") === $("collection").value,
    );
    if (c && $("collection").value !== "all") selected = c;
    render();
    save();
  });
  $("reset-original").addEventListener("click", () => {
    const p = settings.reset(selected);
    $("shape").value = p.avatarShape;
    $("primary").value = p.frameAccent;
    $("secondary").value = p.frameSecondary;
    $("recolor").checked = !p.frameOriginalColors;
    $("mix").value = 100;
    $("color-cycle").checked = false;
    $("speed").value = 100;
    $("scale").value = 100;
    $("width").value = 2;
    $("glow").value = 0;
    $("opacity").value = 100;
    $("motion").checked = true;
    render();
    save();
  });
  for (const [name, a, b] of palettes) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "palette-chip";
    chip.title = name;
    chip.setAttribute("aria-label", "Палитра: " + name);
    chip.style.background = `linear-gradient(135deg,${a},${b})`;
    chip.addEventListener("click", () => {
      $("primary").value = a;
      $("secondary").value = b;
      $("recolor").checked = true;
      render();
      save();
    });
    $("palette-chips").append(chip);
  }
  document.querySelectorAll("[data-speed]").forEach((n) =>
    n.addEventListener("click", () => {
      $("speed").value = n.dataset.speed;
      render();
      save();
    }),
  );
  $("mode").addEventListener("click", () => {
    $("mode").textContent = document.body.classList.toggle("light")
      ? "Тёмный фон"
      : "Светлый фон";
  });
  $("choose-avatar").addEventListener("click", () =>
    $("sample-avatar").click(),
  );
  $("sample-avatar").addEventListener("change", () => {
    const file = $("sample-avatar").files[0];
    if (
      !file ||
      file.size > 6000000 ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type)
    )
      return;
    const reader = new FileReader();
    reader.onload = () => {
      avatar = String(reader.result);
      document
        .querySelectorAll(".sample img")
        .forEach((n) => PCStudioAvatars.set(n, avatar));
      render();
    };
    reader.readAsDataURL(file);
  });
  $("export-frame").addEventListener("click", () => {
    const blob = new Blob(
        [o.serializeTheme(prefsFor(selected), { name: selected.name })],
        { type: "application/json" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "profile-studio-" + selected.id + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $("frame-controls").addEventListener("submit", (event) =>
    event.preventDefault(),
  );
  restore();
  if (!$("collection").value) $("collection").value = "original";
  render();
})();
