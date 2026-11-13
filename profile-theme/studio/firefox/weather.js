(function (root) {
  "use strict";
  const TAU = Math.PI * 2;
  const species = [
    // Maple: five asymmetric lobes, narrow petiole and a pointed crown.
    "M0,-1.06 C.06,-.91 .1,-.78 .13,-.65 L.33,-.8 .31,-.39 .65,-.61 .61,-.31 .92,-.32 .69,-.05 .86,.08 .45,.24 .48,.44 .18,.42 .07,.73 -.02,.66 -.12,.89 -.22,.58 -.49,.54 -.45,.32 -.83,.18 -.65,-.02 -.94,-.23 -.6,-.27 -.68,-.54 -.34,-.39 -.37,-.77 -.12,-.61 Z",
    // Birch: tapered, slightly curled and serrated along both edges.
    "M-.03,-1.05 C.13,-.79 .39,-.64 .43,-.42 L.5,-.35 .44,-.25 .53,-.15 .46,-.05 .5,.06 .4,.15 .4,.27 .27,.32 C.2,.5 .05,.66 -.03,.83 C-.17,.69 -.34,.44 -.42,.23 L-.51,.19 -.46,.07 -.55,-.02 -.48,-.14 -.52,-.23 -.43,-.3 -.44,-.43 -.34,-.49 C-.22,-.7 -.12,-.85 -.03,-1.05Z",
    // Narrow beech leaf: curved tip and an uneven outer edge.
    "M-.1,-1.13 C.18,-.91 .4,-.44 .38,-.02 C.38,.38 .15,.67 .01,.87 C-.19,.68 -.4,.36 -.42,-.03 C-.45,-.49 -.21,-.8 -.1,-1.13Z",
    // Oak: rounded lobes rather than a star-shaped silhouette.
    "M0,-1.05 C.26,-1.06 .31,-.86 .19,-.72 C.59,-.85 .62,-.5 .36,-.39 C.78,-.42 .74,-.05 .44,.01 C.78,.2 .6,.47 .29,.38 C.45,.66 .16,.83 .02,.7 C-.08,.94 -.3,.83 -.24,.58 C-.55,.76 -.7,.47 -.43,.28 C-.82,.32 -.82,-.05 -.45,-.13 C-.73,-.38 -.52,-.64 -.27,-.48 C-.43,-.81 -.23,-1.01 0,-1.05Z",
  ];
  const palette = [
    ["#9da455", "#637b3d", "#354d2c"],
    ["#e3c66d", "#bc963b", "#776230"],
    ["#d49a51", "#b36b32", "#74402b"],
    ["#ab805b", "#79533b", "#493829"],
    ["#d0bd64", "#8d9b48", "#586b35"],
  ];
  const leafKeys = [
      "leafGreen",
      "leafYellow",
      "leafOrange",
      "leafBrown",
      "leafMixed",
    ],
    defaultMix = [22, 28, 25, 10, 15];
  function create({ document: doc }) {
    let w = 1,
      h = 1,
      prefs = null,
      items = [],
      ripples = [],
      leafSprites = [],
      rainSprites = [],
      snowSprites = [],
      beads = [],
      clock = 0,
      configKey = "",
      mix = defaultMix.slice(),
      seed = 98431;
    const rand = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    function surface(width, height) {
      const canvas = doc.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }
    function makeLeaf(type, color, back) {
      const canvas = surface(160, 192),
        c = canvas.getContext("2d");
      c.translate(80, 84);
      c.scale(61, 61);
      const outline = new Path2D(species[type]),
        stops = palette[color],
        gradient = c.createLinearGradient(-0.65, -0.8, 0.7, 0.75);
      gradient.addColorStop(0, back ? stops[1] : stops[0]);
      gradient.addColorStop(color === 4 ? 0.32 : 0.48, stops[1]);
      gradient.addColorStop(1, stops[2]);
      c.fillStyle = gradient;
      c.fill(outline);
      c.strokeStyle = "#482c22a8";
      c.lineWidth = 0.012;
      c.stroke(outline);
      c.save();
      c.clip(outline);
      const crease = c.createLinearGradient(-0.35, 0, 0.3, 0);
      crease.addColorStop(0, "#00000000");
      crease.addColorStop(0.43, "#0000001b");
      crease.addColorStop(0.5, "#fff0c21a");
      crease.addColorStop(1, "#ffffff00");
      c.fillStyle = crease;
      c.fillRect(-1, -1.15, 2, 2.3);
      // Small fixed freckles are rasterized once, never regenerated per frame.
      for (let i = 0; i < 150; i++) {
        const x = Math.sin(i * 91.73 + type * 0.31 + color) * 0.85,
          y = Math.sin(i * 17.17 + color * 0.57) * 1.05;
        c.fillStyle = i % 4 === 0 ? "#f2cf8624" : "#4d301c12";
        c.beginPath();
        c.ellipse(
          x,
          y,
          0.006 + (i % 5) * 0.003,
          0.004 + (i % 3) * 0.003,
          i * 0.3,
          0,
          TAU,
        );
        c.fill();
      }
      // A raised central vein, side veins and soft colour mottling.
      c.strokeStyle = back ? "#ddbd7738" : "#f4d28b68";
      c.lineWidth = 0.012;
      c.beginPath();
      c.moveTo(0.005, 0.83);
      c.bezierCurveTo(-0.05, 0.28, 0.07, -0.5, -0.025, -1.04);
      c.stroke();
      for (const side of [-1, 1])
        for (let i = 0; i < 5; i++) {
          const y = -0.63 + i * 0.25,
            reach =
              type === 0
                ? 0.31 + Math.sin(i * 0.7) * 0.28
                : type === 3
                  ? 0.28 + Math.sin(i * 0.8) * 0.17
                  : 0.23 + Math.sin(i * 0.6) * 0.16;
          c.beginPath();
          c.moveTo(0, y + 0.22);
          c.quadraticCurveTo(
            side * reach * 0.42,
            y + 0.1,
            side * reach,
            y - 0.03,
          );
          c.stroke();
        }
      c.fillStyle = "#53321c19";
      for (let i = 0; i < 13; i++) {
        const x = Math.sin(i * 12.73 + type) * 0.52,
          y = Math.sin(i * 3.17 + color) * 0.77;
        c.beginPath();
        c.ellipse(
          x,
          y,
          0.03 + (i % 3) * 0.025,
          0.018 + (i % 2) * 0.02,
          0.7,
          0,
          TAU,
        );
        c.fill();
      }
      c.restore();
      c.strokeStyle = stops[2];
      c.lineWidth = 0.025;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(0, 0.66);
      c.quadraticCurveTo(-0.015, 1, 0.14, 1.23);
      c.stroke();
      return canvas;
    }
    function makeRain(light, variant) {
      const canvas = surface(40, 52),
        c = canvas.getContext("2d");
      const drop = new Path2D(
        "M20 5C18 12 8 24 9 34C10 46 30 48 32 35C33 25 23 12 20 5Z",
      );
      const fill = c.createLinearGradient(9, 20, 31, 39);
      fill.addColorStop(0, light ? "#17202b12" : "#ffffff0c");
      fill.addColorStop(0.5, "#00000003");
      fill.addColorStop(1, light ? "#ffffff38" : "#00000030");
      c.fillStyle = fill;
      c.fill(drop);
      c.strokeStyle = light ? "#33425236" : "#c4d4df45";
      c.lineWidth = 0.9;
      c.stroke(drop);
      c.strokeStyle = light ? "#ffffff80" : "#e2f0f780";
      c.lineWidth = 0.8;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(14, 25);
      c.quadraticCurveTo(10, 33, 14, 37);
      c.stroke();
      c.strokeStyle = light ? "#4a59683d" : "#91a5b83d";
      c.beginPath();
      c.moveTo(19, 41);
      c.quadraticCurveTo(27, 42, 29, 36);
      c.stroke();
      return canvas;
    }
    function makeSnow(light, type) {
      const canvas = surface(40, 40),
        c = canvas.getContext("2d");
      c.translate(20, 20);
      c.strokeStyle = light ? "#667382" : "#eaf1f7";
      c.lineWidth = type === 2 ? 1.3 : 1.05;
      c.lineCap = "round";
      c.lineJoin = "round";
      for (let i = 0; i < 6; i++) {
        c.save();
        c.rotate((i * Math.PI) / 3 + ((type % 2) * Math.PI) / 6);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(0, -15);
        for (const t of type === 1 ? [0.42, 0.72] : [0.5, 0.76]) {
          const y = -15 * t,
            b = type === 2 ? 4.1 : 3.2;
          c.moveTo(0, y);
          c.lineTo(-b, y - b);
          c.moveTo(0, y);
          c.lineTo(b, y - b);
        }
        c.stroke();
        c.restore();
      }
      c.fillStyle = light ? "#667382b0" : "#ffffffb0";
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        c.lineTo(Math.cos(a) * 2.3, Math.sin(a) * 2.3);
      }
      c.closePath();
      c.fill();
      return canvas;
    }
    function resetSpark(p, initial = false) {
      p.life = 0.65 + rand() * 1.6;
      p.age = initial ? rand() * p.life : 0;
      p.origin = (0.08 + rand() * 0.84) * w;
      p.vx = (rand() - 0.5) * (80 + rand() * 130);
      p.vy = -(140 + rand() * 270);
      p.gravity = 70 + rand() * 50;
      p.phase = rand() * TAU;
      p.z = 0.3 + rand() * 0.7;
    }
    function rebuild() {
      seed = 98431;
      ripples = [];
      const area = Math.min(2.4, Math.max(0.55, (w * h) / 850000)),
        density = prefs.density / 100;
      clock = 0;
      const count =
        prefs.particles === "rain"
          ? Math.min(650, Math.round(density * (250 + 260 * area)))
          : prefs.particles === "snow"
            ? Math.min(160, Math.round(density * (60 + 65 * area)))
            : prefs.particles === "embers"
              ? Math.min(105, Math.round(density * (45 + 42 * area)))
              : Math.min(58, Math.round(density * (17 + 21 * area)));
      items = Array.from({ length: count }, () => {
        const z = rand() ** 1.35;
        return {
          x: rand(),
          y: rand(),
          z,
          phase: rand() * TAU,
          phase2: rand() * TAU,
          size: 12 + z * 34,
          type: Math.floor(rand() * 4),
          color: 0,
          colorSeed: rand(),
          rotation: (rand() - 0.5) * 1.1,
          spin: 0.5 + rand() * 0.6,
          ground: 0.955 + rand() * 0.043,
          opacity: 0.52 + rand() * 0.32,
        };
      });
      applyLeafMix();
      if (prefs.particles === "embers")
        items.forEach((p) => resetSpark(p, true));
      beads =
        prefs.particles === "rain"
          ? Array.from(
              { length: Math.min(24, Math.round(density * (8 + 12 * area))) },
              () => ({
                x: rand(),
                y: rand(),
                r: 2.5 + rand() * 4.5,
                age: rand() * 4,
                hold: 2 + rand() * 5,
                vy: 0,
              }),
            )
          : [];
    }
    function applyLeafMix() {
      const values = leafKeys.map((key, i) =>
        Number.isFinite(prefs?.[key]) ? Math.max(0, prefs[key]) : defaultMix[i],
      );
      const total = values.reduce((a, b) => a + b, 0);
      mix = total ? values.map((v) => (v / total) * 100) : defaultMix.slice();
      // Evenly spaced quantiles keep small scenes representative; random rank avoids colour bands.
      const ranked = [...items].sort((a, b) => a.colorSeed - b.colorSeed);
      ranked.forEach((p, i) => {
        const share = ((i + 0.5) / ranked.length) * 100;
        let boundary = 0;
        p.color = 4;
        for (let k = 0; k < 5; k++) {
          boundary += mix[k];
          if (share < boundary) {
            p.color = k;
            break;
          }
        }
      });
    }
    function configure(next) {
      prefs = next;
      const key = JSON.stringify([
        next.particles,
        next.density,
        next.colorMode,
      ]);
      if (key === configKey) {
        if (next.particles === "leaves") applyLeafMix();
        return;
      }
      configKey = key;
      if (next.particles === "rain") {
        rainSprites = [
          makeRain(next.colorMode === "light", 0),
          makeRain(next.colorMode === "light", 1),
        ];
      }
      if (next.particles === "snow")
        snowSprites = Array.from({ length: 3 }, (_, i) =>
          makeSnow(next.colorMode === "light", i),
        );
      if (next.particles === "leaves" && !leafSprites.length) {
        for (let type = 0; type < 4; type++)
          for (let color = 0; color < 5; color++)
            leafSprites.push([
              makeLeaf(type, color, false),
              makeLeaf(type, color, true),
            ]);
      }
      rebuild();
    }
    function resize(width, height) {
      if (width === w && height === h) return;
      w = width;
      h = height;
      if (prefs) rebuild();
    }
    function rain(c, dt, time) {
      const speed = prefs.effectSpeed,
        wind = 0.025 + Math.sin(time * 0.21) * 0.025;
      c.save();
      c.strokeStyle = prefs.colorMode === "light" ? "#596874" : "#bac9d5";
      c.lineCap = "round";
      // Short cylindrical water streaks: even brightness, no luminous head or tail.
      for (let layer = 0; layer < 3; layer++) {
        c.globalAlpha = [0.065, 0.13, 0.22][layer];
        c.lineWidth = [0.45, 0.65, 0.85][layer];
        c.beginPath();
        for (const p of items) {
          const depth = Math.min(2, Math.floor(p.z * 3));
          if (depth !== layer) continue;
          const vy = (300 + p.z * 520) * speed,
            vx = vy * wind,
            length = 2.5 + p.z * 8;
          p.x += (vx * dt) / w;
          p.y += (vy * dt) / h;
          if (p.y * h > h * p.ground + length) {
            if (p.z > 0.48 && rand() < 0.38 && ripples.length < 40)
              ripples.push({ x: p.x * w, y: h * p.ground, age: 0, z: p.z });
            p.y = -(length + rand() * 40) / h;
            p.x = rand();
          }
          if (p.x * w > w + 15) p.x = -15 / w;
          const x = p.x * w,
            y = p.y * h;
          c.moveTo(x, y);
          c.lineTo(x - (vx / vy) * length, y - length);
        }
        c.stroke();
      }
      // Sparse water beads on the foreground glass, with quiet gravity-driven release.
      for (const b of beads) {
        b.age += dt * speed;
        if (b.age > b.hold) {
          b.vy = Math.min(180, b.vy + 85 * dt * speed);
          b.y += (b.vy * dt * speed) / h;
        }
        if (b.y * h > h + b.r * 2) {
          b.x = rand();
          b.y = (-b.r * 2) / h;
          b.age = 0;
          b.vy = 0;
          b.hold = 2 + rand() * 5;
        }
        c.globalAlpha = prefs.colorMode === "light" ? 0.4 : 0.55;
        c.drawImage(
          rainSprites[0],
          b.x * w - b.r,
          b.y * h - b.r * 1.4,
          b.r * 2,
          b.r * 2.6,
        );
      }
      c.strokeStyle = prefs.colorMode === "light" ? "#596874" : "#abbfcc";
      c.fillStyle = c.strokeStyle;
      ripples = ripples.filter((p) => p.age < 0.5);
      for (const p of ripples) {
        p.age += dt * speed;
        const a = p.age / 0.5;
        c.globalAlpha = (1 - a) * (1 - a) * 0.3;
        c.lineWidth = 0.65;
        c.beginPath();
        c.ellipse(p.x, p.y, 1 + a * 10, 0.45 + a * 2.6, 0, 0, TAU);
        c.stroke();
        if (a < 0.35) {
          const t = a / 0.35;
          c.globalAlpha = (1 - t) * 0.27;
          for (const side of [-1, 1]) {
            c.beginPath();
            c.moveTo(p.x + side * (1 + t * 5), p.y - Math.sin(t * Math.PI) * 7);
            c.lineTo(
              p.x + side * (1.2 + t * 5.5),
              p.y - Math.sin(t * Math.PI) * 7 + 1.6,
            );
            c.stroke();
          }
        }
      }
      c.restore();
    }
    function snow(c, dt, time) {
      c.save();
      for (const p of items) {
        const z = 0.2 + p.z * 0.8;
        p.y += ((11 + z * 24) * dt * prefs.effectSpeed) / h;
        p.x +=
          ((Math.sin(time * 0.18 + p.phase) * 5 + 2) * dt * prefs.effectSpeed) /
          w;
        const size = 4 + p.z * p.z * 11;
        if (p.y * h > h + size) {
          p.y = -size / h;
          p.x = rand();
        }
        if (p.x > 1.02) p.x = -0.02;
        if (p.x < -0.02) p.x = 1.02;
        const x = p.x * w + Math.sin(time * 0.32 + p.phase) * (4 + z * 12),
          y = p.y * h;
        c.globalAlpha = 0.24 + p.z * 0.55;
        c.save();
        c.translate(x, y);
        c.rotate(p.rotation + time * (0.04 + p.spin * 0.05));
        c.drawImage(snowSprites[p.type % 3], -size / 2, -size / 2, size, size);
        c.restore();
      }
      c.restore();
    }
    function sparks(c, dt, time) {
      c.save();
      c.lineCap = "round";
      for (const p of items) {
        p.age += dt * prefs.effectSpeed;
        if (p.age >= p.life) resetSpark(p);
        const t = p.age,
          u = t / p.life,
          x = p.origin + p.vx * t + Math.sin(t * 6 + p.phase) * 3,
          y = h + 5 + p.vy * t + 0.5 * p.gravity * t * t,
          vy = p.vy + p.gravity * t;
        const brightness =
          Math.min(1, t * 14) *
          Math.pow(1 - u, 1.4) *
          (0.72 + 0.28 * Math.sin(t * 33 + p.phase) ** 2);
        c.globalAlpha = brightness;
        c.strokeStyle = `rgb(255,${Math.round(220 - 170 * u)},${Math.round(90 - 75 * u)})`;
        c.lineWidth = 0.55 + p.z * 0.65;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - p.vx * 0.012, y - vy * 0.012);
        c.stroke();
        if (u < 0.5) {
          c.fillStyle = "#ffe6a8";
          c.globalAlpha = brightness * 0.8;
          c.fillRect(x - 0.45, y - 0.45, 0.9, 0.9);
        }
      }
      c.restore();
    }
    function leaves(c, dt, time) {
      const speed = prefs.effectSpeed,
        t = time * speed,
        wind = Math.sin(t * 0.19) * 10 + Math.sin(t * 0.071 + 1.7) * 8;
      c.save();
      for (const p of items) {
        const z = 0.25 + p.z * 0.75,
          flutter = Math.sin(t * (0.7 + p.spin * 0.25) + p.phase);
        p.x +=
          ((6 + wind * 0.45 + Math.sin(t * 0.31 + p.phase2) * 3) * dt * speed) /
          w;
        p.y += ((19 + z * 24) * (1 + flutter * 0.12) * dt * speed) / h;
        if (p.y * h > h + p.size * 1.8) {
          p.y = -(p.size + rand() * 80) / h;
          p.x = rand();
        }
        if (p.x * w > w + p.size * 2) p.x = (-p.size * 2) / w;
        if (p.x * w < -p.size * 2) p.x = 1 + (p.size * 2) / w;
        const x =
            p.x * w +
            Math.sin(t * (0.36 + p.spin * 0.13) + p.phase) * (14 + z * 31),
          y = p.y * h + Math.sin(t * 0.58 + p.phase2) * 3,
          turn = Math.sin(t * (0.55 + p.spin * 0.23) + p.phase2),
          flip = Math.cos(t * (0.48 + p.spin * 0.2) + p.phase),
          faceScale = Math.sign(flip) * Math.max(0.13, Math.abs(flip)),
          size = p.size;
        c.globalAlpha = p.opacity * (0.48 + z * 0.52);
        c.save();
        c.translate(x, y);
        c.rotate(
          p.rotation + turn * 0.64 + Math.sin(t * 0.17 + p.phase) * 0.18,
        );
        c.scale(faceScale, 0.82 + 0.18 * Math.abs(flip));
        const sprite = leafSprites[p.type * 5 + p.color][flip < 0 ? 1 : 0];
        c.drawImage(sprite, -size / 2, -size * 0.54, size, size * 1.2);
        c.restore();
      }
      c.restore();
    }
    return {
      configure,
      resize,
      draw(c, dt, time) {
        if (!prefs || !items.length) return;
        clock += dt * prefs.effectSpeed;
        if (prefs.particles === "rain") rain(c, dt, clock);
        else if (prefs.particles === "leaves")
          leaves(c, dt, clock / prefs.effectSpeed);
        else if (prefs.particles === "snow") snow(c, dt, clock);
        else if (prefs.particles === "embers") sparks(c, dt, clock);
      },
      metrics() {
        return {
          kind: prefs?.particles,
          count: items.length,
          leafSpecies: leafSprites.length ? 4 : 0,
          leafPaletteCount: leafSprites.length ? 5 : 0,
          leafMix: mix.slice(),
          leafCounts: Array.from(
            { length: 5 },
            (_, i) => items.filter((p) => p.color === i).length,
          ),
          clock,
          rainSpriteCount: rainSprites.length,
          maximumRain: 650,
          snowflakeTextures: snowSprites.length,
          maximumSnow: 160,
          maximumSparks: 105,
          maximumLeaves: 58,
        };
      },
      destroy() {
        items = [];
        ripples = [];
        for (const pair of leafSprites)
          for (const canvas of pair) canvas.width = canvas.height = 1;
        for (const canvas of rainSprites) canvas.width = canvas.height = 1;
        leafSprites = [];
        rainSprites = [];
        snowSprites = [];
        beads = [];
      },
    };
  }
  root.PCStudioWeather = { create };
})(globalThis);
