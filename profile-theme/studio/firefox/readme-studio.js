(function (root) {
  "use strict";
  const core = root.PCStudioReadmeCore;
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };
  function create({ container, initial, onChange, fromTheme, notify }) {
    let state = core.normalize(initial),
      codeMode = false;
    const settings = el("aside", "readme-inspector"),
      heading = el("header", "readme-heading");
    heading.append(
      el("span", "eyebrow", "ВИДНО БЕЗ РАСШИРЕНИЯ"),
      el("h1", "", "Обычный GitHub"),
      el(
        "p",
        "footnote",
        "Баннер, текст, значки и проекты для публичного README. Весь макет собирается здесь.",
      ),
    );
    const form = el("div", "readme-settings"),
      canvas = el("section", "readme-canvas"),
      bar = el("div", "readme-preview-bar"),
      preview = el("article", "readme-public-preview"),
      code = el("pre", "readme-code");
    const previewButton = el("button", "button secondary", "Предпросмотр"),
      codeButton = el("button", "button secondary", "Markdown");
    previewButton.type = codeButton.type = "button";
    bar.append(
      previewButton,
      codeButton,
      el("span", "footnote", "Видно всем после сохранения на GitHub"),
    );
    previewButton.onclick = () => {
      codeMode = false;
      render();
    };
    codeButton.onclick = () => {
      codeMode = true;
      render();
    };
    canvas.append(bar, preview, code);
    settings.append(heading, form);
    container.append(settings, canvas);
    const group = (title) => {
      const section = el("section", "settings-group");
      section.append(el("h2", "group-title", title));
      form.append(section);
      return section;
    };
    function set(patch) {
      state = core.normalize({ ...state, ...patch });
      render();
      onChange(state);
    }
    function field(parent, key, label, type = "text", max = 240) {
      const wrap = el("label", "field", label),
        n = el(type === "textarea" ? "textarea" : "input");
      if (type !== "textarea") n.type = type;
      n.id = (key === "login" ? "basic-" : "readme-") + key;
      n.value = state[key];
      n.maxLength = max;
      n.oninput = () => set({ [key]: n.value });
      wrap.append(n);
      parent.append(wrap);
      return n;
    }
    const general = group("Профиль");
    field(general, "login", "GitHub-ник", "text", 39);
    field(general, "title", "Название / ник", "text", 70);
    field(general, "subtitle", "Короткая подпись", "text", 130);
    field(general, "about", "О себе", "textarea", 2500);
    const inherit = el(
      "button",
      "button secondary wide",
      "Взять данные из темы расширения",
    );
    inherit.type = "button";
    inherit.onclick = () => {
      const data = fromTheme();
      state = core.normalize({
        ...state,
        login: data.login,
        title: data.prefs.displayName || data.login || state.title,
        subtitle: data.prefs.bio || state.subtitle,
        about: data.prefs.about || data.prefs.bio || state.about,
        projects: data.prefs.projects,
        links: data.prefs.miniLinks,
      });
      sync();
      render();
      onChange(state);
      notify("Текст и проекты перенесены. Оба режима сохраняются отдельно.");
    };
    general.append(inherit);
    const banner = group("Баннер и значки"),
      style = el("div", "readme-styles");
    [
      ["minimal", "Минимал"],
      ["terminal", "Терминал"],
      ["editorial", "Редакционный"],
    ].forEach(([id, name]) => {
      const b = el("button", "button secondary", name);
      b.type = "button";
      b.dataset.readmeStyle = id;
      b.onclick = () => set({ style: id });
      style.append(b);
    });
    banner.append(style);
    const bannerLabel = el("label", "field", "Источник баннера"),
      select = el("select");
    select.id = "readme-banner";
    [
      ["generated", "Собрать баннер"],
      ["upload", "Свой PNG / GIF / WebP"],
      ["url", "HTTPS-ссылка"],
      ["none", "Без баннера"],
    ].forEach(([v, t]) => {
      const op = el("option", "", t);
      op.value = v;
      select.append(op);
    });
    select.value = state.banner;
    select.onchange = () => set({ banner: select.value });
    bannerLabel.append(select);
    banner.append(bannerLabel);
    field(banner, "accent", "Цвет баннера и значков", "color");
    field(banner, "base", "Подложка баннера", "color");
    field(banner, "stack", "Технологии через запятую", "text", 240);
    const url = field(
        banner,
        "bannerURL",
        "Ссылка на картинку / GIF",
        "url",
        500,
      ),
      upload = el("input"),
      uploadButton = el("button", "button secondary wide", "Загрузить баннер");
    upload.type = "file";
    upload.accept = "image/png,image/jpeg,image/webp,image/gif";
    upload.hidden = true;
    upload.id = "readme-banner-file";
    uploadButton.type = "button";
    uploadButton.onclick = () => upload.click();
    upload.onchange = async () => {
      const f = upload.files[0];
      upload.value = "";
      if (!f) return;
      if (
        f.size > 6000000 ||
        !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(f.type)
      ) {
        notify("Нужна картинка PNG, JPG, WebP или GIF до 6 МБ.", true);
        return;
      }
      const data = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(f);
      });
      set({
        banner: "upload",
        bannerData: data,
        bannerType: {
          "image/png": "png",
          "image/jpeg": "jpg",
          "image/webp": "webp",
          "image/gif": "gif",
        }[f.type],
      });
      select.value = "upload";
    };
    banner.append(
      uploadButton,
      upload,
      el(
        "p",
        "footnote",
        "Рекомендуется 1200 × 320 px. GIF сохраняется без пересжатия. Фон всей страницы GitHub меняется во второй вкладке.",
      ),
    );
    const projects = group("Карточки проектов"),
      projectFields = el("div");
    projects.append(projectFields);
    function projectsUI() {
      projectFields.replaceChildren();
      state.projects.forEach((p, i) => {
        const box = el("div", "readme-project-edit");
        ["title", "description", "url"].forEach((k, j) => {
          const label = el(
              "label",
              "field",
              ["Название", "Описание", "HTTPS-ссылка"][j],
            ),
            n = el(k === "description" ? "textarea" : "input");
          n.value = p[k];
          n.maxLength = k === "title" ? 60 : k === "description" ? 240 : 500;
          n.setAttribute(
            "aria-label",
            "Проект " + (i + 1) + ": " + ["название", "описание", "ссылка"][j],
          );
          n.oninput = () => {
            const items = state.projects.map((x) => ({ ...x }));
            items[i][k] = n.value;
            set({ projects: items });
          };
          label.append(n);
          box.append(label);
        });
        const actions = el("div", "readme-styles");
        [
          ["↑", -1],
          ["↓", 1],
        ].forEach(([t, d]) => {
          const b = el("button", "button secondary", t);
          b.type = "button";
          b.setAttribute(
            "aria-label",
            "Переместить проект " + (i + 1) + (d < 0 ? " выше" : " ниже"),
          );
          b.disabled = i + d < 0 || i + d >= state.projects.length;
          b.onclick = () => {
            const a = [...state.projects];
            [a[i], a[i + d]] = [a[i + d], a[i]];
            set({ projects: a });
            projectsUI();
          };
          actions.append(b);
        });
        const remove = el("button", "button secondary", "Удалить");
        remove.type = "button";
        remove.onclick = () => {
          set({ projects: state.projects.filter((_, j) => j !== i) });
          projectsUI();
        };
        actions.append(remove);
        box.append(actions);
        projectFields.append(box);
      });
      add.disabled = state.projects.length >= 8;
    }
    const add = el("button", "button secondary wide", "Добавить проект");
    add.type = "button";
    add.onclick = () => {
      set({
        projects: [
          ...state.projects,
          { title: "Новый проект", description: "", url: "" },
        ],
      });
      projectsUI();
    };
    projects.append(add);
    const out = group("Готово к GitHub"),
      downloadReadme = el("button", "button primary wide", "Скачать README.md"),
      downloadBanner = el("button", "button secondary wide", "Скачать баннер"),
      copy = el("button", "button secondary wide", "Скопировать Markdown"),
      open = el("a", "button secondary wide", "Открыть мой GitHub ↗");
    [downloadReadme, downloadBanner, copy].forEach((b) => (b.type = "button"));
    open.target = "_blank";
    open.rel = "noopener noreferrer";
    open.id = "readme-open-github";
    downloadReadme.onclick = () =>
      download(
        core.markdown(state),
        "README.md",
        "text/markdown;charset=utf-8",
      );
    downloadBanner.onclick = () => {
      if (state.banner === "generated")
        download(core.bannerSVG(state), "banner.svg", "image/svg+xml");
      else if (state.banner === "upload" && state.bannerData) {
        const a = el("a");
        a.href = state.bannerData;
        a.download = "banner." + state.bannerType;
        a.click();
      } else notify("Для внешнего баннера используется его HTTPS-ссылка.");
    };
    copy.onclick = () =>
      navigator.clipboard
        .writeText(core.markdown(state))
        .then(() => notify("Markdown скопирован."))
        .catch(() => notify("Копирование недоступно. Скачай README.md.", true));
    out.append(
      downloadReadme,
      downloadBanner,
      copy,
      open,
      el(
        "p",
        "notice",
        "После сохранения README и баннера в GitHub результат увидят все. Этот режим не меняет фон сайта и аватар аккаунта. Файлы публикуешь под своим аккаунтом; расширение не получает пароль или токен.",
      ),
    );
    function download(data, name, type) {
      const u = URL.createObjectURL(new Blob([data], { type })),
        a = el("a");
      a.href = u;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
      notify(name + " скачан.");
    }
    function sync() {
      [
        "login",
        "title",
        "subtitle",
        "about",
        "accent",
        "base",
        "stack",
        "bannerURL",
      ].forEach((k) => {
        const n = container.querySelector(
          (k === "login" ? "#basic-" : "#readme-") + k,
        );
        if (n) n.value = state[k];
      });
      select.value = state.banner;
      projectsUI();
    }
    out.append(
      el(
        "p",
        "footnote",
        "Если скачал баннер: положи его в profile-studio/banner.svg (или banner.gif / PNG / WebP) рядом с README.md. Этот путь уже указан в Markdown.",
      ),
    );
    function render() {
      preview.hidden = codeMode;
      code.hidden = !codeMode;
      previewButton.setAttribute("aria-pressed", String(!codeMode));
      codeButton.setAttribute("aria-pressed", String(codeMode));
      code.textContent = core.markdown(state);
      preview.replaceChildren();
      for (const b of style.children)
        b.setAttribute(
          "aria-pressed",
          String(b.dataset.readmeStyle === state.style),
        );
      url.closest("label").hidden = state.banner !== "url";
      uploadButton.hidden = state.banner !== "upload";
      downloadBanner.hidden = !["generated", "upload"].includes(state.banner);
      open.hidden = !state.login;
      open.href = "https://github.com/" + state.login;
      let src = "";
      if (state.banner === "generated")
        src =
          "data:image/svg+xml;base64," +
          btoa(unescape(encodeURIComponent(core.bannerSVG(state))));
      else if (state.banner === "upload") src = state.bannerData;
      else if (state.banner === "url") src = state.bannerURL;
      if (src) {
        const img = el("img", "readme-banner-preview");
        img.alt = state.title;
        img.src = src;
        img.referrerPolicy = "no-referrer";
        preview.append(img);
      } else
        preview.append(el("h1", "", state.title), el("p", "", state.subtitle));
      const badges = el("div", "readme-badges");
      state.stack
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12)
        .forEach((t) => {
          const b = el("code", "", t);
          b.style.borderColor = state.accent;
          badges.append(b);
        });
      preview.append(badges);
      state.about
        .split(/\n\s*\n/)
        .filter(Boolean)
        .forEach((t) => preview.append(el("p", "readme-about", t)));
      if (state.projects.length) {
        preview.append(el("h2", "", "Проекты"));
        const grid = el("div", "readme-projects");
        state.projects.forEach((p) => {
          const card = el("div", "readme-project-card"),
            title = el(p.url ? "a" : "strong", "", p.title);
          if (p.url) {
            title.href = p.url;
            title.target = "_blank";
            title.rel = "noopener noreferrer";
          }
          card.append(title, el("p", "", p.description));
          grid.append(card);
        });
        preview.append(grid);
      }
      if (state.links.length) {
        const links = el("p", "readme-social");
        state.links.forEach((p) => {
          const a = el("a", "", p.label + " ↗");
          a.href = p.url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          links.append(a);
        });
        preview.append(links);
      }
      root.PCStudioColorPicker.enhance(container);
    }
    sync();
    render();
    return {
      state: () => state,
      download: () => downloadReadme.click(),
      save: () => {
        onChange(state);
        notify("Черновик обычного профиля сохранён.");
      },
    };
  }
  root.PCStudioReadme = { create };
})(globalThis);
