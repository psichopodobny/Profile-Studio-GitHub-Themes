// Runs only in fresh automated browser profiles. Never attaches to the user's browser.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  { pathToFileURL } = require("node:url");
const { chromium, firefox } = require(
  process.env.PLAYWRIGHT_MODULE ||
    "playwright",
);
const base = path.resolve(__dirname, ".."),
  ext = path.join(base, "extension"),
  out = path.join(base, "test-results"),
  o = require(path.join(ext, "options.js")),
  presets = require(path.join(ext, "presets.js")),
  share = require(path.join(ext, "sharing.js")),
  checks = [];
fs.mkdirSync(out, { recursive: true });
const pageURL = pathToFileURL(path.join(ext, "studio.html")).href;
const wait = async (page, fn) => page.waitForFunction(fn);
async function nav(p, name) {
  await p.locator('[data-section="' + name + '"]').click();
}
async function input(p, id, value) {
  await p.locator("#" + id).evaluate((n, v) => {
    n.value = String(v);
    n.dispatchEvent(new Event("input", { bubbles: true }));
    n.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
async function local(browserType, label) {
  const browser = await browserType.launch({
      headless: true,
      ...(browserType === chromium
        ? { channel: process.env.STUDIO_TEST_CHANNEL || "msedge" }
        : {}),
    }),
    context = await browser.newContext({
      viewport: { width: 1600, height: 1000 },
      acceptDownloads: true,
    }),
    errors = [];
  context.setDefaultTimeout(12000);
  context.on("page", (p) => p.on("pageerror", (e) => errors.push(e.message)));
  try {
    const p = await context.newPage();
    await p.goto(pageURL);
    await p.locator('[data-preset="ruby"]').waitFor();
    assert.equal(await p.locator("[data-preset]").count(), 20);
    await p.screenshot({ path: path.join(out, label + "-winter.png") });
    await nav(p, "interface");
    const profileAccent = await p
      .locator("#profile-preview")
      .evaluate((n) => n.style.getPropertyValue("--ps-accent"));
    await p.locator('[data-skin="autumn"]').click();
    assert.equal(await p.locator("html").getAttribute("data-ui"), "autumn");
    assert.equal(
      await p
        .locator("#profile-preview")
        .evaluate((n) => n.style.getPropertyValue("--ps-accent")),
      profileAccent,
    );
    assert.equal(await p.locator("[data-skin]").count(), 20);
    await p.screenshot({ path: path.join(out, label + "-autumn.png") });
    await nav(p, "background");
    await input(p, "blur", 50);
    await input(p, "dim", 63);
    assert.equal(
      await p.locator(".ps-scene-image").evaluate((n) => n.style.filter),
      "blur(16px)",
    );
    assert.equal(await p.locator("#blur-value").textContent(), "50%");
    const chooser = p.waitForEvent("filechooser");
    await p
      .getByRole("button", { name: "Загрузить изображение", exact: false })
      .click();
    await (await chooser).setFiles(path.join(ext, "media/winter-lake.png"));
    await wait(
      p,
      () => document.querySelector("#background").value === "custom",
    );
    await p
      .getByRole("button", { name: "Подобрать цвета из фона", exact: true })
      .click();
    await nav(p, "cursor");
    await p.locator('[data-option-value="ring"]').click();
    await p.locator("#cursorTrail").check();
    await p.locator("#profile-preview").hover({ position: { x: 200, y: 100 } });
    assert.match(
      await p
        .locator("#profile-preview")
        .evaluate((n) => getComputedStyle(n).cursor),
      /^url\(/,
    );
    await p.locator('[data-section="type"]').hover();
    await wait(p, () =>
      document.querySelector(".ps-cursor-trail").hasAttribute("hidden"),
    );
    await nav(p, "profile");
    await p.locator("#displayName").fill("Custom Studio");
    await p.locator("#bio").fill("<script>plain text</script>");
    assert.equal(
      await p.locator("#preview-bio").textContent(),
      "<script>plain text</script>",
    );
    assert.equal(await p.locator("#profile-preview script").count(), 0);
    await p
      .locator("#font-file")
      .setInputFiles(
        process.env.TEST_FONT_PATH || "C:/Windows/Fonts/consola.ttf",
      );
    await wait(p, () =>
      [...document.fonts].some(
        (f) => f.family === "WinterUploaded" && f.status === "loaded",
      ),
    );
    await nav(p, "sharing");
    await p
      .getByRole("button", { name: "Сохранить текущую сборку", exact: true })
      .click();
    await p.locator("#variant-name").fill("Studio regression");
    await p
      .getByRole("button", { name: "Сохранить сборку", exact: true })
      .click();
    await p.locator(".library-item").waitFor();
    assert.equal(await p.locator(".library-item").count(), 1);
    await p.locator("#save").click();
    await p.reload();
    await p.locator('[data-preset="ruby"]').waitFor();
    assert.equal(await p.locator("html").getAttribute("data-ui"), "autumn");
    assert.equal(
      await p.locator("#preview-name").textContent(),
      "Custom Studio",
    );
    assert.match(
      await p.locator(".ps-scene-image").getAttribute("src"),
      /^data:image\/webp/,
    );
    await p.locator("#export-top").click();
    const download = p.waitForEvent("download");
    await p.locator("#download-theme").click();
    const saved = await download,
      file = path.join(out, label + "-theme.json");
    await saved.saveAs(file);
    const exported = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.equal(exported.version, 3);
    assert.ok(!Object.hasOwn(exported.appearance, "bio"));
    assert.ok(!Object.hasOwn(exported.appearance, "ui"));
    assert.ok(o.parseTheme(fs.readFileSync(file, "utf8")));
    await nav(p, "sharing");
    const before = await p.locator("#preview-name").textContent();
    await p.locator("#import-file").setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "winter-profile-theme",
          version: 3,
          appearance: { css: "body{display:none}" },
        }),
      ),
    });
    await wait(p, () =>
      document.getElementById("toast").classList.contains("error"),
    );
    assert.equal(await p.locator("#preview-name").textContent(), before);
    await p.locator("#import-file").setInputFiles({
      name: "old.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          format: "winter-profile-theme",
          version: 1,
          name: "Legacy",
          appearance: { accent: "#abcdef", font: "mono" },
        }),
      ),
    });
    await wait(
      p,
      () =>
        document
          .querySelector("#profile-preview")
          .style.getPropertyValue("--ps-accent") === "#abcdef",
    );
    await p.locator("#undo").click();
    assert.notEqual(
      await p
        .locator("#profile-preview")
        .evaluate((n) => n.style.getPropertyValue("--ps-accent")),
      "#abcdef",
    );
    await context.addInitScript(() => {});
    await p.emulateMedia({ reducedMotion: "reduce" });
    await wait(
      p,
      () =>
        document.querySelector("#profile-preview").dataset.psMotion === "false",
    );
    await p.setViewportSize({ width: 390, height: 844 });
    await nav(p, "background");
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await p.screenshot({
      path: path.join(out, label + "-mobile.png"),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    checks.push(
      label +
        ": 20 profile themes / 20 independent editor skins, blur %, image palette, cursor/trail, text safety, uploaded font, library, persistence, v1 import, v3 export privacy, rejection without mutation, undo, reduced motion, mobile",
    );
  } finally {
    await browser.close();
  }
}
async function extension() {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "profile-studio14-")),
    context = await chromium.launchPersistentContext(temp, {
      channel: process.env.STUDIO_TEST_CHANNEL || "msedge",
      headless: true,
      viewport: { width: 1450, height: 950 },
      args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
    }),
    errors = [];
  context.on("page", (p) => p.on("pageerror", (e) => errors.push(e.message)));
  try {
    let worker =
      context.serviceWorkers()[0] ||
      (await context.waitForEvent("serviceworker"));
    const origin = worker.url().split("/").slice(0, 3).join("/");
    const avatar =
      "data:image/png;base64," +
      fs
        .readFileSync(path.join(ext, "media/profile-avatar.png"))
        .toString("base64");
    const fixture = (login) =>
      '<!doctype html><html><head><meta charset="utf-8"><style>body{font:14px Arial;background:#fff;color:#000;margin:0}header{padding:20px}main{padding:30px;min-height:170vh}.avatar-user{width:170px;height:170px}.Layout-main{margin-left:230px}article{padding:30px}.pinned-item-list-item{padding:20px}</style></head><body><header>Native GitHub</header><main><aside><img class="avatar-user width-full" src="' +
      avatar +
      '" srcset=""><div class="vcard-names"><span class="p-name">Original Name</span><span class="p-nickname">' +
      login +
      '</span></div><div class="p-note"><b>Original bio</b></div></aside><div class="Layout-main"><article class="markdown-body"><h1>Original README</h1><button id="retained">Original listener</button></article><a id="repo" href="/' +
      login +
      '/project">Real project</a><div class="pinned-item-list-item">Repository</div><div class="js-yearly-contributions">Contributions</div></div></main></body></html>';
    let currentLogin = "alice";
    await context.route("https://github.com/**", (r) =>
      r.fulfill({
        contentType: "text/html; charset=utf-8",
        body:
          currentLogin === "charlie"
            ? fixture(currentLogin).replace(/<article[\s\S]*?<\/article>/, "")
            : fixture(currentLogin),
      }),
    );
    const p = await context.newPage();
    await p.goto("https://github.com/alice");
    await p.locator(".p-nickname").waitFor();
    assert.equal(await p.locator("#pc-theme-root").count(), 0);
    const editor = await context.newPage();
    await editor.goto(origin + "/studio.html?profile=alice");
    await editor.locator('[data-preset="neon"]').click();
    await nav(editor, "profile");
    await editor.locator("#displayName").fill("Alice Local");
    await editor.locator("#bio").fill("Local bio");
    await editor.locator("#about").fill("<img src=x onerror=alert(1)>");
    await editor.locator("#save").click();
    await p.waitForFunction(
      () => document.querySelector(".p-name").textContent === "Alice Local",
    );
    assert.equal(
      await p.locator("article.markdown-body").textContent(),
      "<img src=x onerror=alert(1)>",
    );
    assert.equal(await p.locator("article.markdown-body img").count(), 0);
    assert.equal(
      await p.locator("#repo").getAttribute("href"),
      "/alice/project",
    );
    assert.equal(await p.locator(".ps-scene").count(), 1);
    await nav(editor, "background");
    await editor.locator("#background").selectOption("forest");
    await editor.locator("#save").click();
    await p.waitForFunction(() => document.querySelector(".ps-scene-image")?.naturalWidth === 1672);
    await nav(editor, "profile");
    assert.equal(
      await p.locator("#pc-theme-root img.brand").getAttribute("src"),
      "data:image/png;base64," +
        fs
          .readFileSync(path.join(ext, "media/icon-128.png"))
          .toString("base64"),
    );
    const popup = await context.newPage();
    await popup.goto(origin + "/popup.html");
    await popup.locator(".brand-logo").waitFor();
    assert.equal(await popup.locator("#status").textContent(), "");
    assert.equal(
      await popup
        .locator(".brand-logo")
        .evaluate((n) => n.complete && n.naturalWidth),
      128,
    );
    await popup.close();
    await editor.locator("#frame").selectOption("ghost");
    const avatarChooser = editor.waitForEvent("filechooser");
    await editor
      .getByRole("button", { name: "Своя аватарка", exact: false })
      .click();
    await (await avatarChooser).setFiles(path.join(ext, "media/icon-128.png"));
    await editor.waitForFunction(() =>
      document
        .querySelector("#preview-avatar")
        .src.startsWith("data:image/webp;"),
    );
    await nav(editor, "type");
    await editor.locator("#font").selectOption("jetbrains");
    await editor.locator("#save").click();
    await p.waitForFunction(() =>
      document.querySelector(".avatar-user").src.startsWith("data:image/webp;"),
    );
    await p.waitForFunction(() =>
      [...document.fonts].some(
        (f) => f.family === "StudioJetBrainsMono" && f.status === "loaded",
      ),
    );
    assert.equal(await p.locator(".pc-avatar-frame svg").count(), 1);
    assert.equal(
      await p
        .locator(".pc-avatar-frame")
        .evaluate((n) => getComputedStyle(n).maskImage),
      "none",
    );
    await nav(editor, "cursor");
    await editor.locator('[data-option-value="crosshair"]').click();
    await editor.locator("#save").click();
    await p.waitForFunction(
      () => document.querySelector("main").dataset.psCursor === "crosshair",
    );
    await nav(editor, "projects");
    await editor.locator("#add-project").click();
    await editor
      .locator(".project-editor")
      .first()
      .getByLabel("Название проекта", { exact: true })
      .fill("Local pinned card");
    await editor
      .locator(".project-editor")
      .first()
      .getByLabel("Ссылка проекта", { exact: true })
      .fill("https://github.com/alice/project");
    await nav(editor, "mini");
    await editor.locator("#profileLayout").selectOption("compact");
    await editor.locator("#miniAlign").selectOption("center");
    await editor.locator("#miniNote").fill("Local compact profile");
    await editor.locator("#save").click();
    await p.locator(".ps-custom-projects .ps-project-title").waitFor();
    assert.equal(
      await p.locator(".ps-custom-projects .ps-project-title").textContent(),
      "Local pinned card",
    );
    assert.equal(
      await p.locator(".ps-mini-card h2").textContent(),
      "Alice Local",
    );
    assert.equal(await p.locator(".pinned-item-list-item").isVisible(), false);
    assert.equal(
      await p
        .locator(".ps-mini-card")
        .evaluate((n) => getComputedStyle(n).flexDirection),
      "column",
    );
    currentLogin = "bob";
    const other = await context.newPage();
    await other.goto("https://github.com/bob");
    await other.locator(".p-name").waitFor();
    assert.equal(await other.locator(".p-name").textContent(), "Original Name");
    assert.equal(await other.locator("#pc-theme-root").count(), 0);
    // Preserve the actual original DOM object when restoring; not merely its HTML.
    await editor.evaluate(() => chrome.storage.local.set({ enabled: false }));
    await p.locator("#pc-theme-root").waitFor({ state: "detached" });
    assert.equal(await p.locator(".avatar-user").getAttribute("src"), avatar);
    assert.equal(await p.locator("#retained").count(), 1);
    await p.locator("#retained").evaluate((n) => {
      window.clicked = 0;
      n.addEventListener("click", () => window.clicked++);
    });
    await editor.evaluate(() => chrome.storage.local.set({ enabled: true }));
    await p.locator("#pc-theme-root").waitFor();
    await editor.evaluate(() => chrome.storage.local.set({ enabled: false }));
    await p.locator("#pc-theme-root").waitFor({ state: "detached" });
    await p.locator("#retained").click();
    assert.equal(await p.evaluate(() => window.clicked), 1);
    assert.equal(
      await p
        .locator(
          ".ps-cursor,.ps-cursor-tail,.ps-cursor-trail,.pc-avatar-frame,.ps-scene,.ps-custom-projects,.ps-mini-card",
        )
        .count(),
      0,
    );
    assert.equal(await p.locator(".avatar-user").getAttribute("srcset"), "");
    // Online owner themes are requested only after an explicit opt-in.
    // This test stubs just the worker's HTTP transport; the content/worker message boundary remains real.
    const payload = share.serialize(
      { ...o.defaults, accent: "#77ddcc", bio: "Published Bob" },
      { owner: "bob", name: "Bob Theme", includePersonal: true },
    );
    await worker.evaluate((payload) => {
      globalThis.fetch = async () =>
        new Response(payload, {
          headers: { "Content-Type": "application/json" },
        });
    }, payload);
    await editor.evaluate(() =>
      chrome.storage.local.set({ enabled: true, showPublished: true }),
    );
    await other.reload();
    await other.waitForFunction(
      () => document.querySelector(".p-note").textContent === "Published Bob",
    );
    assert.equal(
      await other
        .locator("main")
        .evaluate((n) => n.style.getPropertyValue("--ps-accent")),
      "#77ddcc",
    );
    // The profile itself can be themed without a profile README or a same-name repository.
    const charliePayload = share.serialize(
      {
        ...o.defaults,
        accent: "#dfa7ef",
        bio: "Published without README",
        frame: "ghost",
      },
      { owner: "charlie", name: "Charlie Theme", includePersonal: true },
    );
    const charlieIssue = {
      state: "open",
      number: 14,
      user: { login: "charlie" },
      body: new URL(
        share.issueURL({
          owner: "charlie",
          repo: "my-public-themes",
          name: "Charlie Theme",
        }),
      ).searchParams.get("body"),
    };
    await worker.evaluate(
      ({ payload, issue }) => {
        globalThis.fetch = async (url) => {
          if (String(url).includes("charlie/charlie/HEAD"))
            return new Response("", { status: 404 });
          if (String(url).includes("/issues?"))
            return new Response(JSON.stringify([issue]));
          if (String(url).includes("charlie/my-public-themes/HEAD"))
            return new Response(payload);
          return new Response("", { status: 404 });
        };
      },
      { payload: charliePayload, issue: charlieIssue },
    );
    currentLogin = "charlie";
    await other.goto("https://github.com/charlie");
    await other.waitForFunction(
      () =>
        document.querySelector(".p-note").textContent ===
        "Published without README",
    );
    assert.equal(await other.locator("article.markdown-body").count(), 0);
    assert.equal(
      await other
        .locator("main")
        .evaluate((n) => n.style.getPropertyValue("--ps-accent")),
      "#dfa7ef",
    );
    const remixPageEvent = context.waitForEvent("page");
    await other.getByRole("button", { name: "Ремикс ↗", exact: true }).click();
    const remixEditor = await remixPageEvent;
    await remixEditor.waitForURL(/studio.html\?remix=charlie/);
    assert(
      new URL(remixEditor.url()).searchParams.get("repo") ===
        "my-public-themes",
    );
    await remixEditor.close();
    await other.goto("https://github.com/bob/project");
    assert.equal(await other.locator("#pc-theme-root").count(), 0);
    assert.deepEqual(errors, []);
    checks.push(
      "Real Chromium MV3: profile-scoped save, native links preserved, safe plain text, cursor, opt-in owner theme through worker, repository routes excluded, disable restores DOM/listeners/avatar and removes all effects",
    );
    checks.push(
      "Owner theme from an existing differently named repository: verified author registry, no README required, published styling and correct remix source",
    );
  } finally {
    await context.close();
  }
}
(async () => {
  for (const p of presets)
    assert.ok(
      o.parseTheme(
        o.serializeTheme({ ...o.defaults, ...p.appearance }, { name: p.name }),
      ),
    );
  assert.throws(() =>
    share.parse(
      share.serialize(o.defaults, { owner: "alice", name: "x" }),
      "bob",
    ),
  );
  for (const file of [
    "../x.json",
    "https://evil.test/x",
    "profile-studio-themes/../x.json",
  ])
    assert.throws(() => share.reference({ owner: "alice", file }));
  assert.throws(() =>
    o.appearanceChanges({}, null, { displayName: "Private" }),
  );
  checks.push(
    "Schema: all presets round-trip; owner identity/path validation; global personal-text isolation",
  );
  await local(chromium, "chromium");
  try {
    await local(firefox, "firefox");
  } catch (error) {
    if (!/spawn UNKNOWN|Executable doesn.t exist/.test(String(error.message)))
      throw error;
    checks.push(
      "Bundled Playwright Firefox is unavailable to this suite. Installed Firefox is checked separately by tests/firefox-runtime-12.cjs.",
    );
  }
  await extension();
  fs.writeFileSync(
    path.join(out, "results.json"),
    JSON.stringify(
      {
        version:
          JSON.parse(fs.readFileSync(path.join(ext, "manifest.json"), "utf8"))
            .version + "-review",
        date: new Date().toISOString(),
        checks,
        published: false,
        firefoxExtensionRuntime:
          "Not exercised by this suite; installed Firefox evidence is in firefox-runtime-12-results.json. This suite tests actual MV3 in isolated Edge Chromium.",
      },
      null,
      2,
    ),
  );
  console.log(checks.join("\n"));
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
