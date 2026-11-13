(function (root) {
  "use strict";
  // Local navigation only. Search does not send queries or read account data.
  const targets = [
    ["Размытие фона", "background", "blur", "blur размытие резкость"],
    ["Затемнение фона", "background", "dim", "dark мрачный свет яркость"],
    [
      "Положение и масштаб фона",
      "background",
      "backgroundZoom",
      "zoom обрезка размер фото wallpaper",
    ],
    [
      "Загрузить свой фон",
      "background",
      "background",
      "upload картинка обои изображение размер 2560 1920",
    ],
    [
      "Движение фона за курсором",
      "background",
      "parallax",
      "parallax плавность глубина",
    ],
    [
      "Аватар и анимированная рамка",
      "profile",
      "frame",
      "avatar frame steam фото",
    ],
    [
      "Цвет рамки · HEX / RGB",
      "profile",
      "frameAccent",
      "color rgb hex палитра",
    ],
    [
      "Скорость рамки",
      "profile",
      "framePlaybackRate",
      "speed animation анимация",
    ],
    ["Размер рамки и украшений", "profile", "frameScale", "scale толщина"],
    ["Имя и описание профиля", "profile", "displayName", "name bio текст"],
    ["Проекты и закрепления", "projects", "", "project repo карточки pinned"],
    ["Мини-профиль и ссылки", "mini", "", "mini link карточка выравнивание"],
    [
      "Выбрать или загрузить шрифт",
      "type",
      "font",
      "font ttf woff типографика",
    ],
    ["Акцент профиля · HEX / RGB", "type", "accent", "color rgb hex палитра"],
    [
      "Прозрачность карточек",
      "type",
      "surfaceOpacity",
      "opacity стекло подложка",
    ],
    ["Скругление карточек", "type", "cardRadius", "radius corners углы"],
    ["Свой курсор", "cursor", "", "cursor png загрузить мышь точка прицел"],
    ["Цвет курсора", "cursor", "cursorColor", "cursor rgb hex"],
    ["Световой след курсора", "cursor", "cursorTrail", "trail шлейф"],
    [
      "Снег, дождь и листья",
      "effects",
      "particles",
      "rain snow autumn leaves искры stars погода",
    ],
    ["Плотность частиц", "effects", "density", "density снег дождь количество"],
    ["Скорость эффектов", "effects", "effectSpeed", "speed particles анимация"],
    [
      "Цвета осенних листьев",
      "effects",
      "leafGreen",
      "leaves жёлтый оранжевый зелёный осень",
    ],
    [
      "Оформление редактора",
      "interface",
      "",
      "skin fire water winter светлый белый кнопки",
    ],
    ["Импорт и экспорт темы", "sharing", "", "json import export скачать файл"],
    [
      "Публикация в своём репозитории",
      "publish",
      "publish-repo",
      "github public каталог владельцы",
    ],
  ];
  function create({ sections, extraEntries, navigate, enterExtension }) {
    const doc = root.document;
    const el = (tag, cls, text) => {
      const n = doc.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    };
    const normal = (s) =>
      s.toLocaleLowerCase("ru").replaceAll("ё", "е").normalize("NFKC");
    const dialog = el("dialog", "quick-search-dialog");
    dialog.id = "settings-search-dialog";
    dialog.setAttribute("aria-labelledby", "settings-search-title");
    const heading = el("div", "quick-search-heading");
    const title = el("h2", "", "Что настроим?");
    title.id = "settings-search-title";
    const close = el("button", "search-close", "Esc");
    close.type = "button";
    close.setAttribute("aria-label", "Закрыть поиск");
    close.addEventListener("click", () => dialog.close());
    heading.append(title, close);
    const input = el("input", "quick-search-input");
    input.id = "settings-search-query";
    input.type = "search";
    input.placeholder = "Например, цвет рамки или размытие…";
    input.setAttribute("aria-label", "Поиск настроек");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "true");
    input.setAttribute("aria-controls", "settings-search-results");
    input.autocomplete = "off";
    const caption = el("div", "search-caption", "Быстрый переход");
    const list = el("div", "quick-search-results");
    list.id = "settings-search-results";
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", "Результаты поиска");
    const empty = el(
      "div",
      "search-empty",
      "Ничего не нашлось. Попробуй «фон», «рамка» или «шрифт».",
    );
    empty.hidden = true;
    const count = el("span", "sr-only");
    count.setAttribute("role", "status");
    const footer = el("div", "quick-search-footer");
    footer.append(
      el("span", "", "↑ ↓ выбрать · Enter открыть"),
      el("span", "", "Настройки остаются на устройстве"),
    );
    dialog.append(heading, input, caption, list, empty, count, footer);
    doc.body.append(dialog);
    let shown = [],
      index = 0,
      opener = null,
      chosen = false;
    const sectionName = (id) =>
      sections.find((s) => s[0] === id)?.[2] || "Редактор";
    function entries() {
      return [
        ...targets.map(([label, section, target, keywords], i) => ({
          id: "setting-" + i,
          label,
          detail: sectionName(section),
          keywords,
          run: () => navigate(section, target),
        })),
        ...extraEntries(),
      ];
    }
    function select(next) {
      index = next;
      const rows = [...list.children];
      rows.forEach((r, i) =>
        r.setAttribute("aria-selected", String(i === index)),
      );
      if (rows[index]) {
        input.setAttribute("aria-activedescendant", rows[index].id);
        rows[index].scrollIntoView({ block: "nearest" });
      } else input.removeAttribute("aria-activedescendant");
    }
    function choose(i) {
      const item = shown[i];
      if (!item) return;
      chosen = true;
      dialog.close();
      enterExtension();
      item.run();
    }
    function render() {
      const terms = normal(input.value).trim().split(/\s+/).filter(Boolean);
      shown = entries()
        .filter((e) => {
          const text = normal(
            e.label + " " + e.detail + " " + (e.keywords || ""),
          );
          return terms.every((t) => text.includes(t));
        })
        .sort((a, b) => {
          const q = normal(input.value).trim();
          return (
            Number(normal(b.label).startsWith(q)) -
            Number(normal(a.label).startsWith(q))
          );
        })
        .slice(0, 10);
      list.replaceChildren();
      shown.forEach((entry, i) => {
        const row = el("div", "quick-search-result");
        row.id = "search-result-" + i;
        row.setAttribute("role", "option");
        row.append(
          el(
            "span",
            "search-result-icon",
            entry.id.startsWith("library-") ? "◇" : "↗",
          ),
        );
        const text = el("span", "search-result-text");
        text.append(
          el("strong", "", entry.label),
          el("small", "", entry.detail),
        );
        row.append(text, el("span", "search-result-enter", "↵"));
        row.addEventListener("click", () => choose(i));
        row.addEventListener("pointermove", () => select(i));
        list.append(row);
      });
      empty.hidden = shown.length > 0;
      caption.textContent = terms.length ? "Результаты" : "Быстрый переход";
      count.textContent = "Найдено: " + shown.length;
      select(0);
    }
    function open() {
      if (doc.querySelector("dialog[open]")) return;
      opener = doc.activeElement;
      chosen = false;
      input.value = "";
      dialog.showModal();
      render();
      input.focus();
    }
    dialog.addEventListener("close", () => {
      if (!chosen && opener?.isConnected) opener.focus();
    });
    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        dialog.close();
        return;
      }
      if (["ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        if (shown.length)
          select(
            (index + (e.key === "ArrowDown" ? 1 : -1) + shown.length) %
              shown.length,
          );
      }
      if (e.key === "Enter") {
        e.preventDefault();
        choose(index);
      }
    });
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    const trigger = doc.getElementById("settings-search");
    trigger.disabled = false;
    trigger.addEventListener("click", open);
    doc.addEventListener("keydown", (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "k" &&
        !doc.querySelector("dialog[open]")
      ) {
        e.preventDefault();
        open();
      }
    });

    const variant = el("dialog", "variant-dialog");
    variant.id = "variant-dialog";
    variant.setAttribute("aria-labelledby", "variant-title");
    const form = el("form");
    const variantTitle = el("h2", "", "Сохранить свой вариант");
    variantTitle.id = "variant-title";
    const intro = el(
      "p",
      "",
      "Оформление, аватар и тексты сохранятся в твоих сборках на этом устройстве.",
    );
    const label = el("label", "field", "Название сборки");
    const name = el("input");
    name.id = "variant-name";
    name.required = true;
    name.maxLength = 80;
    label.append(name);
    const error = el("p", "variant-error");
    error.setAttribute("role", "alert");
    error.hidden = true;
    const actions = el("div", "variant-actions");
    const cancel = el("button", "button secondary", "Отмена");
    cancel.type = "button";
    cancel.addEventListener("click", () => variant.close());
    const save = el("button", "button primary", "Сохранить сборку");
    save.type = "submit";
    actions.append(cancel, save);
    form.append(variantTitle, intro, label, error, actions);
    variant.append(form);
    doc.body.append(variant);
    let onSave = null,
      pending = false;
    name.addEventListener("input", () => name.setCustomValidity(""));
    variant.addEventListener("cancel", (e) => {
      if (pending) e.preventDefault();
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (pending) return;
      if (!name.value.trim()) {
        name.setCustomValidity("Введи название сборки.");
        name.reportValidity();
        return;
      }
      error.hidden = true;
      pending = save.disabled = cancel.disabled = true;
      try {
        await onSave(name.value.trim());
        variant.close();
      } catch (e) {
        error.textContent = e.message || "Не удалось сохранить сборку.";
        error.hidden = false;
      } finally {
        pending = save.disabled = cancel.disabled = false;
      }
    });
    return {
      nameVariant(options) {
        if (doc.querySelector("dialog[open]")) return;
        variantTitle.textContent = options.title;
        name.value = options.name;
        name.setCustomValidity("");
        save.textContent = options.submit;
        onSave = options.onSave;
        error.hidden = true;
        variant.showModal();
        name.focus();
        name.select();
      },
    };
  }
  root.PCStudioTools = { create };
})(globalThis);
