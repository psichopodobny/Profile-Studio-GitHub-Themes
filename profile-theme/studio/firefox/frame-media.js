(function (root) {
  "use strict";
  const records = new Map(
    (root.PCStudioFrameCatalog || []).map((x) => [x.id, x]),
  );
  const bytes = new Map();
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (a, start, end) => {
    let c = 0xffffffff;
    for (let i = start; i < end; i++)
      c = crcTable[(c ^ a[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const api = root.browser || root.chrome;
  const url = (path) =>
    api?.runtime?.getURL
      ? api.runtime.getURL(path)
      : new URL(path, location.href).href;
  const decode = (s) =>
    Uint8Array.from(atob(s.split(",")[1]), (c) => c.charCodeAt(0));
  function chunks(input, callback) {
    const a = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (
      a.length < 33 ||
      [137, 80, 78, 71, 13, 10, 26, 10].some((n, i) => a[i] !== n)
    )
      throw Error("Нужен файл PNG/APNG.");
    const v = new DataView(a.buffer, a.byteOffset, a.byteLength);
    for (let p = 8; p + 12 <= a.length;) {
      const length = v.getUint32(p),
        end = p + 12 + length;
      if (end > a.length) throw Error("Повреждённый PNG.");
      const type = String.fromCharCode(...a.slice(p + 4, p + 8));
      callback(a, v, p, length, type);
      p = end;
      if (type === "IEND") break;
    }
    return a;
  }
  function poster(input) {
    const parts = [new Uint8Array(input).slice(0, 8)];
    chunks(input, (a, v, p, n, t) => {
      if (!["acTL", "fcTL", "fdAT"].includes(t))
        parts.push(a.slice(p, p + 12 + n));
    });
    return new Blob(parts, { type: "image/png" });
  }
  function retime(input, rate) {
    const a = new Uint8Array(input).slice();
    chunks(a, (_, v, p, n, t) => {
      if (t !== "fcTL") return;
      const ms = Math.max(
        10,
        (1000 * v.getUint16(p + 28)) / (v.getUint16(p + 30) || 100),
      );
      v.setUint16(p + 28, Math.min(65535, Math.max(1, Math.round(ms / rate))));
      v.setUint16(p + 30, 1000);
      v.setUint32(p + 8 + n, crc(a, p + 4, p + 8 + n));
    });
    return new Blob([a], { type: "image/png" });
  }
  function inspect(input) {
    let width = 0,
      height = 0,
      count = 1;
    chunks(input, (_, v, p, n, t) => {
      if (t === "IHDR") {
        width = v.getUint32(p + 8);
        height = v.getUint32(p + 12);
      }
      if (t === "acTL") count = v.getUint32(p + 8);
    });
    if (width < 16 || height < 16 || width > 512 || height > 512 || count > 300)
      throw Error("Рамка: PNG/APNG до 512 × 512 и 300 кадров.");
    return { width, height, frames: count };
  }
  async function load(item) {
    if (!bytes.has(item.id))
      bytes.set(
        item.id,
        (async () => {
          if (location.protocol !== "file:") {
            const response = await fetch(url(item.file));
            if (!response.ok) throw Error("Рамка не найдена.");
            return new Uint8Array(await response.arrayBuffer());
          }
          root.PCStudioLocalFrames ||= {};
          if (!root.PCStudioLocalFrames[item.id])
            await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src = url("media/frames/" + item.id + ".js");
              script.onload = () => {
                script.remove();
                resolve();
              };
              script.onerror = () => {
                script.remove();
                reject(Error("Не удалось открыть данные рамки."));
              };
              document.head.append(script);
            });
          return decode(root.PCStudioLocalFrames[item.id]);
        })().catch((e) => {
          bytes.delete(item.id);
          throw e;
        }),
      );
    return bytes.get(item.id);
  }
  function draw({ svg, defs, id, el, p, a, b }) {
    const item = records.get(p.frame),
      custom = p.frame === "custom" && p.customFrame;
    if (!item && !custom) return false;
    svg.dataset.renderer = "apng";
    const image = el("image", {
      x: -12,
      y: -12,
      width: 124,
      height: 124,
      preserveAspectRatio: "xMidYMid meet",
      class: "frame-original-image",
    });
    svg.append(image);
    const owned = [];
    let live = true,
      revision = 0,
      rate = null,
      paintKey = "",
      motion = custom ? p.customFrame : url(item.file),
      still = custom ? "" : url(item.poster);
    svg._framePause = (paused) => {
      const source = paused ? still : motion;
      if (source && image.getAttribute("href") !== source)
        image.setAttribute("href", source);
    };
    svg._frameCleanup = () => {
      live = false;
      owned.forEach(URL.revokeObjectURL);
    };
    const filter = el("filter", {
      id: id + "-media",
      x: "-20%",
      y: "-20%",
      width: "140%",
      height: "140%",
      "color-interpolation-filters": "sRGB",
    });
    defs.append(filter);
    const original = motion;
    svg._frameUpdate = (next, primary, secondary) => {
      const key = JSON.stringify([
        next.frameOriginalColors,
        next.frameColorStrength,
        next.frameColorCycle,
        next.frameWidth,
        next.frameSpeed,
        primary,
        secondary,
      ]);
      if (key !== paintKey) {
        paintKey = key;
        filter.replaceChildren();
        const strength = (next.frameColorStrength ?? 100) / 100;
        if (!next.frameOriginalColors && strength > 0) {
          filter.append(el("feColorMatrix", { type: "saturate", values: 0 }));
          const transfer = el("feComponentTransfer", { result: "recolored" });
          ["R", "G", "B"].forEach((ch, i) =>
            transfer.append(
              el("feFunc" + ch, {
                type: "table",
                tableValues: `0 ${parseInt(secondary.slice(1 + i * 2, 3 + i * 2), 16) / 255} ${parseInt(primary.slice(1 + i * 2, 3 + i * 2), 16) / 255}`,
              }),
            ),
          );
          filter.append(transfer);
          if (strength < 1)
            filter.append(
              el("feComposite", {
                in: "recolored",
                in2: "SourceGraphic",
                operator: "arithmetic",
                k1: 0,
                k2: strength,
                k3: 1 - strength,
                k4: 0,
              }),
            );
        }
        if (next.frameColorCycle) {
          const cycle = el("feColorMatrix", { type: "hueRotate", values: 0 });
          cycle.append(
            el("animate", {
              attributeName: "values",
              values: "0;360",
              dur: Math.max(3, next.frameSpeed) + "s",
              repeatCount: "indefinite",
            }),
          );
          filter.append(cycle);
        }
        if (next.frameWidth !== 2)
          filter.append(
            el("feMorphology", {
              operator: next.frameWidth > 2 ? "dilate" : "erode",
              radius: Math.abs(next.frameWidth - 2) * 0.18,
            }),
          );
        if (filter.children.length)
          image.setAttribute("filter", `url(#${id}-media)`);
        else image.removeAttribute("filter");
      }
      if (rate === next.framePlaybackRate) return;
      rate = next.framePlaybackRate;
      const request = ++revision;
      if (rate === 1 && !custom) {
        const before = motion;
        motion = original;
        svg._framePause(svg.dataset.paused === "true");
        if (before.startsWith("blob:")) {
          URL.revokeObjectURL(before);
          const at = owned.indexOf(before);
          if (at >= 0) owned.splice(at, 1);
        }
        return;
      }
      const raw = custom ? Promise.resolve(decode(custom)) : load(item);
      raw
        .then((data) => {
          if (!live || request !== revision) return;
          inspect(data);
          if (custom && !still) {
            still = URL.createObjectURL(poster(data));
            owned.push(still);
          }
          const before = motion;
          motion =
            rate === 1 ? original : URL.createObjectURL(retime(data, rate));
          if (motion !== original) owned.push(motion);
          svg._framePause(svg.dataset.paused === "true");
          if (before.startsWith("blob:") && before !== motion) {
            URL.revokeObjectURL(before);
            const at = owned.indexOf(before);
            if (at >= 0) owned.splice(at, 1);
          }
          delete svg.dataset.mediaError;
        })
        .catch(() => {
          if (live && request === revision) svg.dataset.mediaError = "true";
        });
    };
    svg._framePause(svg.dataset.paused === "true");
    svg._frameUpdate(p, a, b);
    return true;
  }
  root.PCStudioFrameMedia = {
    draw,
    inspect,
    poster,
    retime,
    record: (id) => records.get(id),
    source: url,
  };
})(globalThis);
