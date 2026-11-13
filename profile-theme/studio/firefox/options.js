(function (root) {
  "use strict";
  const fonts = {
    system: '"Segoe UI",system-ui,sans-serif',
    mono: 'Consolas,"Courier New",monospace',
    serif: 'Georgia,"Times New Roman",serif',
    rounded: '"Trebuchet MS",Verdana,sans-serif',
    book: "Cambria,Georgia,serif",
    manrope: '"StudioManrope","Segoe UI",sans-serif',
    unbounded: '"StudioUnbounded","Segoe UI",sans-serif',
    jetbrains: '"StudioJetBrainsMono",Consolas,monospace',
    cormorant: '"StudioCormorantGaramond",Georgia,serif',
    custom: '"WinterUploaded",system-ui,sans-serif',
  };
  const bundledFonts = {
    manrope: {
      family: "StudioManrope",
      file: "media/fonts/Manrope.ttf",
      weight: "200 800",
    },
    unbounded: {
      family: "StudioUnbounded",
      file: "media/fonts/Unbounded.ttf",
      weight: "200 900",
    },
    jetbrains: {
      family: "StudioJetBrainsMono",
      file: "media/fonts/JetBrainsMono.ttf",
      weight: "100 800",
    },
    cormorant: {
      family: "StudioCormorantGaramond",
      file: "media/fonts/CormorantGaramond.ttf",
      weight: "300 700",
    },
  };
  const defaults = {
    enabled: true,
    showPublished: false,
    styleUnpublished: false,
    motion: true,
    snow: false,
    background: "solid",
    customBackground: "",
    accent: "#e5e5e5",
    secondary: "#ffffff",
    colorMode: "dark",
    font: "system",
    customFont: "",
    fontName: "",
    frame: "none",
    frameSpeed: 12,
    framePlaybackRate: 1,
    frameOriginalColors: true,
    frameColorStrength: 100,
    frameColorCycle: false,
    customFrame: "",
    avatarShape: "circle",
    customAvatar: "",
    miniAvatar: "",
    displayName: "",
    bio: "",
    headline: "",
    about: "",
    dim: 0,
    blur: 0,
    backgroundX: 50,
    backgroundY: 50,
    backgroundZoom: 100,
    backgroundColor: "#141414",
    frameWidth: 2,
    frameGlow: 18,
    frameUseThemeColors: true,
    frameAccent: "#b9d8ef",
    frameSecondary: "#ffffff",
    frameIntensity: 85,
    frameScale: 100,
    fontSize: 14,
    letterSpacing: 0,
    surfaceOpacity: 82,
    cardRadius: 16,
    cursor: "system",
    cursorImage: "",
    cursorSize: 24,
    cursorColor: "#e5e5e5",
    cursorTrail: false,
    cursorThickness: 1.5,
    cursorGlow: 25,
    crosshairGap: 4,
    crosshairArms: 7,
    crosshairDot: false,
    crosshairOutline: true,
    trailLength: 160,
    trailWidth: 2,
    particles: "snow",
    density: 35,
    effectSpeed: 1,
    leafGreen: 22,
    leafYellow: 28,
    leafOrange: 25,
    leafBrown: 10,
    leafMixed: 15,
    parallax: true,
    reveal: true,
    hideStats: false,
    hideContributions: false,
    hideReadme: false,
    hideProjects: false,
    useCustomProjects: false,
    projects: [],
    projectsTitle: "Проекты",
    projectsLayout: "grid",
    projectColumns: 2,
    profileLayout: "full",
    miniAlign: "left",
    miniCover: true,
    miniNote: "",
    miniLinks: [],
  };
  const keys = Object.keys(defaults),
    appearanceKeys = keys.filter(
      (k) => !["enabled", "showPublished", "styleUnpublished"].includes(k),
    ),
    personalKeys = [
      "customAvatar",
      "miniAvatar",
      "displayName",
      "bio",
      "headline",
      "about",
      "projects",
      "miniLinks",
      "miniNote",
    ],
    storageKeys = [...keys, "profiles"];
  const images = (v) =>
    typeof v === "string" &&
    v.length <= 6000000 &&
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v)
      ? v
      : "";
  function validFont(v) {
    if (
      typeof v !== "string" ||
      v.length > 2800000 ||
      !/^data:font\/(ttf|otf|woff|woff2);base64,[A-Za-z0-9+/]+={0,2}$/.test(v)
    )
      return "";
    return ["AAEAAA", "T1RUTw", "d09GRg", "d09GMg"].includes(
      v.split(",")[1].slice(0, 6),
    )
      ? v
      : "";
  }
  const text = (v, max) =>
    typeof v === "string"
      ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").slice(0, max)
      : "";
  const leafKeys = [
    "leafGreen",
    "leafYellow",
    "leafOrange",
    "leafBrown",
    "leafMixed",
  ];
  function leafMix(input = {}) {
    const supplied = leafKeys.some((k) => Object.hasOwn(input, k)),
      numbers = leafKeys.map((k) =>
        Number.isFinite(input[k]) && input[k] >= 0 && input[k] <= 100
          ? input[k]
          : supplied
            ? 0
            : defaults[k],
      );
    let sum = numbers.reduce((a, b) => a + b, 0);
    if (!sum) return Object.fromEntries(leafKeys.map((k) => [k, defaults[k]]));
    const exact = numbers.map((v) => (v / sum) * 100),
      values = exact.map(Math.floor);
    let remaining = 100 - values.reduce((a, b) => a + b, 0);
    const order = exact
      .map((v, i) => ({ i, rest: v - values[i] }))
      .sort((a, b) => b.rest - a.rest);
    for (let i = 0; i < remaining; i++) values[order[i].i]++;
    return Object.fromEntries(leafKeys.map((k, i) => [k, values[i]]));
  }
  function leafPatch(current, key, value) {
    const out = {},
      target = Math.max(0, Math.min(100, Math.round(value))),
      others = leafKeys.filter((k) => k !== key);
    let total = others.reduce((s, k) => s + current[k], 0);
    for (const k of others)
      out[k] =
        (100 - target) *
        (total
          ? current[k] / total
          : defaults[k] / others.reduce((s, n) => s + defaults[n], 0));
    out[key] = target;
    return leafMix(out);
  }
  function safeURL(value) {
    if (typeof value !== "string" || value.length > 300) return "";
    if (!value) return "";
    try {
      const u = new URL(value);
      return u.protocol === "https:" && !u.username && !u.password
        ? u.href
        : "";
    } catch {
      return "";
    }
  }
  function projects(value) {
    if (!Array.isArray(value) || value.length > 8) return [];
    return value.map((p) => ({
      title: text(p?.title, 60),
      description: text(p?.description, 240),
      url: safeURL(p?.url),
      language: text(p?.language, 24),
      color: /^#[\da-f]{6}$/i.test(p?.color || "") ? p.color : "#999999",
    }));
  }
  function links(value) {
    if (!Array.isArray(value) || value.length > 4) return [];
    return value.map((p) => ({
      label: text(p?.label, 40),
      url: safeURL(p?.url),
    }));
  }
  function same(a, b) {
    if (a === b) return true;
    if (
      !a ||
      !b ||
      typeof a !== "object" ||
      typeof b !== "object" ||
      Array.isArray(a) !== Array.isArray(b)
    )
      return false;
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every((k) => Object.hasOwn(b, k) && same(a[k], b[k]))
    );
  }
  function normalize(input = {}, motion = true) {
    input = input && typeof input === "object" ? input : {};
    const v = { ...defaults, motion };
    for (const k of [
      "enabled",
      "showPublished",
      "styleUnpublished",
      "motion",
      "snow",
      "cursorTrail",
      "parallax",
      "reveal",
      "hideStats",
      "hideContributions",
      "hideReadme",
      "crosshairDot",
      "crosshairOutline",
      "hideProjects",
      "useCustomProjects",
      "miniCover",
      "frameUseThemeColors",
      "frameOriginalColors",
      "frameColorCycle",
    ])
      if (typeof input[k] === "boolean") v[k] = input[k];
    for (const [k, allowed] of Object.entries({
      background: [
        "forest",
        "lake",
        "midnight",
        "neon",
        "aurora",
        "uikole",
        "ember",
        "custom",
        "solid",
        "gradient",
        "sunset",
        "coast",
        "autumn",
        "rose",
        "cosmos",
        "graphite",
        "coffee",
        "lavender",
        "terminal",
      ],
      font: Object.keys(fonts),
      frame: [
        "none",
        "frost",
        "orbit",
        "neon",
        "pulse",
        "double",
        "dashed",
        "aurora",
        "ember",
        "prism",
        "circuit",
        "laurel",
        "shadowfire",
        "ghost",
        "pixelfire",
        "ink",
        "smoke",
        "plasma",
        "slime",
        "sakura",
        "cat",
        "roses",
        "hearts",
        "technoir",
        "thorn",
        "crt",
        "projector",
        "inksolid",
        "corruption",
        "scribble",
        "otherside",
        "custom",
        "studio-ice",
        "studio-kintsugi",
        "studio-nocturne",
        "studio-petal",
        "studio-afterburn",
        "studio-kitten",
      ],
      avatarShape: ["circle", "rounded", "square"],
      cursor: ["system", "dot", "ring", "crosshair", "glow", "custom"],
      particles: ["none", "snow", "rain", "embers", "stars", "leaves", "dust"],
      colorMode: ["dark", "light"],
      projectsLayout: ["grid", "list", "spotlight"],
      profileLayout: ["full", "compact"],
      miniAlign: ["left", "center"],
    }))
      if (allowed.includes(input[k])) v[k] = input[k];
    for (const k of [
      "accent",
      "secondary",
      "backgroundColor",
      "cursorColor",
      "frameAccent",
      "frameSecondary",
    ])
      if (/^#[0-9a-f]{6}$/i.test(input[k] || "")) v[k] = input[k];
    for (const [k, min, max] of [
      ["frameSpeed", 3, 48],
      ["framePlaybackRate", 0.25, 2],
      ["frameColorStrength", 0, 100],
      ["dim", 0, 95],
      ["blur", 0, 32],
      ["backgroundX", 0, 100],
      ["backgroundY", 0, 100],
      ["backgroundZoom", 100, 180],
      ["frameWidth", 1, 8],
      ["frameGlow", 0, 100],
      ["frameIntensity", 15, 100],
      ["frameScale", 85, 125],
      ["fontSize", 12, 20],
      ["letterSpacing", -0.5, 2],
      ["surfaceOpacity", 0, 100],
      ["cardRadius", 0, 28],
      ["cursorSize", 12, 48],
      ["density", 0, 100],
      ["effectSpeed", 0.25, 2],
      ["cursorThickness", 1, 4],
      ["cursorGlow", 0, 100],
      ["crosshairGap", 0, 14],
      ["crosshairArms", 2, 16],
      ["trailLength", 60, 350],
      ["trailWidth", 1, 6],
      ["projectColumns", 1, 3],
    ])
      if (Number.isFinite(input[k]) && input[k] >= min && input[k] <= max)
        v[k] = input[k];
    v.customBackground = images(input.customBackground);
    v.customAvatar = images(input.customAvatar);
    v.customFrame = images(input.customFrame).startsWith("data:image/png;")
      ? images(input.customFrame)
      : "";
    v.miniAvatar = images(input.miniAvatar);
    v.cursorImage = images(input.cursorImage);
    v.customFont = validFont(input.customFont);
    v.fontName = text(input.fontName, 80).replace(/[\\/]/g, "");
    for (const [k, max] of [
      ["displayName", 60],
      ["bio", 280],
      ["headline", 180],
      ["about", 6000],
      ["miniNote", 140],
      ["projectsTitle", 60],
    ])
      v[k] = text(input[k], max);
    if (!Object.hasOwn(input, "projectsTitle"))
      v.projectsTitle = defaults.projectsTitle;
    v.projects = projects(input.projects);
    v.miniLinks = links(input.miniLinks);
    v.projectColumns = Math.round(v.projectColumns);
    Object.assign(v, leafMix(input));
    return v;
  }
  function loginFor(value) {
    const name =
      typeof value === "string"
        ? value.trim().replace(/^@/, "").toLowerCase()
        : "";
    return /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/.test(name) ? name : null;
  }
  function overrides(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return {};
    const valid = normalize(input);
    const fields = Object.fromEntries(
      appearanceKeys
        .filter((k) => Object.hasOwn(input, k))
        .map((k) => [k, valid[k]]),
    );
    if (leafKeys.some((k) => Object.hasOwn(input, k)))
      for (const k of leafKeys) fields[k] = valid[k];
    return fields;
  }
  function normalizeState(input = {}, motion = true) {
    const entries =
      input.profiles &&
      typeof input.profiles === "object" &&
      !Array.isArray(input.profiles)
        ? Object.entries(input.profiles)
        : [];
    const base = normalize(input, motion);
    for (const k of personalKeys) base[k] = defaults[k];
    return {
      ...base,
      profiles: Object.fromEntries(
        entries
          .filter(([n]) => loginFor(n) === n)
          .slice(0, 50)
          .map(([n, v]) => [n, overrides(v)]),
      ),
    };
  }
  function effective(input, login, motion = true) {
    const state = normalizeState(input, motion),
      name = loginFor(login);
    return normalize(
      {
        ...state,
        ...(name && Object.hasOwn(state.profiles, name)
          ? state.profiles[name]
          : {}),
      },
      motion,
    );
  }
  function appearanceChanges(input, login, patch) {
    const state = normalizeState(input),
      changes = overrides(patch);
    if (!login) {
      if (
        personalKeys.some((k) =>
          Array.isArray(changes[k]) ? changes[k].length : changes[k],
        )
      )
        throw Error(
          "Аватар и текст сохраняются для конкретного GitHub-профиля.",
        );
      return changes;
    }
    const name = loginFor(login);
    if (!name) throw Error("Введи корректный ник GitHub.");
    if (
      !Object.hasOwn(state.profiles, name) &&
      Object.keys(state.profiles).length >= 50
    )
      throw Error("Достигнут лимит 50 профилей.");
    return {
      profiles: {
        ...state.profiles,
        [name]: {
          ...(Object.hasOwn(state.profiles, name) ? state.profiles[name] : {}),
          ...changes,
        },
      },
    };
  }
  function serializeTheme(
    preferences,
    { name = "Моя тема", includePersonal = false } = {},
  ) {
    const v = normalize(preferences);
    if (v.background !== "custom") v.customBackground = "";
    if (v.font !== "custom") {
      v.customFont = "";
      v.fontName = "";
    }
    if (v.cursor !== "custom") v.cursorImage = "";
    if (!includePersonal) v.useCustomProjects = false;
    return JSON.stringify(
      {
        format: "winter-profile-theme",
        version: 3,
        name: text(name, 80),
        appearance: Object.fromEntries(
          appearanceKeys
            .filter((k) => includePersonal || !personalKeys.includes(k))
            .map((k) => [k, v[k]]),
        ),
      },
      null,
      2,
    );
  }
  function parseTheme(source) {
    if (typeof source !== "string" || source.length > 8000000)
      throw Error("Файл темы слишком большой.");
    let theme;
    try {
      theme = JSON.parse(source);
    } catch {
      throw Error("Не удалось прочитать JSON-файл темы.");
    }
    if (
      !theme ||
      theme.format !== "winter-profile-theme" ||
      ![1, 2, 3].includes(theme.version) ||
      Object.keys(theme).some(
        (k) => !["format", "version", "name", "appearance"].includes(k),
      )
    )
      throw Error("Неподдерживаемый формат темы.");
    if (
      theme.name != null &&
      (typeof theme.name !== "string" || theme.name.length > 80)
    )
      throw Error("Некорректное название темы.");
    const a = theme.appearance;
    if (
      !a ||
      typeof a !== "object" ||
      Array.isArray(a) ||
      Object.keys(a).some((k) => !appearanceKeys.includes(k))
    )
      throw Error("Тема содержит неподдерживаемые настройки.");
    const v = normalize(a);
    if (
      Object.keys(a).some((k) => !same(a[k], v[k])) ||
      (v.background === "custom" && !v.customBackground) ||
      (v.font === "custom" && !v.customFont) ||
      (v.cursor === "custom" && !v.cursorImage)
    )
      throw Error("В теме указаны некорректные значения.");
    return { name: theme.name || "Winter Profile", appearance: overrides(a) };
  }
  const api = {
    keys,
    appearanceKeys,
    personalKeys,
    storageKeys,
    fonts,
    bundledFonts,
    defaults,
    normalize,
    normalizeState,
    loginFor,
    effective,
    appearanceChanges,
    serializeTheme,
    parseTheme,
    validFont,
    same,
    safeURL,
    leafKeys,
    leafMix,
    leafPatch,
  };
  root.PCWinterOptions = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
