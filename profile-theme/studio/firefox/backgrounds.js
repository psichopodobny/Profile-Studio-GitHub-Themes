(function (root) {
  "use strict";
  const colors = {
    midnight: ["#263c65", "#0a101e"],
    neon: ["#694690", "#102a3d"],
    aurora: ["#27654d", "#293d7c"],
    uikole: ["#75465e", "#654a30"],
    ember: ["#7b442b", "#592c3e"],
    sunset: ["#9c543d", "#51375d"],
    coast: ["#236276", "#243d73"],
    autumn: ["#71452e", "#45442d"],
    rose: ["#6c3e57", "#40344f"],
    cosmos: ["#42376c", "#153a58"],
    graphite: ["#363a41", "#15171c"],
    coffee: ["#594536", "#2c2420"],
    lavender: ["#63547c", "#493c59"],
    terminal: ["#204132", "#172d2a"],
  };
  function describe(p, asset = (x) => x) {
    const c = colors[p.background] || [p.accent, p.secondary],
      file =
        p.background === "forest"
          ? "media/winter-forest-wide.webp"
          : p.background === "lake"
            ? "media/winter-lake.png"
            : "";
    return {
      source:
        p.background === "custom"
          ? p.customBackground
          : file
            ? root.PCStudioAssets?.source(file) || asset(file)
            : "",
      fill:
        p.background === "solid"
          ? p.backgroundColor
          : `radial-gradient(ellipse at 12% 10%,${c[0]},transparent 65%),radial-gradient(ellipse at 95% 85%,${c[1]},transparent 65%),#0b1018`,
      shade:
        p.colorMode === "light"
          ? `rgba(255,255,255,${p.dim / 100})`
          : `rgba(4,4,5,${p.dim / 100})`,
      position: `${p.backgroundX}% ${p.backgroundY}%`,
      filter: `blur(${p.blur}px)`,
      scale: (p.backgroundZoom / 100) * 1.045,
    };
  }
  function thumbnail(node, p) {
    const doc = node.ownerDocument,
      b = describe(p);
    node.style.background = b.fill;
    const old = node.querySelector(".theme-source");
    old?.remove();
    let shade = node.querySelector(".theme-shade");
    if (b.source) {
      const img = doc.createElement("img");
      img.className = "theme-source";
      img.alt = "";
      img.src = b.source;
      img.style.objectPosition = b.position;
      img.style.filter = b.filter;
      img.style.transform = `scale(${b.scale})`;
      node.append(img);
    }
    if (!shade) {
      shade = doc.createElement("span");
      shade.className = "theme-shade";
      node.append(shade);
    } else node.append(shade);
    shade.style.background = b.shade;
    node.dataset.background = p.background;
  }
  root.PCStudioBackgrounds = { describe, thumbnail };
})(globalThis);
