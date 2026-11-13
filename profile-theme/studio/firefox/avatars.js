(function (root) {
  "use strict";
  let placeholder = "";
  function fallback() {
    if (placeholder) return placeholder;
    const c = document.createElement("canvas");
    c.width = c.height = 460;
    const g = c.getContext("2d");
    g.fillStyle = "#e8e8e8";
    g.fillRect(0, 0, 460, 460);
    g.fillStyle = "#ababab";
    g.beginPath();
    g.arc(230, 178, 64, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(230, 371, 136, 115, 0, Math.PI, Math.PI * 2);
    g.fill();
    placeholder = c.toDataURL("image/png");
    return placeholder;
  }
  function set(image, source, backup = fallback()) {
    image.alt = "";
    image.setAttribute("aria-label", "Аватар профиля");
    image.decoding = "async";
    if (!image.dataset.psAvatarBound) {
      image.dataset.psAvatarBound = "true";
      image.addEventListener("error", () => {
        if (image.src !== image.dataset.psAvatarFallback)
          image.src = image.dataset.psAvatarFallback || fallback();
      });
    }
    image.dataset.psAvatarFallback = backup || fallback();
    const value = source || backup || fallback();
    if (image.getAttribute("src") !== value) image.src = value;
  }
  root.PCStudioAvatars = { fallback, set };
})(globalThis);
