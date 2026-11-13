(function (root) {
  "use strict";
  const clean = (v, max = 200) =>
    typeof v === "string"
      ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").slice(0, max)
      : "";
  const safeURL = (v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" &&
        !u.username &&
        !u.password &&
        v.length <= 500
        ? u.href
        : "";
    } catch {
      return "";
    }
  };
  const escape = (v) =>
    String(v).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const md = (v) =>
    escape(v)
      .replace(/([\\`*_[\]#|])/g, "\\$1")
      .replace(/\r?\n/g, " ");
  const defaults = {
    login: "",
    title: "Ваш ник",
    subtitle: "Software developer",
    about: "Расскажите, что вы разрабатываете.",
    accent: "#d8dce5",
    base: "#111318",
    style: "minimal",
    banner: "generated",
    bannerURL: "",
    bannerData: "",
    bannerType: "png",
    stack: "C#, C++, Rust, Python",
    projects: [],
    links: [],
  };
  function normalize(input = {}) {
    return {
      ...defaults,
      login: root.PCWinterOptions.loginFor(input.login) || "",
      title: clean(input.title, 70) || defaults.title,
      subtitle: clean(input.subtitle, 130),
      about: clean(input.about, 2500),
      accent: /^#[\da-f]{6}$/i.test(input.accent)
        ? input.accent
        : defaults.accent,
      base: /^#[\da-f]{6}$/i.test(input.base) ? input.base : defaults.base,
      style: ["minimal", "terminal", "editorial"].includes(input.style)
        ? input.style
        : "minimal",
      banner: ["none", "generated", "url", "upload"].includes(input.banner)
        ? input.banner
        : "generated",
      bannerURL: safeURL(input.bannerURL),
      bannerData:
        typeof input.bannerData === "string" &&
        input.bannerData.length <= 8200000 &&
        /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(
          input.bannerData,
        )
          ? input.bannerData
          : "",
      bannerType: ["png", "jpg", "webp", "gif"].includes(input.bannerType)
        ? input.bannerType
        : "png",
      stack: clean(input.stack, 240),
      projects: Array.isArray(input.projects)
        ? input.projects.slice(0, 8).map((p) => ({
            title: clean(p.title, 60),
            description: clean(p.description, 240),
            url: safeURL(p.url),
          }))
        : [],
      links: Array.isArray(input.links)
        ? input.links
            .slice(0, 5)
            .map((p) => ({ label: clean(p.label, 40), url: safeURL(p.url) }))
            .filter((p) => p.label && p.url)
        : [],
    };
  }
  function bannerSVG(input) {
    const p = normalize(input),
      title = escape(p.title),
      subtitle = escape(p.subtitle),
      login = escape(p.login || "GITHUB PROFILE");
    const terminal = p.style === "terminal",
      editorial = p.style === "editorial";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="320" viewBox="0 0 1200 320"><defs><linearGradient id="wash" x2="1" y2="1"><stop stop-color="${p.base}"/><stop offset="1" stop-color="${p.accent}" stop-opacity=".24"/></linearGradient><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${p.accent}" stroke-opacity=".065"/></pattern></defs><rect width="1200" height="320" rx="12" fill="${p.base}"/><rect width="1200" height="320" rx="12" fill="url(#wash)"/><rect width="1200" height="320" rx="12" fill="url(#grid)"/><path d="M${editorial ? "64 55V265" : "64 244H1136"}" stroke="${p.accent}" opacity=".4"/><text x="${editorial ? 98 : 64}" y="79" fill="${p.accent}" font-family="monospace" font-size="11" letter-spacing="3">${terminal ? "$ WHOAMI" : login.toUpperCase()}</text><text x="${editorial ? 98 : 64}" y="164" fill="#f4f5f8" font-family="${terminal ? "monospace" : editorial ? "Georgia,serif" : "Arial,sans-serif"}" font-size="${Math.min(56, Math.max(18, Math.floor(850 / Math.max(1, p.title.length) / 0.62)))}" font-weight="${editorial ? 400 : 600}" letter-spacing="-1">${terminal ? "&gt; " : ""}${title}</text><text x="${editorial ? 98 : 64}" y="208" fill="${p.accent}" font-family="Arial,sans-serif" font-size="17">${subtitle}</text><g transform="translate(1015 135)" stroke="${p.accent}" fill="none" opacity=".42"><path d="M-26-40-66 0-26 40M26-40 66 0 26 40M13-51-13 51" stroke-width="2"/></g><text x="1136" y="282" text-anchor="end" fill="${p.accent}" opacity=".55" font-family="monospace" font-size="9" letter-spacing="2">${p.style.toUpperCase()} / PROFILE STUDIO</text></svg>`;
  }
  function bannerPath(p) {
    return p.banner === "generated"
      ? "./profile-studio/banner.svg"
      : p.banner === "upload" && p.bannerData
        ? "./profile-studio/banner." + p.bannerType
        : p.banner === "url"
          ? p.bannerURL
          : "";
  }
  function markdown(input) {
    const p = normalize(input),
      banner = bannerPath(p),
      lines = [];
    if (banner)
      lines.push(
        `<p align="center"><img src="${escape(banner)}" width="100%" alt="${escape(p.title)}"></p>`,
        "",
      );
    else lines.push("# " + md(p.title), "", md(p.subtitle), "");
    const badges = p.stack
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 12);
    if (badges.length)
      lines.push(
        '<p align="center">',
        badges
          .map(
            (x) =>
              `  <img src="https://img.shields.io/badge/${encodeURIComponent(x.replace(/-/g, "--").replace(/_/g, "__"))}-${p.accent.slice(1)}?style=flat-square&amp;labelColor=${p.base.slice(1)}" alt="${escape(x)}">`,
          )
          .join("\n"),
        "</p>",
        "",
      );
    if (p.about.trim())
      lines.push(
        ...p.about
          .trim()
          .split(/\n\s*\n/)
          .flatMap((x) => [x.split("\n").map(md).join("  \n"), ""]),
      );
    if (p.projects.length) {
      lines.push("## Проекты", "", "| Проект | Описание |", "| :--- | :--- |");
      p.projects.forEach((x) =>
        lines.push(
          "| " +
            (x.url
              ? "[" +
                md(x.title) +
                "](" +
                x.url.replace(/[()]/g, (c) => encodeURIComponent(c)) +
                ")"
              : "**" + md(x.title) + "**") +
            " | " +
            md(x.description) +
            " |",
        ),
      );
      lines.push("");
    }
    if (p.links.length)
      lines.push(
        p.links
          .map(
            (x) =>
              "[" +
              md(x.label) +
              "](" +
              x.url.replace(/[()]/g, (c) => encodeURIComponent(c)) +
              ")",
          )
          .join(" · "),
        "",
      );
    return lines.join("\n").trim() + "\n";
  }
  const api = { defaults, normalize, bannerSVG, markdown, bannerPath, safeURL };
  root.PCStudioReadmeCore = api;
  if (typeof module !== "undefined") module.exports = api;
})(globalThis);
