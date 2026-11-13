(function (root) {
  "use strict";
  function element(doc, tag, cls, text) {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function projectCards(container, prefs, { demo = false } = {}) {
    const doc = container.ownerDocument;
    container.className = "ps-project-grid";
    container.dataset.style = prefs.projectsLayout;
    container.style.setProperty("--project-columns", prefs.projectColumns);
    const data = prefs.projects.length
      ? prefs.projects
      : demo
        ? [
            {
              title: "project-one",
              description: "Описание вашего проекта.",
              url: "",
              language: "Язык",
              color: "#929292",
            },
            {
              title: "project-two",
              description: "Ещё один проект или полезная ссылка.",
              url: "",
              language: "Язык",
              color: "#b7b7b7",
            },
          ]
        : [];
    container.replaceChildren();
    for (const project of data) {
      const card = element(doc, "article", "ps-project-card"),
        top = element(doc, "div", "ps-project-top"),
        title = element(
          doc,
          project.url ? "a" : "h4",
          "ps-project-title",
          project.title || "Без названия",
        );
      if (project.url) {
        title.href = project.url;
        title.target = "_blank";
        title.rel = "noopener noreferrer";
        title.title = project.url;
      }
      top.append(
        title,
        element(doc, "span", "ps-project-arrow", project.url ? "↗" : "⌘"),
      );
      card.append(
        top,
        element(
          doc,
          "p",
          "ps-project-description",
          project.description || "Добавьте описание проекта.",
        ),
      );
      const foot = element(doc, "footer");
      if (project.language) {
        const dot = element(doc, "i");
        dot.style.background = project.color;
        foot.append(dot, element(doc, "span", "", project.language));
      }
      if (project.url) {
        const url = new URL(project.url);
        foot.append(element(doc, "small", "", url.hostname));
      }
      card.append(foot);
      container.append(card);
    }
    if (!data.length)
      container.append(
        element(doc, "div", "ps-project-empty", "Карточек пока нет."),
      );
  }
  function miniCard(
    container,
    prefs,
    { login = "username", avatar = PCStudioAvatars.fallback() } = {},
  ) {
    const doc = container.ownerDocument;
    container.className = "ps-mini-card";
    container.dataset.align = prefs.miniAlign;
    container.dataset.cover = String(prefs.miniCover);
    container.replaceChildren();
    const frame = element(doc, "div", "ps-avatar-frame");
    frame.dataset.frame = prefs.frame;
    frame.style.borderRadius =
      prefs.avatarShape === "circle"
        ? "50%"
        : prefs.avatarShape === "square"
          ? "4px"
          : "22%";
    const img = element(doc, "img");
    PCStudioAvatars.set(img, prefs.miniAvatar || prefs.customAvatar || avatar);
    frame.append(img);
    PCStudioFrames.update(frame, prefs);
    const copy = element(doc, "div", "ps-mini-copy");
    copy.append(
      element(doc, "h2", "", prefs.displayName || login),
      element(doc, "p", "ps-mini-login", "@" + login),
    );
    if (prefs.bio) copy.append(element(doc, "p", "ps-mini-bio", prefs.bio));
    if (prefs.miniNote)
      copy.append(element(doc, "p", "ps-mini-note", prefs.miniNote));
    const links = element(doc, "div", "ps-mini-links");
    for (const link of prefs.miniLinks) {
      if (!link.url) continue;
      const a = element(doc, "a", "", link.label || new URL(link.url).hostname);
      a.href = link.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.title = link.url;
      links.append(a);
    }
    copy.append(links);
    container.append(frame, copy);
  }
  function native({ main, asset, login }) {
    const doc = main.ownerDocument;
    let projects = null,
      mini = null,
      previousProjects = "",
      previousMini = "";
    function update(prefs) {
      main.dataset.psLayout = prefs.profileLayout;
      main.dataset.psHideProjects = String(prefs.hideProjects);
      main.dataset.psCustomProjects = String(prefs.useCustomProjects);
      const host = main.querySelector(".Layout-main") || main;
      if (prefs.useCustomProjects && !prefs.hideProjects) {
        if (!projects) {
          projects = element(doc, "section", "ps-custom-projects");
          projects.dataset.psComponent = "projects";
          host.append(projects);
        }
        const key = JSON.stringify([
          prefs.projects,
          prefs.projectsTitle,
          prefs.projectsLayout,
          prefs.projectColumns,
        ]);
        if (key !== previousProjects) {
          previousProjects = key;
          projects.replaceChildren(
            element(
              doc,
              "h3",
              "ps-component-heading",
              prefs.projectsTitle || "Проекты",
            ),
          );
          const grid = element(doc, "div");
          projectCards(grid, prefs);
          projects.append(
            grid,
            element(
              doc,
              "small",
              "ps-component-note",
              "Карточки темы · Profile Studio",
            ),
          );
        }
      } else {
        projects?.remove();
        projects = null;
        previousProjects = "";
      }
      if (prefs.profileLayout === "compact") {
        const originalAvatar =
            main.querySelector(".avatar-user.width-full")?.src ||
            asset("media/avatar.svg"),
          display =
            prefs.displayName ||
            main.querySelector(".vcard-names .p-name")?.textContent ||
            login,
          bio = prefs.bio || main.querySelector(".p-note")?.textContent || "";
        if (!mini) {
          mini = element(doc, "section");
          mini.dataset.psComponent = "mini";
          host.prepend(mini);
        }
        const key = JSON.stringify([
          prefs.customAvatar,
          prefs.miniAvatar,
          originalAvatar,
          display,
          bio,
          prefs.miniNote,
          prefs.miniLinks,
          prefs.miniAlign,
          prefs.miniCover,
          prefs.frame,
          prefs.avatarShape,
        ]);
        if (key !== previousMini) {
          previousMini = key;
          miniCard(
            mini,
            { ...prefs, displayName: display, bio },
            { login, avatar: originalAvatar },
          );
        }
        mini
          .querySelectorAll(".ps-avatar-frame")
          .forEach((n) => PCStudioFrames.update(n, prefs));
      } else {
        mini?.remove();
        mini = null;
        previousMini = "";
      }
    }
    return {
      update,
      destroy() {
        projects?.remove();
        mini?.remove();
        for (const key of ["psLayout", "psHideProjects", "psCustomProjects"])
          delete main.dataset[key];
      },
    };
  }
  root.PCStudioComponents = { projectCards, miniCard, native };
})(globalThis);
