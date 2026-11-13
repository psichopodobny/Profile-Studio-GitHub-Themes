(function (root) {
  "use strict";
  function create({
    target,
    asset = (p) => p,
    fixed = false,
    viewport = null,
  }) {
    const doc = target.ownerDocument,
      win = doc.defaultView,
      ns = "http://www.w3.org/2000/svg";
    const layer = doc.createElement("div");
    layer.className = "ps-scene" + (fixed ? " ps-scene-fixed" : "");
    layer.setAttribute("aria-hidden", "true");
    const image = doc.createElement("img");
    image.alt = "";
    image.className = "ps-scene-image";
    image.draggable = false;
    image.decoding = "async";
    if (viewport) layer.classList.add("ps-scene-viewport");
    const shade = doc.createElement("div");
    shade.className = "ps-scene-shade";
    const canvas = doc.createElement("canvas");
    canvas.className = "ps-particles";
    layer.append(image, shade, canvas);
    target.prepend(layer);
    const cursor = PCStudioCursor.create(target);
    const svg = (tag) => doc.createElementNS(ns, tag),
      trail = svg("svg"),
      defs = svg("defs"),
      gradient = svg("linearGradient"),
      path = svg("path"),
      glow = svg("path");
    const gradientId = "ps-trail-" + Math.random().toString(36).slice(2);
    gradient.id = gradientId;
    gradient.setAttribute("gradientUnits", "userSpaceOnUse");
    for (const [offset, opacity] of [
      ["0", "0"],
      [".45", ".25"],
      ["1", ".65"],
    ]) {
      const stop = svg("stop");
      stop.setAttribute("offset", offset);
      stop.setAttribute("stop-opacity", opacity);
      gradient.append(stop);
    }
    defs.append(gradient);
    trail.append(defs, glow, path);
    trail.classList.add("ps-cursor-trail");
    trail.setAttribute("aria-hidden", "true");
    trail.setAttribute("hidden", "");
    for (const n of [glow, path]) {
      n.setAttribute("fill", "none");
      n.setAttribute("stroke", `url(#${gradientId})`);
      n.setAttribute("stroke-linecap", "round");
      n.setAttribute("stroke-linejoin", "round");
    }
    glow.setAttribute("opacity", ".14");
    doc.body.append(trail);
    const weather = PCStudioWeather.create({ document: doc });
    const ctx = canvas.getContext("2d"),
      reduce = win.matchMedia("(prefers-reduced-motion: reduce)");
    let prefs = null,
      raf = 0,
      last = 0,
      w = 0,
      h = 0,
      pixelRatio = 0,
      points = [],
      samples = [],
      inside = false,
      px = 0,
      py = 0,
      tx = 0,
      ty = 0,
      dead = false,
      visible = true,
      source = "",
      seed = 1327;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const active = () =>
      prefs?.motion && !reduce.matches && !doc.hidden && visible;
    const observer = new win.IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting !== false;
      restart();
    });
    observer.observe(target);
    function resize() {
      const r = target.getBoundingClientRect(),
        nw = Math.max(1, r.width),
        nh = Math.max(
          1,
          viewport ? viewport.clientHeight : fixed ? win.innerHeight : r.height,
        ),
        dpr = Math.min(
          win.devicePixelRatio || 1,
          2,
          Math.sqrt(6000000 / (nw * nh)),
        );
      if (nw === w && nh === h && dpr === pixelRatio) return;
      w = nw;
      h = nh;
      pixelRatio = dpr;
      if (viewport) {
        layer.style.height = nh + "px";
        layer.style.marginBottom = -nh + "px";
        layer.style.width = nw + "px";
        layer.style.marginInlineStart =
          -parseFloat(win.getComputedStyle(target).paddingLeft || 0) + "px";
      }
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      weather.resize(w, h);
    }
    const size = new win.ResizeObserver(resize);
    size.observe(target);
    if (viewport) size.observe(viewport);
    win.addEventListener("resize", resize, { passive: true });
    function particles() {
      seed = 1327;
      points = Array.from(
        { length: Math.round((prefs?.density || 0) * 1.35) },
        () => ({
          x: rand(),
          y: rand(),
          z: 0.25 + rand() * 0.75,
          p: rand() * 6.283,
          r: 0.5 + rand() * 1.5,
        }),
      );
    }
    function draw(dt, time) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      if (!prefs.snow || prefs.particles === "none") return;
      if (["rain", "leaves", "snow", "embers"].includes(prefs.particles)) {
        weather.draw(ctx, dt, time);
        ctx.globalAlpha = 1;
        return;
      }
      const kind = prefs.particles;
      ctx.fillStyle =
        kind === "embers"
          ? "#ffba7f"
          : prefs.colorMode === "light"
            ? "#545965"
            : prefs.secondary;
      for (const p of points) {
        const speed = prefs.effectSpeed * p.z;
        p.x = (p.x + dt * 0.004 * speed + 1) % 1;
        p.y =
          (p.y +
            dt *
              (kind === "embers" ? -0.024 : kind === "stars" ? 0 : 0.026) *
              speed +
            1) %
          1;
        const x = p.x * w + Math.sin(time * 0.25 + p.p) * 3,
          y = p.y * h;
        ctx.globalAlpha =
          kind === "stars"
            ? 0.2 + Math.sin(time * 0.65 + p.p) ** 2 * 0.55
            : 0.15 + p.z * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, kind === "stars" ? p.r * 0.65 : p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    function clearTrail() {
      samples = [];
      trail.setAttribute("hidden", "");
      path.removeAttribute("d");
      glow.removeAttribute("d");
    }
    function drawTrail(now) {
      samples = samples.filter((p) => now - p.t < prefs.trailLength);
      if (samples.length < 2) {
        trail.setAttribute("hidden", "");
        return;
      }
      const first = samples[0],
        end = samples.at(-1);
      let d = `M${first.x},${first.y}`;
      for (let i = 1; i < samples.length; i++) {
        const a = samples[i - 1],
          b = samples[i];
        d += ` Q${a.x},${a.y} ${(a.x + b.x) / 2},${(a.y + b.y) / 2}`;
      }
      d += ` L${end.x},${end.y}`;
      for (const n of [path, glow]) n.setAttribute("d", d);
      gradient.setAttribute("x1", first.x);
      gradient.setAttribute("y1", first.y);
      gradient.setAttribute("x2", end.x + 0.01);
      gradient.setAttribute("y2", end.y + 0.01);
      trail.style.opacity = String(
        Math.max(0, 1 - (now - end.t) / prefs.trailLength),
      );
      trail.removeAttribute("hidden");
    }
    function paintTransform() {
      const moving = active() && prefs.parallax;
      image.style.transform = `translate3d(${moving ? px : 0}px,${moving ? py : 0}px,0) scale(${((prefs?.backgroundZoom || 100) / 100) * 1.045})`;
    }
    function tick(now) {
      raf = 0;
      if (dead) return;
      if (!active()) {
        restart();
        return;
      }
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      if (prefs.parallax) {
        px += (tx - px) * (1 - Math.exp(-dt * 8));
        py += (ty - py) * (1 - Math.exp(-dt * 8));
        if (Math.abs(tx - px) < 0.01) px = tx;
        if (Math.abs(ty - py) < 0.01) py = ty;
        paintTransform();
      }
      if (prefs.snow && prefs.particles !== "none") draw(dt, now / 1000);
      if (prefs.cursorTrail) drawTrail(now);
      if (
        (prefs.snow && prefs.particles !== "none") ||
        samples.length ||
        (prefs.parallax && (px !== tx || py !== ty))
      )
        raf = win.requestAnimationFrame(tick);
    }
    function restart() {
      if (prefs)
        target.dataset.psMotion = String(prefs.motion && !reduce.matches);
      if (prefs && (!prefs.snow || prefs.particles === "none"))
        ctx?.clearRect(0, 0, w, h);
      if (!active()) {
        if (raf) win.cancelAnimationFrame(raf);
        raf = last = 0;
        ctx?.clearRect(0, 0, w, h);
        clearTrail();
        paintTransform();
        return;
      }
      if (!raf) {
        last = 0;
        raf = win.requestAnimationFrame(tick);
      }
    }
    function move(e) {
      if (e.pointerType === "touch" || !prefs) return;
      inside = true;
      const events = e.getCoalescedEvents?.() || [],
        list = events.length ? events : [e],
        r = (viewport || target).getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * -12;
      ty = ((e.clientY - r.top) / r.height - 0.5) * -9;
      if (prefs.cursorTrail && prefs.cursor !== "system" && active()) {
        for (const event of list) {
          const last = samples.at(-1);
          if (
            !last ||
            Math.hypot(event.clientX - last.x, event.clientY - last.y) > 1
          )
            samples.push({
              x: Math.round(event.clientX * 10) / 10,
              y: Math.round(event.clientY * 10) / 10,
              t: win.performance.now(),
            });
        }
        if (samples.length > 80) samples = samples.slice(-80);
      }
      if (!raf) restart();
    }
    function leave() {
      inside = false;
      tx = ty = 0;
      clearTrail();
      if (!raf) restart();
    }
    const pointerEvent =
      "onpointerrawupdate" in win ? "pointerrawupdate" : "pointermove";
    target.addEventListener(pointerEvent, move, { passive: true });
    target.addEventListener("pointerleave", leave);
    doc.addEventListener("visibilitychange", restart);
    reduce.addEventListener("change", restart);
    function update(next) {
      const previous = prefs;
      prefs = next;
      target.dataset.psCursor = next.cursor;
      target.dataset.psMode = next.colorMode;
      target.dataset.psMotion = String(next.motion && !reduce.matches);
      cursor.update(next);
      weather.configure(next);
      const light = next.colorMode === "light",
        values = {
          "--ps-accent": next.accent,
          "--ps-secondary": next.secondary,
          "--ps-profile-font": root.PCWinterOptions.fonts[next.font],
          "--ps-profile-size": next.fontSize + "px",
          "--ps-letter-spacing": next.letterSpacing + "px",
          "--ps-card-radius": next.cardRadius + "px",
          "--ps-surface-alpha": next.surfaceOpacity / 100,
          "--ps-frame-speed": next.frameSpeed + "s",
          "--ps-frame-width": next.frameWidth + "px",
          "--ps-frame-glow": next.frameGlow * 0.16 + "px",
          "--ps-text": light ? "#242426" : "#e7e7e9",
          "--ps-muted": light ? "#737376" : "#909094",
          "--ps-surface-rgb": light ? "255,255,255" : "18,18,20",
          "--ps-edge": light ? "#1717191a" : "#ffffff18",
        };
      for (const [k, v] of Object.entries(values))
        target.style.setProperty(k, String(v));
      const bg = PCStudioBackgrounds.describe(next, asset);
      layer.style.background = bg.fill;
      image.hidden = !bg.source;
      if (bg.source && source !== bg.source) {
        source = bg.source;
        image.src = bg.source;
      }
      image.style.objectPosition = bg.position;
      image.style.filter = bg.filter;
      if (!next.parallax) px = py = tx = ty = 0;
      paintTransform();
      shade.style.background = bg.shade;
      gradient
        .querySelectorAll("stop")
        .forEach((n) => n.setAttribute("stop-color", next.cursorColor));
      path.setAttribute("stroke-width", next.trailWidth);
      glow.setAttribute("stroke-width", next.trailWidth + 3);
      if (!next.cursorTrail || next.cursor === "system") clearTrail();
      if (
        !previous ||
        previous.density !== next.density ||
        previous.particles !== next.particles
      )
        particles();
      resize();
      restart();
    }
    resize();
    return {
      update,
      destroy() {
        dead = true;
        if (raf) win.cancelAnimationFrame(raf);
        observer.disconnect();
        size.disconnect();
        if (raf) win.cancelAnimationFrame(raf);
        win.removeEventListener("resize", resize);
        target.removeEventListener(pointerEvent, move);
        target.removeEventListener("pointerleave", leave);
        doc.removeEventListener("visibilitychange", restart);
        reduce.removeEventListener("change", restart);
        cursor.destroy();
        weather.destroy();
        layer.remove();
        trail.remove();
        delete target.dataset.psCursor;
        delete target.dataset.psMotion;
        delete target.dataset.psMode;
        for (const k of [...target.style])
          if (k.startsWith("--ps-")) target.style.removeProperty(k);
      },
    };
  }
  root.PCStudioScene = { create };
})(globalThis);
