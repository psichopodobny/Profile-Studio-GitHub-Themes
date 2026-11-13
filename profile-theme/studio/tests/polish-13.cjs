// Fresh isolated browser only; no existing user tab/account is attached.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { pathToFileURL } = require("node:url");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    "playwright",
);
const base = path.resolve(__dirname, ".."),
  out = path.join(base, "test-results"),
  ext = path.join(base, "extension");
const checks = [];
async function range(p, id, value) {
  await p.locator("#" + id).evaluate((n, v) => {
    n.value = v;
    n.dispatchEvent(new Event("input", { bubbles: true }));
    n.dispatchEvent(new Event("change", { bubbles: true }));
  }, String(value));
}
async function nav(p, id) {
  await p.locator('[data-section="' + id + '"]').click();
}
async function theme(p) {
  await p.locator("#export-top").click();
  const event = p.waitForEvent("download");
  await p.locator("#download-theme").click();
  const data = JSON.parse(fs.readFileSync(await (await event).path(), "utf8"));
  if (await p.locator("#export-dialog").isVisible())
    await p.locator("#export-dialog .close-dialog").click();
  return data;
}
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1050 },
    deviceScaleFactor: 2,
    acceptDownloads: true,
  });
  const errors = [];
  try {
    const p = await context.newPage();
    p.on("pageerror", (e) => errors.push(e.stack));
    await p.goto(
      pathToFileURL(path.join(ext, "studio.html")).href +
        "?showcase=psichopodobny&mode=extension",
    );
    await p.locator("#settings-search").waitFor({ state: "visible" });
    await p.waitForFunction(
      () => !document.querySelector("#settings-search").disabled,
    );
    await p.waitForFunction(
      () => document.querySelector(".ps-scene-image").naturalWidth === 1672,
    );
    assert.match(
      await p.locator("#preview-about").textContent(),
      /Часть проектов открыта/,
    );
    const geometry = await p.evaluate(() => {
      const c = document.querySelector(".ps-particles"),
        v = document.querySelector("#preview-scroll"),
        l = document.querySelector(".ps-scene");
      return {
        canvas: [c.width, c.height],
        viewport: [v.clientWidth, v.clientHeight],
        layer: l.getBoundingClientRect().height,
        profile: document
          .querySelector("#profile-preview")
          .getBoundingClientRect().height,
      };
    });
    assert(
      Math.abs(geometry.layer - geometry.viewport[1]) < 2,
      "Background is viewport sized, not full content height",
    );
    assert(
      geometry.profile > geometry.layer,
      "Fixture needs scrollable content",
    );
    assert(
      geometry.canvas[1] >= geometry.viewport[1] * 1.95,
      "Sharp device-scale backing canvas",
    );
    const firstTop = await p
      .locator(".ps-scene")
      .evaluate((n) => n.getBoundingClientRect().top);
    await p.locator("#preview-scroll").evaluate((n) => (n.scrollTop = 250));
    await p.waitForTimeout(100);
    assert(
      Math.abs(
        (await p
          .locator(".ps-scene")
          .evaluate((n) => n.getBoundingClientRect().top)) - firstTop,
      ) < 2,
      "Scene stays anchored while content scrolls",
    );
    await p.locator("#preview-scroll").evaluate((n) => (n.scrollTop = 0));
    checks.push(
      "Wide 1672x941 source, viewport-anchored background, retina particle canvas, completed personal profile",
    );

    // Verify an unrelated live update does not zero parallax or restart the weather clock.
    const rect = await p.locator("#preview-scroll").boundingBox();
    await p.mouse.move(rect.x + rect.width * 0.9, rect.y + rect.height * 0.6);
    await p.waitForTimeout(500);
    const beforeTransform = await p
      .locator(".ps-scene-image")
      .evaluate((n) => new DOMMatrix(getComputedStyle(n).transform).m41);
    assert(Math.abs(beforeTransform) > 1, "Parallax has actually moved");
    await nav(p, "type");
    const afterTransform = await p
      .locator(".ps-scene-image")
      .evaluate((n) => new DOMMatrix(getComputedStyle(n).transform).m41);
    assert(
      Math.abs(afterTransform) > 1,
      "Rendering controls preserves current parallax offset",
    );
    checks.push("Opening settings does not snap the scene back to zero");

    await p.locator("#compare-pin").click();
    await nav(p, "background");
    await range(p, "dim", 79);
    assert.equal(await p.locator("#dim").inputValue(), "79");
    const nowShade = await p
      .locator(".ps-scene-shade")
      .evaluate((n) => n.style.background);
    await p.locator("#compare-before").click();
    assert(await p.locator("#comparison-banner").isVisible());
    assert.notEqual(
      await p.locator(".ps-scene-shade").evaluate((n) => n.style.background),
      nowShade,
    );
    assert.equal(
      await p.locator("#dim").inputValue(),
      "79",
      "Inspector retains current draft",
    );
    assert.equal(
      (await theme(p)).appearance.dim,
      79,
      "Export must never contain comparison baseline",
    );
    await p.locator("#compare-current").click();
    assert.equal(
      await p.locator(".ps-scene-shade").evaluate((n) => n.style.background),
      nowShade,
    );
    await p.locator("#compare-before").click();
    await range(p, "dim", 75);
    assert(
      !(await p.locator("#comparison-banner").isVisible()),
      "Editing returns to current preview",
    );
    checks.push(
      "Before/current preview leaves draft and export untouched; editing exits comparison",
    );

    await p.keyboard.press("Control+k");
    await p.locator("#settings-search-query").fill("размытие");
    await p.keyboard.press("Enter");
    assert.equal(
      await p.locator("#section-title").textContent(),
      "Пространство",
    );
    assert(
      await p.locator("#blur").evaluate((n) => document.activeElement === n),
    );
    await p.locator("#settings-search").click();
    await p.locator("#settings-search-query").fill("zzzzzz");
    assert(await p.locator(".search-empty").isVisible());
    await p.keyboard.press("Escape");
    await p.waitForFunction(
      () =>
        document.activeElement === document.querySelector("#settings-search"),
    );
    assert(
      await p
        .locator("#settings-search")
        .evaluate((n) => document.activeElement === n),
    );
    await p.locator("#settings-search").click();
    await p.locator("#settings-search-query").fill("<img onerror=alert(1)>");
    assert.equal(await p.locator("#settings-search-dialog img").count(), 0);
    await p.locator("#settings-search-query").fill("сохранить свой вариант");
    await p.keyboard.press("Enter");
    await p.locator("#variant-name").fill("Night / A");
    await p
      .getByRole("button", { name: "Сохранить сборку", exact: true })
      .click();
    await p.locator(".library-item").waitFor();
    assert.equal(
      await p.locator(".library-item strong").textContent(),
      "Night / A",
    );
    await p.getByRole("button", { name: "Имя", exact: true }).click();
    await p.locator("#variant-name").fill("Winter / B");
    await p.keyboard.press("Escape");
    await p.locator("#variant-dialog").waitFor({ state: "hidden" });
    assert.equal(
      await p.locator(".library-item strong").textContent(),
      "Night / A",
      "Cancel preserves name",
    );
    await p.getByRole("button", { name: "Имя", exact: true }).click();
    await p.locator("#variant-name").fill("Winter / B");
    await p.getByRole("button", { name: "Переименовать", exact: true }).click();
    await p.locator("#variant-dialog").waitFor({ state: "hidden" });
    assert.equal(
      await p.locator(".library-item strong").textContent(),
      "Winter / B",
    );
    checks.push(
      "Search handles keyboard, no results, escaping and direct focus; local variants have editable names and cancel",
    );

    await nav(p, "profile");
    await p.locator("#displayName").fill("My edited profile");
    await p.locator("#displayName").blur();
    await p.waitForFunction(
      () =>
        document.querySelector("#save-status").textContent ===
        "Черновик сохранён",
    );
    await p.reload();
    await p.waitForFunction(
      () => !document.querySelector("#settings-search").disabled,
    );
    assert.equal(
      await p.locator("#preview-name").textContent(),
      "My edited profile",
      "Showcase URL must not reset user edits on reload",
    );
    await nav(p, "sharing");
    assert.equal(
      await p.locator(".library-item strong").textContent(),
      "Winter / B",
    );
    checks.push("Personal showcase edits and named variants survive reload");

    await p.getByRole("tab", { name: "Обычный GitHub", exact: true }).click();
    await p.keyboard.press("Control+k");
    await p.locator("#settings-search-query").fill("Свой курсор");
    await p.keyboard.press("Enter");
    assert(await p.locator("#extension-workspace").isVisible());
    assert.equal(
      await p.locator("#section-title").textContent(),
      "Движение руки",
    );
    await nav(p, "background");
    assert.match(
      await p.locator(".background-guide").textContent(),
      /2560 × 1440/,
    );
    assert.match(
      await p.locator("#background-image-size").textContent(),
      /1672 × 941/,
    );
    await p.screenshot({ path: path.join(out, "studio-polish-13.png") });
    await p.setViewportSize({ width: 390, height: 844 });
    await p.locator("#settings-search").click();
    await p.locator("#settings-search-query").fill("рамка");
    const mobile = await p.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      dialog: document
        .querySelector("#settings-search-dialog")
        .getBoundingClientRect().width,
    }));
    assert(
      mobile.scroll <= mobile.width + 1 && mobile.dialog <= mobile.width,
      "Mobile search has no horizontal overflow",
    );
    await p.screenshot({ path: path.join(out, "search-mobile-13.png") });
    await p.keyboard.press("Escape");
    await p.emulateMedia({ reducedMotion: "reduce" });
    await p.waitForFunction(
      () =>
        document.querySelector("#profile-preview").dataset.psMotion === "false",
    );
    assert.equal(errors.length, 0, errors.join("\n"));
    const result = {
      version: JSON.parse(fs.readFileSync(path.join(ext, "manifest.json")))
        .version,
      checks,
      jsErrors: errors,
      storeSubmitted: false,
    };
    fs.writeFileSync(
      path.join(out, "polish-13-results.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result));
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
