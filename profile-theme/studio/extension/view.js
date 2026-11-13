(function (root) {
  "use strict";
  function createView({ document: doc, onOpen, onRemix, onGallery }) {
    const host = doc.createElement("div");
    host.id = "pc-theme-root";
    const shadow = host.attachShadow({ mode: "open" }),
      style = doc.createElement("style");
    style.textContent =
      ":host{display:block;margin:14px 0 20px;font:11px system-ui;position:relative;z-index:2}.bar{display:flex;align-items:center;gap:10px;border:1px solid #ffffff17;background:rgba(var(--ps-surface-rgb,18,18,20),.92);border-radius:9px;padding:9px 12px;color:var(--ps-muted,#999)}.brand{width:24px;height:24px;flex-shrink:0}button{font:inherit;color:var(--ps-text,#ddd);background:none;border:0;padding:4px 6px;cursor:pointer;border-radius:4px}button:hover{background:#ffffff0c}button:focus-visible{outline:2px solid #a8c8e5}.label{flex:1}[hidden]{display:none}";
    const bar = doc.createElement("div");
    bar.className = "bar";
    const dot = doc.createElement("img");
    dot.className = "brand";
    dot.src = root.PCStudioBrand.source;
    dot.alt = "";
    dot.width = dot.height = 24;
    const label = doc.createElement("span");
    label.className = "label";
    const open = doc.createElement("button");
    open.type = "button";
    open.textContent = "Редактор ↗";
    open.addEventListener("click", onOpen);
    const remix = doc.createElement("button");
    remix.type = "button";
    remix.textContent = "Ремикс ↗";
    remix.addEventListener("click", onRemix);
    const gallery = doc.createElement("button");
    gallery.type = "button";
    gallery.textContent = "Темы ↗";
    gallery.addEventListener("click", onGallery);
    bar.append(dot, label, open, remix, gallery);
    shadow.append(style, bar);
    return {
      element: host,
      update({ source, allowRemix }) {
        label.textContent =
          source === "published"
            ? "Тема владельца · Profile Studio"
            : "Твоя локальная тема · Profile Studio";
        remix.hidden = source !== "published" || !allowRemix;
      },
      destroy() {
        host.remove();
      },
    };
  }
  root.PCWinterView = { createView };
})(globalThis);
