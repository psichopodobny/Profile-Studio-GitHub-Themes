(function (root) {
  "use strict";
  const keys = [
    "avatarShape",
    "frameOriginalColors",
    "frameAccent",
    "frameSecondary",
    "frameUseThemeColors",
    "framePlaybackRate",
    "frameSpeed",
    "frameWidth",
    "frameGlow",
    "frameScale",
    "frameIntensity",
    "frameColorStrength",
    "frameColorCycle",
    "motion",
  ];
  function reset(item) {
    return {
      avatarShape: item?.shape || "square",
      frameOriginalColors: item?.source === "steam",
      frameUseThemeColors: false,
      frameAccent: item?.accent || "#b9d8ef",
      frameSecondary: item?.secondary || "#ffffff",
      framePlaybackRate: 1,
      frameSpeed: 12,
      frameWidth: 2,
      frameGlow: 0,
      frameScale: 100,
      frameIntensity: 100,
      frameColorStrength: 100,
      frameColorCycle: false,
      motion: true,
    };
  }
  function pick(input) {
    const result = {};
    if (input && typeof input === "object" && !Array.isArray(input))
      for (const key of keys)
        if (Object.hasOwn(input, key)) result[key] = input[key];
    return result;
  }
  function parse(text) {
    if (typeof text !== "string" || text.length > 3000) return {};
    try {
      return pick(JSON.parse(text));
    } catch {
      return {};
    }
  }
  function link(id, prefs) {
    return (
      "studio.html?frame=" +
      encodeURIComponent(id) +
      "&frameSettings=" +
      encodeURIComponent(JSON.stringify(pick(prefs)))
    );
  }
  root.PCStudioFrameSettings = { keys, reset, pick, parse, link };
})(globalThis);
