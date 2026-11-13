(function (root) {
  "use strict";
  const bound = new WeakSet();
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  function hsv(hex) {
    const [r, g, b] = rgb(hex).map((v) => v / 255),
      max = Math.max(r, g, b),
      min = Math.min(r, g, b),
      d = max - min;
    let h = !d
      ? 0
      : max === r
        ? ((g - b) / d) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, max ? d / max : 0, max];
  }
  function hex(h, s, v) {
    const c = v * s,
      x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
      m = v - c;
    const p =
      h < 60
        ? [c, x, 0]
        : h < 120
          ? [x, c, 0]
          : h < 180
            ? [0, c, x]
            : h < 240
              ? [0, x, c]
              : h < 300
                ? [x, 0, c]
                : [c, 0, x];
    return (
      "#" +
      p
        .map((n) =>
          Math.round((n + m) * 255)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")
    );
  }
  let dialog,
    source,
    original,
    value,
    tone = [0, 0, 1],
    last;
  let touched = false;
  const make = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };
  function emit(change = false) {
    if (!source?.isConnected) return;
    touched = true;
    source.value = value;
    source.dispatchEvent(
      new Event(change ? "change" : "input", { bubbles: true }),
    );
  }
  function paint(from) {
    value = hex(...tone);
    dialog
      .querySelector(".color-sv")
      .style.setProperty("--picker-hue", tone[0]);
    const thumb = dialog.querySelector(".color-sv-thumb");
    thumb.style.left = tone[1] * 100 + "%";
    thumb.style.top = (1 - tone[2]) * 100 + "%";
    dialog
      .querySelector(".color-sv")
      .setAttribute(
        "aria-valuetext",
        Math.round(tone[1] * 100) +
          "% насыщенность, " +
          Math.round(tone[2] * 100) +
          "% яркость",
      );
    dialog
      .querySelector(".color-sv")
      .setAttribute("aria-valuenow", Math.round(tone[1] * 100));
    if (from !== "hue") dialog.querySelector("#picker-hue").value = tone[0];
    if (from !== "hex")
      dialog.querySelector("#picker-hex").value = value.toUpperCase();
    rgb(value).forEach((v, i) => {
      if (from !== "rgb")
        dialog.querySelector("#picker-" + ["r", "g", "b"][i]).value = v;
    });
    dialog.querySelector(".color-current").style.background = value;
    if (from !== "init") emit();
  }
  function build() {
    dialog = make("dialog", "studio-color-dialog");
    dialog.id = "studio-color-dialog";
    dialog.setAttribute("aria-labelledby", "picker-title");
    const head = make("div", "picker-heading"),
      title = make("strong", "", "Цвет");
    title.id = "picker-title";
    const close = make("button", "picker-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Закрыть выбор цвета");
    close.onclick = () => finish(true);
    head.append(title, close);
    const row = make("div", "color-plane"),
      sv = make("div", "color-sv"),
      thumb = make("i", "color-sv-thumb");
    sv.tabIndex = 0;
    sv.setAttribute("role", "slider");
    sv.setAttribute("aria-valuemin", "0");
    sv.setAttribute("aria-valuemax", "100");
    sv.setAttribute("aria-label", "Насыщенность и яркость");
    sv.append(thumb);
    const hue = make("input", "color-hue");
    hue.id = "picker-hue";
    hue.type = "range";
    hue.min = 0;
    hue.max = 359;
    hue.step = 1;
    hue.setAttribute("aria-label", "Цветовой тон");
    const pointer = (e) => {
      const r = sv.getBoundingClientRect();
      tone[1] = clamp((e.clientX - r.left) / r.width, 0, 1);
      tone[2] = 1 - clamp((e.clientY - r.top) / r.height, 0, 1);
      paint();
    };
    sv.onpointerdown = (e) => {
      sv.setPointerCapture(e.pointerId);
      pointer(e);
    };
    sv.onpointermove = (e) => {
      if (sv.hasPointerCapture(e.pointerId)) pointer(e);
    };
    sv.onkeydown = (e) => {
      const k = e.shiftKey ? 0.1 : 0.01;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        tone[1] = clamp(
          tone[1] +
            (e.key === "ArrowRight" ? k : e.key === "ArrowLeft" ? -k : 0),
          0,
          1,
        );
        tone[2] = clamp(
          tone[2] + (e.key === "ArrowUp" ? k : e.key === "ArrowDown" ? -k : 0),
          0,
          1,
        );
        paint();
      }
    };
    hue.oninput = () => {
      tone[0] = Number(hue.value);
      paint("hue");
    };
    row.append(sv, hue);
    const previews = make("div", "color-preview-row"),
      old = make("button", "color-original"),
      current = make("span", "color-current");
    old.type = "button";
    old.setAttribute("aria-label", "Исходный цвет");
    old.onclick = () => {
      tone = hsv(original);
      paint();
    };
    previews.append(old, current, make("span", "", "исходный / выбранный"));
    const values = make("div", "picker-values"),
      hexLabel = make("label", "", "HEX"),
      hexInput = make("input");
    hexInput.id = "picker-hex";
    hexInput.maxLength = 7;
    hexInput.spellcheck = false;
    hexInput.oninput = () => {
      const v = hexInput.value.trim();
      const valid = /^#[\da-f]{6}$/i.test(v);
      hexInput.setAttribute("aria-invalid", String(!valid));
      if (valid) {
        tone = hsv(v);
        paint("hex");
      }
    };
    hexLabel.append(hexInput);
    values.append(hexLabel);
    ["r", "g", "b"].forEach((letter) => {
      const label = make("label", "", letter.toUpperCase()),
        n = make("input");
      n.type = "number";
      n.id = "picker-" + letter;
      n.min = 0;
      n.max = 255;
      n.step = 1;
      n.setAttribute("aria-label", letter.toUpperCase());
      n.oninput = () => {
        const ns = ["r", "g", "b"].map((k) =>
          dialog.querySelector("#picker-" + k),
        );
        if (ns.some((x) => x.value === "" || !Number.isFinite(+x.value)))
          return;
        const nums = ns.map((x) => Math.round(clamp(+x.value, 0, 255)));
        tone = hsv(
          "#" + nums.map((x) => x.toString(16).padStart(2, "0")).join(""),
        );
        paint("rgb");
      };
      n.onchange = () => {
        n.value = Math.round(clamp(+n.value || 0, 0, 255));
        n.dispatchEvent(new Event("input"));
      };
      label.append(n);
      values.append(label);
    });
    const swatches = make("div", "picker-swatches");
    [
      "#ffffff",
      "#141414",
      "#a8c8e5",
      "#e6a9c3",
      "#ba9af7",
      "#75d0e7",
      "#9adfbd",
      "#f0aa7b",
      "#e69aaa",
      "#d7df91",
    ].forEach((c) => {
      const b = make("button");
      b.type = "button";
      b.style.background = c;
      b.setAttribute("aria-label", "Цвет " + c);
      b.onclick = () => {
        tone = hsv(c);
        paint();
      };
      swatches.append(b);
    });
    const actions = make("div", "picker-actions"),
      cancel = make("button", "button secondary", "Отмена"),
      done = make("button", "button primary", "Готово");
    cancel.type = done.type = "button";
    cancel.onclick = () => finish(false);
    done.onclick = () => finish(true);
    actions.append(cancel, done);
    dialog.append(head, row, previews, values, swatches, actions);
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      finish(false);
    });
    document.body.append(dialog);
  }
  function finish(keep) {
    if (!dialog?.open) return;
    if (!keep && touched) {
      value = original;
      emit();
      source?.dispatchEvent(new CustomEvent("studio-color-cancel"));
    }
    if (keep && touched) emit(true);
    dialog.close();
    last?.focus();
    source = null;
  }
  function open(input) {
    if (!dialog) build();
    if (dialog.open) finish(true);
    source = input;
    last = input;
    original = input.value.toLowerCase();
    touched = false;
    input.dispatchEvent(new CustomEvent("studio-color-open"));
    value = original;
    tone = hsv(value);
    dialog.querySelector("#picker-hex").removeAttribute("aria-invalid");
    dialog.querySelector(".color-original").style.background = original;
    dialog.querySelector("#picker-title").textContent =
      input.labels?.[0]?.querySelector(".field-head")?.textContent ||
      input.getAttribute("aria-label") ||
      "Выбор цвета";
    paint("init");
    dialog.showModal();
    dialog.querySelector(".color-sv").focus();
  }
  function enhance(scope = document) {
    scope.querySelectorAll('input[type="color"]').forEach((input) => {
      if (bound.has(input)) return;
      bound.add(input);
      input.title = "Палитра, HEX и RGB";
      input.addEventListener("click", (e) => {
        e.preventDefault();
        open(input);
      });
    });
  }
  root.PCStudioColorPicker = { enhance, open, rgb, hsv, hex };
})(globalThis);
