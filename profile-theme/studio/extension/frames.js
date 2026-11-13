(function (root) {
  "use strict";
  const ns = "http://www.w3.org/2000/svg";
  let counter = 0;
  const hostKeys = new WeakMap();
  const catalog = [
    [
      "shadowfire",
      "Shadow Flame",
      "#7043c9",
      "#120b22",
      "Слоистое тёмное пламя",
    ],
    ["ghost", "Ghostlight", "#f3f4ff", "#a5cae4", "Жидкий контур и призраки"],
    ["pixelfire", "Pixel Flame", "#ff7939", "#ffe86b", "Пиксельное пламя"],
    ["ink", "Inkfall", "#18191e", "#626977", "Чернила и стекающие капли"],
    ["smoke", "Smoke Veil", "#9aa8b4", "#e4edf3", "Мягкие клубы дыма"],
    ["plasma", "Black Mist", "#48d9be", "#b8fff0", "Туман и вспышки энергии"],
    ["slime", "Ooze", "#a9f522", "#efff87", "Живой вязкий контур"],
    ["sakura", "Sakura", "#f29bce", "#ffe6f3", "Ветки, цветы и лепестки"],
    ["cat", "Cat Cloud", "#f5f0ff", "#ed9fcd", "Ушки, лапки и мягкий свет"],
    ["roses", "Moon Garden", "#be9be6", "#f3e6ff", "Розы и подвески"],
    ["hearts", "Full Hearts", "#f45772", "#ffb3b2", "Пять живых сердец"],
    ["technoir", "Tech Noir", "#8e9db0", "#e5edf7", "Сегменты и бегущий свет"],
    ["thorn", "Briar", "#32353d", "#a2a9b4", "Переплетение тёмных ветвей"],
    ["crt", "Soft CRT", "#21242b", "#9daeb8", "Стекло и сканирование"],
    [
      "projector",
      "Dot Matrix",
      "#46d876",
      "#c6ffc0",
      "Матрица и световой импульс",
    ],
    [
      "frost",
      "Frost",
      "#b9d8ef",
      "#f4fbff",
      "Ледяные грани и серебряные блики",
    ],
    ["aurora", "Aurora", "#7de5c1", "#9caaff", "Две встречные ленты света"],
    ["ember", "Ember", "#ff9a52", "#ffd985", "Тлеющий контур и искры"],
    ["prism", "Prism", "#c5a3ff", "#88e7ed", "Огранённые кристаллы"],
    ["circuit", "Circuit", "#73d8bd", "#ceffee", "Дорожки и контактные узлы"],
    ["laurel", "Laurel", "#b0c59a", "#e6e9c4", "Лавровые ветви"],
    ["orbit", "Orbit", "#96baff", "#e4eeff", "Спутники на тонкой орбите"],
    ["neon", "Neon", "#f789da", "#9fb0ff", "Цельная неоновая трубка"],
    ["pulse", "Pulse", "#d5d0ff", "#f2eeff", "Мягкое дыхание света"],
    ["double", "Double", "#c1c9d4", "#f5f7fa", "Два тонких контура"],
    ["dashed", "Dash", "#b1bfd0", "#f5f7fa", "Лаконичный пунктир"],
  ].map(([id, name, accent, secondary, description]) => ({
    id,
    name,
    accent,
    secondary,
    description: description || "Световой контур",
  }));
  for (const item of root.PCStudioFrameCatalog || []) {
    let entry = catalog.find((x) => x.id === item.id);
    if (!entry) {
      entry = { id: item.id, accent: "#efb3d4", secondary: "#ffffff" };
      catalog.push(entry);
    }
    entry.name = item.name;
    entry.description = "Анимированная рамка Steam";
    entry.source = "steam";
    entry.shape = item.shape;
  }
  catalog.push(...(root.PCStudioFrameDesigns?.catalog || []));
  const decorative = new Set([
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
  ]);
  const documents = new WeakMap();
  function watch(svg, p) {
    const doc = svg.ownerDocument,
      win = doc.defaultView;
    let state = documents.get(doc);
    if (!state) {
      const media = win.matchMedia("(prefers-reduced-motion: reduce)"),
        nodes = new Set();
      const sync = (n) => {
        if (!n.isConnected) {
          n._frameCleanup?.();
          observer.unobserve(n);
          nodes.delete(n);
          return;
        }
        const paused =
          doc.hidden ||
          media.matches ||
          n.dataset.motion === "false" ||
          n.dataset.visible === "false";
        n.dataset.paused = String(paused);
        n._framePause?.(paused);
        if (paused) n.pauseAnimations?.();
        else n.unpauseAnimations?.();
      };
      const observer = new win.IntersectionObserver((entries) => {
        for (const e of entries) {
          e.target.dataset.visible = String(e.isIntersecting);
          sync(e.target);
        }
      });
      const refresh = () => nodes.forEach(sync);
      doc.addEventListener("visibilitychange", refresh);
      media.addEventListener("change", refresh);
      state = { nodes, observer, sync };
      documents.set(doc, state);
    }
    for (const n of state.nodes)
      if (!n.isConnected) {
        n._frameCleanup?.();
        state.observer.unobserve(n);
        state.nodes.delete(n);
      }
    svg.dataset.motion = String(p.motion);
    if (!state.nodes.has(svg)) {
      state.nodes.add(svg);
      state.observer.observe(svg);
    }
    state.sync(svg);
  }
  function rich({ svg, defs, id, el, path, basis, p, a, b }) {
    if (!decorative.has(p.frame)) return false;
    const speed = p.frameSpeed,
      paint = `url(#${id})`,
      type = p.frame;
    const add = (tag, attrs, parent = svg) => {
      const n = el(tag, attrs);
      parent.append(n);
      return n;
    };
    const animate = (n, attr, values, factor = 1, phase = 0) =>
      n.append(
        el("animate", {
          attributeName: attr,
          values,
          dur: speed * factor + "s",
          begin: -speed * phase + "s",
          repeatCount: "indefinite",
        }),
      );
    function point(u, extra = 0) {
      const t = u * Math.PI * 2 - Math.PI / 2,
        c = Math.cos(t),
        s = Math.sin(t),
        power =
          p.avatarShape === "circle"
            ? 1
            : p.avatarShape === "rounded"
              ? 0.45
              : 0.15;
      return [
        50 + Math.sign(c) * Math.abs(c) ** power * (51 + extra),
        50 + Math.sign(s) * Math.abs(s) ** power * (51 + extra),
        c,
        s,
      ];
    }
    function wave(phase, amplitude = 1.8) {
      const points = Array.from({ length: 64 }, (_, i) => {
        const u = i / 64,
          v =
            (Math.sin(u * 2 * Math.PI * 9 + phase) +
              0.35 * Math.cos(u * 2 * Math.PI * 17 - phase)) *
            amplitude;
        return point(u, v);
      });
      const mid = (a, b) =>
        [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
          .map((v) => v.toFixed(2))
          .join(",");
      let d = "M" + mid(points[63], points[0]);
      for (let i = 0; i < 64; i++)
        d +=
          "Q" +
          points[i]
            .slice(0, 2)
            .map((v) => v.toFixed(2))
            .join(",") +
          " " +
          mid(points[i], points[(i + 1) % 64]);
      return d + "Z";
    }
    function organic(
      stroke,
      width,
      amplitude = 1.6,
      opacity = 1,
      factor = 0.4,
    ) {
      const values = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3, 0].map((phase) =>
        wave(phase, amplitude),
      );
      const n = add("path", {
        d: values[0],
        fill: "none",
        stroke,
        "stroke-width": width,
        opacity,
        "stroke-linejoin": "round",
      });
      animate(n, "d", values.join(";"), factor);
      return n;
    }
    const glow = add(
      "filter",
      { id: id + "-soft", x: "-35%", y: "-35%", width: "170%", height: "170%" },
      defs,
    );
    add("feGaussianBlur", { stdDeviation: 1.3 }, glow);
    const move = (parent, u, extra = 0) => {
      const [x, y, c, s] = point(u, extra);
      return add(
        "g",
        {
          transform: `translate(${x} ${y}) rotate(${(Math.atan2(s, c) * 180) / Math.PI + 90})`,
        },
        parent,
      );
    };
    function flower(parent, x, y, size, rose = false) {
      const g = add(
        "g",
        { transform: `translate(${x} ${y}) scale(${size})` },
        parent,
      );
      for (let i = 0; i < (rose ? 9 : 5); i++) {
        const t = i * (rose ? 40 : 72);
        add(
          "ellipse",
          {
            cx: 0,
            cy: rose ? -1.5 : -2.1,
            rx: rose ? 2.4 : 1.6,
            ry: rose ? 2 : 2.4,
            fill: i % 2 ? a : b,
            stroke: a,
            "stroke-width": 0.25,
            transform: `rotate(${t})`,
          },
          g,
        );
      }
      add("circle", { r: rose ? 0.9 : 0.65, fill: rose ? b : "#f7d9a2" }, g);
      return g;
    }
    if (["shadowfire", "plasma", "slime", "ink", "ghost"].includes(type)) {
      const dark = type === "shadowfire" ? b : paint;
      if (type === "shadowfire" || type === "plasma") {
        const n = organic(a, 9, 2, 0.5);
        n.setAttribute("filter", `url(#${id}-soft)`);
        organic(dark, 5.7, 1.7, 1);
        organic(a, 1, 2.5, 0.9);
      } else if (type === "slime") {
        organic(a, 5.5, 1.7);
        organic(b, 1, 1.8, 0.8);
      } else if (type === "ink") {
        organic(a, 5, 1.3);
        organic(b, 0.65, 1.5, 0.7);
      } else {
        organic(b, 4.8, 1.6, 0.45);
        organic(a, 2.9, 1.6);
      }
      if (["shadowfire", "plasma"].includes(type))
        for (let i = 0; i < 30; i++) {
          const g = move(svg, i / 30),
            n = add(
              "path",
              {
                d: "M-2,0Q-3,-4 0,-8Q-1,-4 2,0Z",
                fill: i % 3 ? a : b,
                opacity: 0.75,
              },
              g,
            );
          animate(
            n,
            "d",
            "M-2,0Q-3,-3 0,-6Q-1,-3 2,0Z;M-2,0Q2,-4 1,-10Q4,-3 2,0Z;M-2,0Q-3,-3 0,-6Q-1,-3 2,0Z",
            0.22,
            i / 30,
          );
        }
      if (["slime", "ink"].includes(type))
        for (let i = 0; i < 7; i++) {
          const g = move(svg, 0.31 + i * 0.062),
            n = add(
              "path",
              { d: "M-1,0C-2,-3 2,-6 1,-8C3,-6 4,-1 1,1Z", fill: a },
              g,
            );
          animate(
            n,
            "d",
            "M-1,0C-2,-2 2,-4 1,-5C3,-3 4,-1 1,1Z;M-1,0C-2,-4 2,-9 1,-12C3,-7 4,-1 1,1Z;M-1,0C-2,-2 2,-4 1,-5C3,-3 4,-1 1,1Z",
            0.6,
            i / 7,
          );
        }
      if (type === "ghost")
        for (let i = 0; i < 2; i++) {
          const g = add("g", {});
          const n = add(
            "path",
            {
              d: "M-4,3C-5,-4 -1,-7 3,-4C8,-1 3,6 0,6L-1,4 -3,5Z",
              fill: a,
              stroke: b,
              "stroke-width": 0.4,
            },
            g,
          );
          add(
            "ellipse",
            { cx: -1.1, cy: -1, rx: 0.8, ry: 1.2, fill: "#262b40" },
            g,
          );
          add(
            "ellipse",
            { cx: 1.9, cy: -1, rx: 0.8, ry: 1.2, fill: "#262b40" },
            g,
          );
          g.append(
            el("animateMotion", {
              path: basis,
              dur: speed * 1.5 + "s",
              begin: -i * speed * 0.75 + "s",
              repeatCount: "indefinite",
              rotate: "auto",
            }),
          );
          animate(n, "opacity", ".7;1;.7", 0.3, i * 0.5);
        }
    } else if (type === "smoke") {
      const n = organic(a, 5.5, 2, 0.4, 0.8);
      n.setAttribute("filter", `url(#${id}-soft)`);
      organic(b, 0.8, 2, 0.55, 0.9);
      for (let i = 0; i < 14; i++) {
        const g = move(svg, i / 14, 1);
        const n = add(
          "path",
          {
            d: "M-5,1C-10,-4 5,-7 0,-12C-3,-14 -6,-11 -4,-9",
            fill: "none",
            stroke: i % 2 ? a : b,
            "stroke-width": 1.4,
            opacity: 0.45,
            filter: `url(#${id}-soft)`,
          },
          g,
        );
        animate(n, "opacity", ".1;.55;.1", 0.5, i / 14);
        animate(
          n,
          "transform",
          "translate(0 1) scale(.85);translate(2 -2) scale(1.15);translate(0 1) scale(.85)",
          0.5,
          i / 14,
        );
      }
    } else if (type === "pixelfire") {
      svg.append(path({ stroke: a, "stroke-width": 1.5 }));
      for (let i = 0; i < 44; i++) {
        const [x, y] = point(i / 44),
          g = add("g", {
            transform: `translate(${Math.round(x / 2) * 2} ${Math.round(y / 2) * 2})`,
          });
        const n = add(
          "path",
          {
            d: "M-2,2V-3H0V-6H2V-1H4V2Z",
            fill: i % 3 ? a : b,
            "shape-rendering": "crispEdges",
          },
          g,
        );
        animate(n, "opacity", ".45;1;.45", 0.16, i / 44);
        animate(
          n,
          "transform",
          "translate(0 0);translate(0 -2);translate(0 0)",
          0.2,
          i / 44,
        );
      }
    } else if (type === "cat") {
      svg.append(path({ "stroke-width": 3, stroke: a }));
      for (const side of [-1, 1]) {
        const g = add("g", {
          transform: `translate(${50 + side * 32} ${p.avatarShape === "circle" ? 7 : -1}) scale(${side} 1)`,
        });
        add(
          "path",
          {
            d: "M-10,6L-9,-18Q-8,-23 -5,-19L9,-4Z",
            fill: a,
            stroke: b,
            "stroke-width": 1.2,
          },
          g,
        );
        add("path", { d: "M-6,2L-6,-13 4,-4Z", fill: b }, g);
        animate(g, "opacity", ".8;1;.8", 0.7, side < 0 ? 0 : 0.3);
        const paw = add("g", { transform: `translate(${50 + side * 26} 99)` });
        add(
          "ellipse",
          { rx: 7, ry: 4.6, fill: a, stroke: b, "stroke-width": 0.8 },
          paw,
        );
        for (const x of [-3, 0, 3])
          add("ellipse", { cx: x, cy: -1, rx: 0.9, ry: 1.1, fill: b }, paw);
        add("ellipse", { cy: 1.5, rx: 2, ry: 1.3, fill: b }, paw);
      }
      for (const side of [-1, 1])
        for (let i = 0; i < 2; i++)
          add("path", {
            d: `M${50 + side * 48},${57 + i * 4}l${side * 11},${-2 + i * 3}`,
            stroke: a,
            "stroke-width": 0.7,
            "stroke-linecap": "round",
          });
    } else if (type === "sakura" || type === "roses") {
      svg.append(path({ "stroke-width": 1.2, opacity: 0.65 }));
      const branch = add("path", {
        d:
          type === "sakura"
            ? "M-2,22Q-5,0 22,-2Q38,4 47,0M67,104Q95,104 102,73"
            : "M-3,74Q5,104 43,103M62,-2Q96,-1 103,30",
        fill: "none",
        stroke: a,
        "stroke-width": 1.2,
      });
      for (const [x, y, size] of type === "sakura"
        ? [
            [1, 9, 1.1],
            [12, 1, 1.35],
            [25, 0, 0.8],
            [99, 86, 0.9],
            [94, 99, 1.2],
          ]
        : [
            [10, 91, 1.5],
            [22, 101, 1.4],
            [36, 102, 1],
            [88, 2, 1.1],
            [99, 12, 1.25],
          ])
        flower(svg, x, y, size, type === "roses");
      for (let i = 0; i < 9; i++) {
        const side = i % 2 ? -1 : 1,
          x = 50 + side * (45 + (i % 3) * 4),
          g = add("g", { transform: `translate(${x} ${5 + i * 10})` }),
          n = add(
            "path",
            {
              d: "M0,-2C-4,-4 -4,2 0,4C4,2 4,-4 0,-2Z",
              fill: i % 2 ? a : b,
              opacity: 0.75,
            },
            g,
          );
        animate(
          n,
          "transform",
          "translate(0 -4) rotate(-20);translate(3 5) rotate(25);translate(0 12) rotate(65)",
          0.65,
          i / 9,
        );
        animate(n, "opacity", "0;.85;0", 0.65, i / 9);
      }
      if (type === "roses")
        for (const x of [14, 24, 33]) {
          add("path", {
            d: `M${x},2v${6 + x / 4}`,
            stroke: b,
            "stroke-width": 0.5,
          });
          add("circle", {
            cx: x,
            cy: 9 + x / 4,
            r: 0.9,
            fill: b,
            class: "frame-glint",
          });
        }
    } else if (type === "hearts") {
      svg.append(path({ "stroke-width": 0.7, opacity: 0.35 }));
      for (let i = 0; i < 5; i++) {
        const g = add("g", { transform: `translate(${14 + i * 18} 102)` }),
          n = add(
            "path",
            {
              d: "M0,-3C-7,-10 -12,1 0,8C12,1 7,-10 0,-3Z",
              fill: paint,
              stroke: a,
              "stroke-width": 0.5,
            },
            g,
          );
        add(
          "path",
          {
            d: "M-6,-2Q-4,-5 -2,-3",
            fill: "none",
            stroke: b,
            "stroke-width": 1.1,
            "stroke-linecap": "round",
          },
          g,
        );
        animate(
          n,
          "transform",
          "scale(.92);scale(1.04);scale(.92)",
          0.4,
          i * 0.12,
        );
      }
    } else if (type === "thorn") {
      organic(a, 4.6, 1.4);
      organic(b, 0.7, 1.4, 0.7);
      for (let i = 0; i < 18; i++) {
        const g = move(svg, i / 18),
          n = add(
            "path",
            {
              d: "M-3,0Q-2,-7 3,-10Q0,-5 4,-1Z",
              fill: i % 3 ? a : b,
              opacity: 0.85,
            },
            g,
          );
        animate(n, "opacity", ".55;.95;.55", 0.8, i / 18);
      }
    } else if (type === "crt") {
      svg.append(path({ stroke: a, "stroke-width": 7 }));
      svg.append(path({ stroke: b, "stroke-width": 0.8, opacity: 0.6 }));
      const clip = add("clipPath", { id: id + "-clip" }, defs);
      add("path", { d: basis }, clip);
      const g = add("g", { "clip-path": `url(#${id}-clip)` });
      for (let i = 0; i < 28; i++)
        add(
          "path",
          {
            d: `M-1,${i * 4}H101`,
            stroke: b,
            "stroke-width": 0.18,
            opacity: 0.12,
          },
          g,
        );
      const scan = add(
        "path",
        { d: "M-1,0H101", stroke: b, "stroke-width": 2, opacity: 0.16 },
        g,
      );
      animate(scan, "transform", "translate(0 0);translate(0 105)", 0.55);
    } else if (type === "projector") {
      for (let row = 0; row < 3; row++)
        svg.append(
          path({
            stroke: a,
            "stroke-width": 0.8,
            "stroke-dasharray": "1 3",
            transform: `translate(50 50) scale(${1 + row * 0.026}) translate(-50 -50)`,
            opacity: 0.25 + row * 0.15,
          }),
        );
      const g = add("g", {});
      add(
        "circle",
        { r: 4, fill: a, opacity: 0.6, filter: `url(#${id}-soft)` },
        g,
      );
      add("circle", { r: 1.2, fill: b }, g);
      g.append(
        el("animateMotion", {
          path: basis,
          dur: speed + "s",
          repeatCount: "indefinite",
        }),
      );
    } else {
      svg.append(
        path({
          stroke: a,
          "stroke-width": 2.5,
          "stroke-dasharray": "32 8 4 12 24 10 48 12",
          opacity: 0.8,
        }),
      );
      const n = svg.appendChild(
        path({
          stroke: b,
          "stroke-width": 1,
          "stroke-dasharray": "10 350",
          class: "frame-tech-flow",
        }),
      );
      n.style.setProperty("--frame-lap", "360");
      for (let i = 0; i < 4; i++) {
        const g = move(svg, i / 4, 2);
        add(
          "path",
          { d: "M-4,0H4M0,-2V2", stroke: b, "stroke-width": 0.65 },
          g,
        );
      }
    }
    return true;
  }
  function update(host, p) {
    let a = p.frameUseThemeColors ? p.accent : p.frameAccent,
      b = p.frameUseThemeColors ? p.secondary : p.frameSecondary;
    const isMedia =
        (p.frame === "custom" && Boolean(p.customFrame)) ||
        Boolean(root.PCStudioFrameMedia?.record(p.frame)),
      entry = catalog.find((c) => c.id === p.frame);
    if (!isMedia && !p.frameOriginalColors && p.frameColorStrength < 100) {
      const mix = (base, next) =>
        "#" +
        [0, 1, 2]
          .map((i) =>
            Math.round(
              parseInt(base.slice(1 + i * 2, 3 + i * 2), 16) *
                (1 - p.frameColorStrength / 100) +
                (parseInt(next.slice(1 + i * 2, 3 + i * 2), 16) *
                  p.frameColorStrength) /
                  100,
            )
              .toString(16)
              .padStart(2, "0"),
          )
          .join("");
      a = mix(entry?.accent || "#b9d8ef", a);
      b = mix(entry?.secondary || "#ffffff", b);
    }
    const key = isMedia
      ? [p.frame, p.customFrame]
      : [
          p.frame,
          p.avatarShape,
          p.frameWidth,
          p.frameSpeed,
          p.frameColorCycle,
          a,
          b,
        ];
    host.style.setProperty("--ps-frame-speed", p.frameSpeed + "s");
    host.style.setProperty(
      "--ps-frame-scale",
      String((p.frameScale || 100) / 100),
    );
    host.style.setProperty(
      "--ps-art-opacity",
      String((p.frameIntensity || 85) / 100),
    );
    host.style.setProperty("--ps-frame-glow", p.frameGlow * 0.1 + "px");
    host.style.setProperty("--ps-frame-color", a);
    host.style.setProperty(
      "--ps-frame-filter",
      p.frameGlow > 0
        ? `drop-shadow(0 0 ${p.frameGlow * 0.1}px ${a}38)`
        : "none",
    );
    host.style.setProperty("--ps-frame-halo", String(p.frameGlow / 100));
    host.dataset.motion = String(p.motion);
    host.dataset.frame = p.frame;
    const previousKey = hostKeys.get(host);
    if (
      previousKey &&
      key.length === previousKey.length &&
      key.every((value, i) => value === previousKey[i])
    ) {
      const current = host.querySelector("svg");
      current?._frameUpdate?.(p, a, b);
      if (current) watch(current, p);
      return;
    }
    hostKeys.set(host, key);
    delete host.dataset.frameKey;
    const previous = host.querySelector(".ps-frame-art");
    previous?._frameCleanup?.();
    previous?.remove();
    host.dataset.art = "true";
    if (p.frame === "none") return;
    const doc = host.ownerDocument,
      el = (tag, attrs = {}) => {
        const n = doc.createElementNS(ns, tag);
        for (const [k, v] of Object.entries(attrs))
          n.setAttribute(k, String(v));
        return n;
      },
      svg = el("svg", {
        viewBox: "-12 -12 124 124",
        "aria-hidden": "true",
        class: "ps-frame-art",
      }),
      defs = el("defs"),
      id = "ps-frame-" + ++counter,
      gradient = el("linearGradient", {
        id,
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "100%",
      });
    gradient.append(
      el("stop", { offset: "0%", "stop-color": a }),
      el("stop", { offset: "65%", "stop-color": b }),
      el("stop", { offset: "100%", "stop-color": a }),
    );
    defs.append(gradient);
    svg.append(defs);
    if (root.PCStudioFrameMedia?.draw({ svg, defs, id, el, p, a, b })) {
      host.append(svg);
      watch(svg, p);
      return;
    }
    const basis =
      p.avatarShape === "circle"
        ? "M50,-1A51,51 0 1 1 49.999,-1Z"
        : p.avatarShape === "square"
          ? "M3,-1H97Q101,-1 101,3V97Q101,101 97,101H3Q-1,101 -1,97V3Q-1,-1 3,-1Z"
          : "M20,-1H80Q101,-1 101,20V80Q101,101 80,101H20Q-1,101 -1,80V20Q-1,-1 20,-1Z";
    const path = (attrs = {}) =>
      el("path", {
        d: basis,
        pathLength: 360,
        fill: "none",
        stroke: `url(#${id})`,
        "stroke-width": p.frameWidth,
        "stroke-linecap": "round",
        ...attrs,
      });
    svg.append(
      path({
        opacity: ".24",
        "stroke-width": Math.max(1, p.frameWidth * 0.55),
      }),
    );
    const rotating = el("g", { class: "frame-orbit" }),
      reverse = el("g", { class: "frame-reverse" });
    svg.append(rotating, reverse);
    // Position ornaments on the actual contour, including rounded/square avatars.
    const guide = path(),
      length = guide.getTotalLength();
    const point = (u, extra = 0) => {
      const at = (v) => guide.getPointAtLength((((v % 1) + 1) % 1) * length);
      const q = at(u),
        prev = at(u - 0.0005),
        next = at(u + 0.0005);
      const dx = next.x - prev.x,
        dy = next.y - prev.y,
        norm = Math.hypot(dx, dy) || 1;
      const nx = dy / norm,
        ny = -dx / norm;
      return [q.x + nx * extra, q.y + ny * extra, nx, ny];
    };
    if (
      root.PCStudioFrameDesigns?.draw({
        svg,
        defs,
        id,
        el,
        path,
        p,
        a,
        b,
        point,
      })
    ) {
      host.append(svg);
      watch(svg, p);
      return;
    }
    if (rich({ svg, defs, id, el, path, basis, p, a, b })) {
      // Decorative shapes have their own contours and local animation, never a rotating portrait.
    } else if (p.frame === "frost") {
      svg.append(path({ "stroke-width": p.frameWidth * 0.7, opacity: ".8" }));
      for (let i = 0; i < 12; i++) {
        const [x, y, nx, ny] = point(i / 12, 2),
          angle = Math.atan2(ny, nx),
          shard = el("path", {
            d: "M-2,2 0,-6 2,2 0,5Z",
            fill: i % 3 ? `url(#${id})` : b,
            opacity: 0.4 + (i % 3) * 0.18,
            transform: `translate(${x} ${y}) rotate(${(angle * 180) / Math.PI + 90})`,
            class: "frame-glint",
            style: `--phase:${i * -0.37}s`,
          });
        svg.append(shard);
      }
      rotating.append(path({ "stroke-dasharray": "6 280", opacity: ".75" }));
    } else if (p.frame === "prism") {
      svg.append(
        path({
          "stroke-width": Math.max(0.7, p.frameWidth * 0.45),
          opacity: ".65",
        }),
      );
      for (let i = 0; i < 8; i++) {
        const [x, y, nx, ny] = point(i / 8 + 1 / 16, 3);
        const facet = el("g", {
          transform: `translate(${x} ${y}) rotate(${(Math.atan2(ny, nx) * 180) / Math.PI + 90})`,
          class: "frame-glint",
          style: `--phase:${-i * 0.6}s`,
        });
        facet.append(
          el("path", { d: "M0,-8L5,0L0,8L-5,0Z", fill: a, opacity: ".85" }),
          el("path", { d: "M0,-8L5,0L0,8Z", fill: b }),
          el("path", {
            d: "M-5,0H5M0,-8V8",
            stroke: "#fff",
            "stroke-width": 0.4,
            opacity: ".6",
          }),
        );
        svg.append(facet);
      }
    } else if (p.frame === "aurora") {
      rotating.append(
        path({
          "stroke-width": p.frameWidth * 1.4,
          "stroke-dasharray": "62 26 16 215",
          opacity: ".8",
        }),
      );
      reverse.append(
        path({
          "stroke-width": p.frameWidth * 0.65,
          "stroke-dasharray": "26 84 9 206",
          opacity: ".8",
        }),
      );
      for (let i = 0; i < 5; i++) {
        const [x, y] = point(i / 5, 3);
        rotating.append(
          el("circle", {
            cx: x,
            cy: y,
            r: 0.9,
            fill: b,
            opacity: ".8",
          }),
        );
      }
    } else if (p.frame === "ember") {
      svg.append(path({ "stroke-dasharray": "10 4 2 3", opacity: ".7" }));
      for (let i = 0; i < 14; i++) {
        const [x, y, nx, ny] = point(i / 14, 2);
        svg.append(
          el("path", {
            d: `M${x},${y}l${nx * 3},${ny * 3}`,
            stroke: i % 2 ? a : b,
            "stroke-width": 0.8,
            class: "frame-spark",
            style: `--phase:${i * -0.27}s`,
          }),
        );
      }
      rotating.append(path({ "stroke-dasharray": "12 307", opacity: ".9" }));
    } else if (p.frame === "circuit") {
      svg.append(path({ "stroke-dasharray": "20 6 3 6", opacity: ".8" }));
      for (let i = 0; i < 4; i++) {
        const [x, y] = point(i / 4 + 0.125, 1);
        svg.append(
          el("rect", {
            x: x - 1.8,
            y: y - 1.8,
            width: 3.6,
            height: 3.6,
            fill: b,
            transform: `rotate(45 ${x} ${y})`,
          }),
        );
      }
      rotating.append(
        path({
          "stroke-width": p.frameWidth * 1.4,
          "stroke-dasharray": "8 320",
          opacity: ".85",
        }),
      );
    } else if (p.frame === "laurel") {
      svg.append(
        path({
          "stroke-width": Math.max(0.8, p.frameWidth * 0.5),
          opacity: ".6",
        }),
      );
      for (const side of [-1, 1])
        for (let i = 0; i < 6; i++) {
          const u = 0.28 + i * 0.04;
          const [x, y, nx, ny] = point(side === 1 ? u : 1 - u, 2);
          svg.append(
            el("path", {
              d: "M0 3C-6 -1 -6 -6 0 -7C5 -5 5 0 0 3Z",
              fill: `url(#${id})`,
              opacity: ".8",
              transform: `translate(${x} ${y}) rotate(${(Math.atan2(ny, nx) * 180) / Math.PI + 70})`,
              class: "frame-laurel",
              style: `--phase:${i * -0.3}s`,
            }),
          );
        }
    } else if (p.frame === "double") {
      svg.append(path({ "stroke-width": p.frameWidth, opacity: ".85" }));
      svg.append(
        path({
          transform: "translate(50 50) scale(1.09) translate(-50 -50)",
          "stroke-width": 0.7,
          opacity: ".55",
        }),
      );
    } else if (p.frame === "dashed")
      svg.append(path({ "stroke-dasharray": "4 5", opacity: ".85" }));
    else if (p.frame === "pulse")
      svg.append(path({ class: "frame-glint", opacity: ".9" }));
    else if (p.frame === "orbit") {
      svg.append(path({ "stroke-width": 0.7, opacity: ".45" }));
      for (let i = 0; i < 3; i++) {
        const satellite = el("g", { class: "frame-satellite" });
        satellite.append(
          el("circle", { r: i === 0 ? 2.3 : 1.4, fill: i === 1 ? b : a }),
          el("circle", {
            r: i === 0 ? 4.7 : 3,
            fill: "none",
            stroke: a,
            "stroke-width": 0.6,
            opacity: ".35",
          }),
        );
        satellite.append(
          el("animateMotion", {
            path: basis,
            dur: p.frameSpeed + "s",
            begin: (-p.frameSpeed * i) / 3 + "s",
            repeatCount: "indefinite",
            calcMode: "paced",
          }),
        );
        svg.append(satellite);
      }
    } else if (p.frame === "neon") {
      const blur = el("filter", {
        id: id + "-halo",
        filterUnits: "userSpaceOnUse",
        x: -15,
        y: -15,
        width: 130,
        height: 130,
      });
      blur.append(el("feGaussianBlur", { stdDeviation: 2 }));
      defs.append(blur);
      svg.append(
        path({
          "stroke-width": p.frameWidth * 2.3,
          filter: `url(#${id}-halo)`,
          class: "frame-neon-halo",
        }),
      );
      svg.append(
        path({ "stroke-width": p.frameWidth * 1.1, stroke: a, opacity: ".85" }),
      );
      svg.append(
        path({
          "stroke-width": Math.max(0.65, p.frameWidth * 0.4),
          stroke: b,
          opacity: ".95",
        }),
      );
      rotating.append(
        path({
          "stroke-width": Math.max(0.5, p.frameWidth * 0.25),
          stroke: "#fff",
          "stroke-dasharray": "14 346",
          opacity: ".7",
        }),
      );
    }
    for (const n of svg.querySelectorAll(
      ".frame-orbit path,.frame-reverse path",
    )) {
      const lap = (n.getAttribute("stroke-dasharray") || "")
        .split(/[ ,]+/)
        .reduce((sum, v) => sum + Number(v), 0);
      n.style.setProperty("--frame-lap", String(lap));
    }
    if (p.frameColorCycle) {
      const filter = el("filter", {
        id: id + "-legacy-cycle",
        x: "-30%",
        y: "-30%",
        width: "160%",
        height: "160%",
      });
      const hue = el("feColorMatrix", { type: "hueRotate", values: 0 });
      hue.append(
        el("animate", {
          attributeName: "values",
          values: "0;360",
          dur: p.frameSpeed + "s",
          repeatCount: "indefinite",
        }),
      );
      filter.append(hue);
      defs.append(filter);
      const wrapper = el("g", { filter: `url(#${id}-legacy-cycle)` });
      for (const child of [...svg.children])
        if (child !== defs) wrapper.append(child);
      svg.append(wrapper);
    }
    host.append(svg);
    watch(svg, p);
  }
  root.PCStudioFrames = { update, catalog };
})(globalThis);
