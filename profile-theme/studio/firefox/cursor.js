(function (root) {
  "use strict";
  function create(target) {
    const doc = target.ownerDocument;
    let key = "",
      generation = 0,
      dead = false;
    function build(p, image) {
      const size = p.cursorSize,
        pad = p.cursor === "glow" ? 12 : 3,
        extent = Math.ceil(size + pad * 2),
        canvas = doc.createElement("canvas");
      canvas.width = canvas.height = extent;
      const c = canvas.getContext("2d"),
        center = extent / 2;
      c.translate(center, center);
      c.lineCap = "round";
      c.lineJoin = "round";
      c.strokeStyle = p.cursorColor;
      c.fillStyle = p.cursorColor;
      c.lineWidth = p.cursorThickness;
      if (p.cursor === "custom" && image)
        c.drawImage(image, -size / 2, -size / 2, size, size);
      else if (p.cursor === "dot") {
        c.beginPath();
        c.arc(0, 0, Math.max(2, size * 0.135), 0, Math.PI * 2);
        c.fill();
      } else if (p.cursor === "crosshair") {
        const gap = Math.min(p.crosshairGap, size / 2 - 2),
          arm = Math.min(p.crosshairArms, size / 2 - gap);
        const path = () => {
          c.beginPath();
          c.moveTo(-gap - arm, 0);
          c.lineTo(-gap, 0);
          c.moveTo(gap, 0);
          c.lineTo(gap + arm, 0);
          c.moveTo(0, -gap - arm);
          c.lineTo(0, -gap);
          c.moveTo(0, gap);
          c.lineTo(0, gap + arm);
        };
        if (p.crosshairOutline) {
          c.strokeStyle = p.colorMode === "light" ? "#ffffffb0" : "#000000b0";
          c.lineWidth = p.cursorThickness + 2;
          path();
          c.stroke();
        }
        c.strokeStyle = p.cursorColor;
        c.lineWidth = p.cursorThickness;
        path();
        c.stroke();
        if (p.crosshairDot) {
          c.beginPath();
          c.arc(0, 0, Math.max(1, p.cursorThickness * 0.6), 0, Math.PI * 2);
          c.fill();
        }
      } else {
        if (p.cursor === "glow") {
          c.shadowColor = p.cursorColor;
          c.shadowBlur = 2 + p.cursorGlow * 0.08;
          c.globalAlpha = 0.6;
        }
        c.beginPath();
        c.arc(0, 0, size / 2 - 2, 0, Math.PI * 2);
        c.stroke();
        if (p.cursor === "glow") {
          c.shadowBlur = 0;
          c.globalAlpha = 0.12;
          c.fill();
        }
      }
      target.style.setProperty(
        "--ps-custom-cursor",
        `url("${canvas.toDataURL("image/png")}") ${Math.floor(center)} ${Math.floor(center)}, auto`,
      );
    }
    return {
      update(p) {
        const next = JSON.stringify([
          p.cursor,
          p.cursorSize,
          p.cursorColor,
          p.cursorThickness,
          p.cursorGlow,
          p.crosshairGap,
          p.crosshairArms,
          p.crosshairDot,
          p.crosshairOutline,
          p.colorMode,
          p.cursorImage,
        ]);
        if (next === key) return;
        key = next;
        const id = ++generation;
        if (p.cursor === "system") {
          target.style.removeProperty("--ps-custom-cursor");
          return;
        }
        if (p.cursor === "custom" && p.cursorImage) {
          const image = new Image();
          image.onload = () => {
            if (!dead && id === generation) build(p, image);
          };
          image.src = p.cursorImage;
        } else build(p);
      },
      destroy() {
        dead = true;
        ++generation;
        target.style.removeProperty("--ps-custom-cursor");
      },
    };
  }
  root.PCStudioCursor = { create };
})(globalThis);
