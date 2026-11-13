(function (root) {
  "use strict";
  function start({
    window: win,
    document: doc,
    storage,
    asset,
    routeFor,
    send,
  }) {
    const o = root.PCWinterOptions,
      reduce = win.matchMedia("(prefers-reduced-motion: reduce)");
    let state = o.normalizeState(),
      ready = false,
      dead = false,
      current = null,
      routeKey = "",
      requestId = 0,
      published = null,
      publishedRef = null,
      scheduled = 0,
      reveal = null;
    const login = () => o.loginFor(win.location.pathname.split("/")[1]);
    function clear() {
      if (current) {
        for (const n of current.main.querySelectorAll(
          ".ps-native-reveal,.ps-native-visible",
        ))
          n.classList.remove("ps-native-reveal", "ps-native-visible");
        current.effects.destroy();
        current.components.destroy();
        current.scene.destroy();
        current.view.destroy();
        for (const key of [
          "pcNative",
          "pcMotion",
          "psHideStats",
          "psHideReadme",
          "psHideContributions",
        ])
          delete current.main.dataset[key];
        for (const name of ["--pc-accent", "--pc-font", "--pc-secondary"])
          current.main.style.removeProperty(name);
        current = null;
      }
      reveal?.disconnect();
      reveal = null;
      doc.documentElement.removeAttribute("data-pc-theme");
    }
    function schedule() {
      if (!scheduled && !dead)
        scheduled = win.requestAnimationFrame(() => {
          scheduled = 0;
          sync();
        });
    }
    function lookup(key, name) {
      const id = ++requestId;
      published = null;
      publishedRef = null;
      if (!state.enabled || !state.showPublished) return;
      send({ type: "studio-owner-theme", owner: name })
        .then((result) => {
          if (dead || id !== requestId || routeKey !== key) return;
          published = result?.ok ? result.theme : null;
          publishedRef = result?.ok ? result.ref : null;
          schedule();
        })
        .catch(() => {});
    }
    function sync() {
      if (!ready || dead) return;
      const name = login(),
        route = routeFor(win.location.href),
        key = route ? name : "";
      if (routeKey !== key) {
        clear();
        routeKey = key;
        ++requestId;
        if (key) lookup(key, name);
      }
      const main =
        doc.querySelector("main") || doc.querySelector('[role="main"]');
      if (
        !state.enabled ||
        !route ||
        !main ||
        !main.querySelector(
          ".vcard-names .p-nickname, .vcard-names .vcard-username",
        )
      ) {
        clear();
        return;
      }
      const hasLocal = Object.hasOwn(state.profiles, name),
        source = hasLocal
          ? "local"
          : published
            ? "published"
            : state.styleUnpublished
              ? "fallback"
              : null;
      if (!source) {
        clear();
        return;
      }
      let prefs =
        source === "published"
          ? o.normalize({ ...o.defaults, ...published.theme.appearance })
          : o.effective(state, name);
      prefs.motion = prefs.motion && !reduce.matches;
      if (!current || current.main !== main) {
        clear();
        main.dataset.pcNative = "";
        doc.documentElement.dataset.pcTheme = "native";
        const scene = PCStudioScene.create({
            target: main,
            asset,
            fixed: true,
          }),
          effects = PCWinterEffects.create({
            document: doc,
            main,
            view: null,
            native: true,
            route: "profile",
          }),
          view = PCWinterView.createView({
            document: doc,
            onOpen: () => send({ type: "studio-open" }),
            onRemix: () =>
              send({ type: "studio-open", remix: true, ref: publishedRef }),
            onGallery: () => send({ type: "studio-open", gallery: true }),
          });
        (main.querySelector(".Layout-main") || main).prepend(view.element);
        const components = PCStudioComponents.native({
          main,
          asset,
          login: name,
        });
        current = { main, scene, effects, view, source, components };
        reveal = new win.IntersectionObserver(
          (entries) => {
            for (const e of entries)
              if (e.isIntersecting) e.target.classList.add("ps-native-visible");
          },
          { threshold: 0.06 },
        );
      }
      doc.documentElement.dataset.pcTheme = "native";
      main.dataset.pcMotion = String(prefs.motion);
      main.dataset.psHideStats = String(prefs.hideStats);
      main.dataset.psHideReadme = String(prefs.hideReadme);
      main.dataset.psHideContributions = String(prefs.hideContributions);
      main.style.setProperty("--pc-accent", prefs.accent);
      current.scene.update(prefs);
      current.effects.update(prefs);
      current.components.update(prefs);
      current.view.update({ source, allowRemix: published?.allowRemix });
      for (const n of main.querySelectorAll(
        ".pinned-item-list-item,.js-yearly-contributions,article.markdown-body",
      )) {
        if (prefs.reveal && prefs.motion) {
          n.classList.add("ps-native-reveal");
          reveal.observe(n);
        } else n.classList.remove("ps-native-reveal", "ps-native-visible");
      }
    }
    const observer = new win.MutationObserver((mutations) => {
      if (
        mutations.some((m) => {
          const n = m.target.nodeType === 1 ? m.target : m.target.parentElement;
          return (
            n &&
            !n.closest(
              "#pc-theme-root,.ps-scene,.pc-avatar-frame,.ps-cursor,.ps-cursor-tail,.ps-cursor-trail,[data-ps-component]",
            )
          );
        })
      )
        schedule();
    });
    observer.observe(doc.documentElement, { childList: true, subtree: true });
    const events = ["turbo:load", "turbo:render", "pjax:end", "popstate"];
    events.forEach((e) => win.addEventListener(e, schedule));
    reduce.addEventListener("change", schedule);
    const unsubscribe = storage.subscribe((changes) => {
      const networkChange =
        Object.hasOwn(changes, "showPublished") ||
        Object.hasOwn(changes, "enabled");
      state = o.normalizeState({ ...state, ...changes });
      if (networkChange) {
        published = null;
        ++requestId;
        if (routeKey) lookup(routeKey, login());
      }
      schedule();
    });
    storage
      .get(o.storageKeys)
      .then((v) => {
        state = o.normalizeState(v);
        ready = true;
        schedule();
      })
      .catch(() => {
        ready = true;
        schedule();
      });
    return {
      destroy() {
        dead = true;
        ++requestId;
        if (scheduled) win.cancelAnimationFrame(scheduled);
        observer.disconnect();
        unsubscribe();
        events.forEach((e) => win.removeEventListener(e, schedule));
        reduce.removeEventListener("change", schedule);
        clear();
      },
    };
  }
  root.PCWinterController = { start };
})(globalThis);
