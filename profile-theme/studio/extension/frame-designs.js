// Original, code-native artwork. These designs do not use Steam image assets.
(function (root) {
  "use strict";
  const catalog = [
    [
      "studio-ice",
      "Arctic Glass",
      "#94d9ef",
      "#eafaff",
      "Ледяные пластины, грани и снежные кристаллы",
      "square",
    ],
    [
      "studio-kintsugi",
      "Kintsugi",
      "#d9b46b",
      "#30313b",
      "Тёмный лак, золотые трещины и отблески",
      "rounded",
    ],
    [
      "studio-nocturne",
      "Nocturne",
      "#c9c1f2",
      "#41405e",
      "Луна, серебряные перья и подвески",
      "rounded",
    ],
    [
      "studio-petal",
      "Petal Atelier",
      "#e7a2c5",
      "#f4e7f1",
      "Объёмные цветы, тонкие ветви и лепестки",
      "rounded",
    ],
    [
      "studio-afterburn",
      "Afterburn",
      "#f18d66",
      "#373c47",
      "Бронированные сегменты и бегущие индикаторы",
      "square",
    ],
    [
      "studio-kitten",
      "Cloud Paws",
      "#e9e5f4",
      "#e6a4c4",
      "Мягкие ушки, бантик и лапки",
      "rounded",
    ],
  ].map(([id, name, accent, secondary, description, shape]) => ({
    id,
    name,
    accent,
    secondary,
    description,
    shape,
    source: "original",
  }));
  function draw({ svg, defs, id, el, path, p, a, b, point }) {
    if (!catalog.some((c) => c.id === p.frame)) return false;
    svg.dataset.renderer = "original";
    const body = el("g");
    svg.append(body);
    const add = (tag, attrs = {}, parent = body) => {
      const n = el(tag, attrs);
      parent.append(n);
      return n;
    };
    const speed = p.frameSpeed;
    const animate = (n, attr, values, duration = 1, phase = 0) =>
      n.append(
        el("animate", {
          attributeName: attr,
          values,
          dur: speed * duration + "s",
          begin: -speed * phase + "s",
          repeatCount: "indefinite",
          calcMode: "spline",
          keyTimes: "0;0.5;1",
          keySplines: ".4 0 .6 1;.4 0 .6 1",
        }),
      );
    const gradient = (suffix, colors, radial = false) => {
      const g = el(radial ? "radialGradient" : "linearGradient", {
        id: id + suffix,
        x1: "0%",
        y1: "0%",
        x2: "100%",
        y2: "100%",
      });
      colors.forEach((c, i) =>
        g.append(
          el("stop", { offset: i / (colors.length - 1), "stop-color": c }),
        ),
      );
      defs.append(g);
      return `url(#${id + suffix})`;
    };
    const sheen = gradient("-sheen", [b, a, "#ffffff", b]);
    const dark = gradient("-metal", ["#11151e", b, "#13131a", b]);
    const stroke = (color, width, attrs = {}) => {
      const n = path({
        stroke: color,
        "stroke-width": width * (p.frameWidth / 2),
        ...attrs,
      });
      body.append(n);
      return n;
    };
    const place = (u, out = 0, parent = body) => {
      const [x, y, nx, ny] = point(u, out);
      return add(
        "g",
        {
          transform: `translate(${x} ${y}) rotate(${(Math.atan2(ny, nx) * 180) / Math.PI + 90})`,
        },
        parent,
      );
    };
    const sparkle = (x, y, r = 2, phase = 0) => {
      const n = add("path", {
        d: `M${x - r},${y}Q${x},${y - r / 3} ${x},${y - r}Q${x + r / 3},${y} ${x + r},${y}Q${x},${y + r / 3} ${x},${y + r}Q${x - r / 3},${y} ${x - r},${y}Z`,
        fill: "#fff",
        opacity: 0.6,
      });
      animate(n, "opacity", ".15;.95;.15", 0.4, phase);
    };
    if (p.frame === "studio-ice") {
      stroke(sheen, 4, { opacity: 0.75 });
      stroke("#efffff", 0.7, { opacity: 0.8 });
      for (let i = 0; i < 22; i++) {
        const g = place(i / 22, 1),
          h = 4 + ((i * 7) % 6),
          w = 2 + ((i * 3) % 4);
        add(
          "path",
          {
            d: `M${-w},2L${-w - 1},-3L-1,${-h - 3}L${w},${-h}L${w + 1},2L0,4Z`,
            fill: sheen,
            stroke: a,
            "stroke-width": 0.45,
            opacity: 0.65 + (i % 3) * 0.12,
          },
          g,
        );
        add(
          "path",
          {
            d: `M-1,${-h - 3}L0,3L${w},${-h}M${-w},-2L0,3`,
            fill: "none",
            stroke: "#ffffff",
            "stroke-width": 0.45,
            opacity: 0.75,
          },
          g,
        );
      }
      for (const [u, phase] of [
        [0.13, 0],
        [0.64, 0.35],
      ]) {
        const g = place(u, 4);
        for (let i = 0; i < 6; i++)
          add(
            "path",
            {
              d: "M0,-7V7M0,-4L-2,-5M0,-4L2,-5M0,4L-2,5M0,4L2,5",
              stroke: "#f4fdff",
              "stroke-width": 0.65,
              fill: "none",
              transform: `rotate(${i * 60})`,
            },
            g,
          );
        const [x, y] = point(u, 4);
        sparkle(x, y, 3, phase);
      }
    } else if (p.frame === "studio-kintsugi") {
      stroke(dark, 8);
      stroke(a, 0.75, { opacity: 0.7 });
      for (let i = 0; i < 17; i++) {
        const g = place((i + 0.15) / 17),
          s = i % 2 ? 1 : -1;
        add(
          "path",
          {
            d: `M${-3 * s},-4L${s},-1L${-s},1L${3 * s},4M${s},-1L${5 * s},-2`,
            fill: "none",
            stroke: a,
            "stroke-width": 0.7,
            "stroke-linejoin": "round",
          },
          g,
        );
        if (i % 3 === 0)
          add(
            "path",
            { d: "M-5,-2L-3,-5L2,-3L5,-1L2,0Z", fill: a, opacity: 0.18 },
            g,
          );
      }
      const glint = stroke("#fff0c9", 1, {
        "stroke-dasharray": "4 356",
        opacity: 0.8,
      });
      glint.append(
        el("animate", {
          attributeName: "stroke-dashoffset",
          from: 0,
          to: -360,
          dur: speed + "s",
          repeatCount: "indefinite",
        }),
      );
      [
        [0.125, 0],
        [0.625, 0.5],
      ].forEach(([u, phase]) => {
        const [x, y] = point(u);
        sparkle(x, y, 2, phase);
      });
    } else if (p.frame === "studio-afterburn") {
      stroke("#10131a", 7);
      stroke(a, 0.7, { opacity: 0.7 });
      for (let i = 0; i < 12; i++) {
        const g = place((i + 0.45) / 12);
        add(
          "path",
          {
            d: "M-9,-4L-6,-7H6L9,-4V3L6,5H-6L-9,2Z",
            fill: dark,
            stroke: b,
            "stroke-width": 1,
          },
          g,
        );
        add(
          "path",
          {
            d: "M-6,-5H4L7,-2M-6,3H3",
            fill: "none",
            stroke: a,
            "stroke-width": 0.65,
            opacity: 0.75,
          },
          g,
        );
        for (let k = 0; k < 3; k++)
          add(
            "path",
            {
              d: `M${-4 + k * 2},-2l1,2`,
              stroke: "#a3acbb",
              "stroke-width": 0.4,
              opacity: 0.4,
            },
            g,
          );
        const led = add(
          "rect",
          { x: 4, y: 1, width: 2.5, height: 1, rx: 0.3, fill: a },
          g,
        );
        animate(led, "opacity", ".15;1;.15", 0.2, i / 12);
      }
      for (let i = 0; i < 4; i++) {
        const g = place(i / 4 + 0.125, 1);
        add(
          "circle",
          { r: 1.6, fill: "#141821", stroke: "#9299a6", "stroke-width": 0.6 },
          g,
        );
        add("path", { d: "M-1,0H1", stroke: a, "stroke-width": 0.5 }, g);
      }
    } else if (p.frame === "studio-nocturne") {
      stroke(dark, 5);
      stroke(sheen, 1, { opacity: 0.85 });
      for (const side of [0, 1])
        for (let i = 0; i < 9; i++) {
          const u = side === 0 ? 0.015 + i * 0.024 : 0.515 + i * 0.024,
            g = place(u, 1);
          add(
            "path",
            {
              d: "M0,3C-9,1 -9,-6 -5,-9C-3,-5 2,-6 0,3Z",
              fill: sheen,
              stroke: b,
              "stroke-width": 0.45,
            },
            g,
          );
          add(
            "path",
            {
              d: "M0,3L-5,-7M-1,0L-5,-2M-2,-3L-6,-4",
              fill: "none",
              stroke: b,
              "stroke-width": 0.35,
            },
            g,
          );
        }
      const crescent = add("g", { transform: "translate(50 -2)" });
      add(
        "path",
        {
          d: "M0,-8A8,8 0 1 0 5,6A7,7 0 0 1 0,-8Z",
          fill: sheen,
          stroke: a,
          "stroke-width": 0.5,
        },
        crescent,
      );
      const pendant = place(0.5, 1);
      add(
        "path",
        {
          d: "M0,0V9M-4,1V6M4,1V6",
          stroke: a,
          "stroke-width": 0.6,
          fill: "none",
        },
        pendant,
      );
      add("path", { d: "M0,7L2,10L0,13L-2,10Z", fill: a }, pendant);
      [0.22, 0.43, 0.73, 0.92].forEach((u, i) => {
        const [x, y] = point(u, 2);
        sparkle(x, y, 1.7, i * 0.19);
      });
    } else if (p.frame === "studio-petal") {
      stroke(sheen, 3.5);
      stroke(a, 0.6, { opacity: 0.65 });
      const petal = gradient("-petal", ["#fff8fd", b, a], true);
      const bloom = (parent, size) => {
        for (let ring = 0; ring < 2; ring++)
          for (let i = 0; i < 7; i++) {
            const g = add(
              "g",
              {
                transform: `rotate(${(i * 360) / 7 + ring * 24}) scale(${size * (ring ? 0.65 : 1)})`,
              },
              parent,
            );
            add(
              "path",
              {
                d: "M0,1C-7,-1 -6,-9 0,-9C6,-9 7,-1 0,1Z",
                fill: petal,
                stroke: a,
                "stroke-width": 0.25,
              },
              g,
            );
          }
        add("circle", { r: size * 1.4, fill: "#f5dba9" }, parent);
        for (let i = 0; i < 7; i++)
          add(
            "circle",
            {
              cx: Math.cos(i) * size,
              cy: Math.sin(i) * size,
              r: 0.25,
              fill: "#af865b",
            },
            parent,
          );
      };
      [
        [0.04, 1.1],
        [0.1, 0.65],
        [0.58, 1.05],
        [0.64, 0.6],
      ].forEach(([u, size]) => {
        const g = place(u, 1);
        for (let i = 0; i < 3; i++)
          add(
            "path",
            {
              d: "M0,1C-8,0 -9,-7 -8,-10C0,-9 2,-2 0,1Z",
              fill: b,
              stroke: a,
              "stroke-width": 0.4,
              transform: `rotate(${80 + i * 110})`,
            },
            g,
          );
        bloom(g, size);
      });
      for (let i = 0; i < 6; i++) {
        const g = place(0.14 + i * 0.14, 3);
        const pet = add(
          "path",
          { d: "M0,0C-4,-1 -4,-5 0,-4C4,-5 4,-1 0,0Z", fill: a, opacity: 0.8 },
          g,
        );
        animate(pet, "opacity", ".2;.9;.2", 0.5, i / 6);
        pet.append(
          el("animateTransform", {
            attributeName: "transform",
            type: "translate",
            values: "0 0;2 -3;0 0",
            dur: speed * 0.6 + "s",
            begin: -i + "s",
            repeatCount: "indefinite",
          }),
        );
      }
    } else if (p.frame === "studio-kitten") {
      stroke(b, 7);
      stroke(a, 4.5);
      stroke("#ffffff", 0.6, { opacity: 0.6 });
      for (const mirrored of [false, true]) {
        const ear = add("g", {
          transform: mirrored
            ? "translate(100 0) scale(-1 1)"
            : "translate(0 0)",
        });
        add(
          "path",
          {
            d: "M4,17C-3,8 -4,-9 0,-12C6,-14 18,-5 24,3L4,17Z",
            fill: a,
            stroke: b,
            "stroke-width": 1.5,
          },
          ear,
        );
        add(
          "path",
          {
            d: "M5,9C0,1 0,-7 2,-8C7,-7 13,-3 17,1L5,9Z",
            fill: b,
            opacity: 0.8,
          },
          ear,
        );
        add(
          "path",
          {
            d: "M1,10L4,5L6,8L8,2L10,5",
            fill: "none",
            stroke: "#ffffff",
            "stroke-width": 0.65,
            opacity: 0.65,
          },
          ear,
        );
      }
      for (const x of [23, 77]) {
        const g = add("g", { transform: `translate(${x} 103)` });
        add(
          "ellipse",
          { rx: 7, ry: 4.5, fill: a, stroke: b, "stroke-width": 1 },
          g,
        );
        for (const k of [-1, 0, 1])
          add("ellipse", { cx: k * 3, cy: -1.5, rx: 1.1, ry: 1.3, fill: b }, g);
        add("path", { d: "M-2,1C-4,4 4,4 2,1C1,-1 -1,-1 -2,1Z", fill: b }, g);
      }
      const bow = place(0.625, 4);
      add(
        "path",
        {
          d: "M0,0C-10,-9 -14,5 -3,4L0,0C10,-9 14,5 3,4Z",
          fill: b,
          stroke: a,
          "stroke-width": 0.6,
        },
        bow,
      );
      add("circle", { r: 2, fill: a }, bow);
      for (const u of [0.23, 0.76]) {
        const g = place(u, 2);
        for (let i = 0; i < 3; i++)
          add(
            "path",
            {
              d: `M0,${i * 2 - 2}L8,${i * 4 - 4}`,
              stroke: b,
              "stroke-width": 0.8,
            },
            g,
          );
      }
    }
    if (p.frameColorCycle) {
      const f = el("filter", {
        id: id + "-color-cycle",
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
          dur: speed + "s",
          repeatCount: "indefinite",
        }),
      );
      f.append(hue);
      defs.append(f);
      body.setAttribute("filter", `url(#${id}-color-cycle)`);
    }
    return true;
  }
  root.PCStudioFrameDesigns = { catalog, draw };
})(globalThis);
