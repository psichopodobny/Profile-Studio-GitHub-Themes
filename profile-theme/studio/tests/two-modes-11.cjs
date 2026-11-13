// Behavioral tests in an isolated Edge profile. No user browser/account is attached.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  { pathToFileURL } = require("node:url");
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE ||
    "playwright",
);
const base = path.resolve(__dirname, ".."),
  ext = path.join(base, "extension"),
  out = path.join(base, "test-results");
const o = require(path.join(ext, "options.js")),
  share = require(path.join(ext, "sharing.js")),
  core = require(path.join(ext, "readme-core.js"));
const url = pathToFileURL(path.join(ext, "studio.html")).href;
async function file(p, trigger) {
  const event = p.waitForEvent("download");
  await trigger();
  return fs.readFileSync(await (await event).path());
}
(async () => {
  const ref = {
    owner: "alice",
    repo: "public-themes",
    file: "profile-studio.json",
  };
  assert.equal(
    share.rawURL(ref),
    "https://raw.githubusercontent.com/alice/public-themes/HEAD/profile-studio.json",
  );
  for (const repo of ["../x", "https://evil.test", "a/b", "..", "."])
    assert.throws(() => share.reference({ ...ref, repo }));
  const body = new URL(
    share.issueURL({ ...ref, name: "Alice" }),
  ).searchParams.get("body");
  const entries = share.entries([
    { state: "open", number: 2, user: { login: "mallory" }, body },
    { state: "open", number: 3, user: { login: "alice" }, body },
  ]);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].repo, "public-themes");
  const injection = core.markdown({
    title: "<script>alert(1)</script>",
    about: "<img src=x onerror=alert(1)>",
    projects: [
      { title: "[x]", description: "a | b", url: "javascript:alert(1)" },
    ],
  });
  assert(!injection.includes("<script>"));
  assert(!injection.includes("javascript:"));
  assert(injection.includes("a \\| b"));
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
      viewport: { width: 1600, height: 1050 },
      acceptDownloads: true,
    }),
    errors = [];
  try {
    const p = await context.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(url + "?showcase=psichopodobny&mode=extension");
    await p.waitForFunction(
      () =>
        document.querySelector("#preview-name").textContent === "psichopodobny",
    );
    await p.screenshot({ path: path.join(out, "personal-profile-11.png") });
    await p.getByRole("tab", { name: "Обычный GitHub", exact: true }).click();
    assert(await p.locator("#readme-workspace").isVisible());
    assert(!(await p.locator("#extension-workspace").isVisible()));
    await p.locator("#basic-login").fill("alice");
    await p.locator("#readme-title").fill("Alice / Studio");
    await p
      .locator("#readme-about")
      .fill("Building useful software.\n\nCode and design.");
    await p.locator("#readme-accent").click();
    await p.locator("#studio-color-dialog").waitFor({ state: "visible" });
    const hueRect = await p.locator("#picker-hue").boundingBox();
    assert(
      hueRect.height >= 180 && hueRect.width <= 30,
      "Hue control must be a visible vertical spectrum",
    );
    await p.locator("#picker-hex").fill("#23aabb");
    assert.equal(await p.locator("#readme-accent").inputValue(), "#23aabb");
    await p.locator("#picker-r").fill("85");
    await p.locator("#picker-g").fill("34");
    await p.locator("#picker-b").fill("178");
    assert.equal(await p.locator("#readme-accent").inputValue(), "#5522b2");
    await p.getByRole("button", { name: "Отмена", exact: true }).click();
    assert.equal(await p.locator("#readme-accent").inputValue(), "#d8dce5");
    await p.locator("#readme-accent").click();
    await p.locator("#picker-hex").fill("#37bda2");
    await p.getByRole("button", { name: "Готово", exact: true }).click();
    await p
      .getByRole("button", { name: "Добавить проект", exact: true })
      .click();
    await p
      .getByLabel("Проект 1: название", { exact: true })
      .fill("Project One");
    await p
      .getByLabel("Проект 1: описание", { exact: true })
      .fill("Useful tools.");
    await p
      .getByLabel("Проект 1: ссылка", { exact: true })
      .fill("https://github.com/alice/tools");
    const md = (
      await file(p, () =>
        p
          .getByRole("button", { name: "Скачать README.md", exact: true })
          .click(),
      )
    ).toString();
    assert(md.includes("Project One"));
    assert(md.includes("https://github.com/alice/tools"));
    assert(md.includes("./profile-studio/banner.svg"));
    const svg = (
      await file(p, () =>
        p.getByRole("button", { name: "Скачать баннер", exact: true }).click(),
      )
    ).toString();
    assert(svg.includes("#37bda2"));
    assert(svg.includes("Alice / Studio"));
    const gif = path.resolve(
      base,
      "tests/fixtures/two-frame.gif",
    );
    await p.locator("#readme-banner-file").setInputFiles(gif);
    await p.waitForFunction(
      () => document.querySelector("#readme-banner").value === "upload",
    );
    const original = await file(p, () =>
      p.getByRole("button", { name: "Скачать баннер", exact: true }).click(),
    );
    assert.deepEqual(original, fs.readFileSync(gif));
    await p.locator("#readme-banner").selectOption("generated");
    await p.screenshot({ path: path.join(out, "readme-mode-11.png") });
    await p.getByRole("tab", { name: "С расширением", exact: true }).click();
    assert.equal(
      await p.locator("#preview-name").textContent(),
      "psichopodobny",
    );
    await p.locator('[data-section="profile"]').click();
    assert(await p.locator("#frameOriginalColors").isChecked());
    await p.locator("#frameAccent").click();
    assert(await p.locator("#frameOriginalColors").isChecked());
    await p.locator("#picker-hex").fill("#ff5e97");
    await p.getByRole("button", { name: "Отмена", exact: true }).click();
    assert(await p.locator("#frameOriginalColors").isChecked());
    await p.locator("#frameAccent").click();
    await p.locator("#picker-hex").fill("#ff5e97");
    await p.getByRole("button", { name: "Готово", exact: true }).click();
    assert.equal(await p.locator("#frameAccent").inputValue(), "#ff5e97");
    assert.equal(await p.locator("#frameOriginalColors").isChecked(), false);
    await p.getByRole("button", { name: "Опубликовать", exact: true }).click();
    await p.locator("#publish-repo").fill("Profile-Studio-GitHub-Themes");
    assert(
      (await p.locator("#publish-path").textContent()).includes(
        "psichopodobny/Profile-Studio-GitHub-Themes/",
      ),
    );
    await p.locator("#publish-repo").fill("../bad");
    assert(await p.locator("#publish-register").isDisabled());
    await p.locator("#publish-repo").fill("Profile-Studio-GitHub-Themes");
    const ownerFile = JSON.parse(
      (await file(p, () => p.locator("#publish-download").click())).toString(),
    );
    assert.equal(ownerFile.owner, "psichopodobny");
    assert.equal(ownerFile.theme.appearance.frameAccent, "#ff5e97");
    assert(
      (await p.locator("#toast").textContent()).includes(
        "psichopodobny/Profile-Studio-GitHub-Themes",
      ),
    );
    await p.locator("#save").click();
    await p.waitForTimeout(700);
    await p.reload();
    await p.getByRole("tab", { name: "Обычный GitHub", exact: true }).click();
    assert.equal(
      await p.locator("#readme-title").inputValue(),
      "Alice / Studio",
    );
    assert.equal(await p.locator("#readme-accent").inputValue(), "#37bda2");
    await p.locator("#readme-accent").click();
    await p.locator("#picker-hex").fill("#000000");
    assert.equal(await p.locator("#readme-accent").inputValue(), "#000000");
    await p.locator("#picker-hex").fill("#ffffff");
    assert.equal(await p.locator("#readme-accent").inputValue(), "#ffffff");
    await p.getByRole("button", { name: "Отмена", exact: true }).click();
    await p.setViewportSize({ width: 390, height: 844 });
    assert(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await p.locator("#readme-accent").click();
    assert(
      await p.locator("#studio-color-dialog").evaluate((n) => {
        const r = n.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth;
      }),
    );
    await p.getByRole("button", { name: "Отмена", exact: true }).click();
    assert.deepEqual(errors, []);
    fs.writeFileSync(
      path.join(out, "two-modes-11-results.json"),
      JSON.stringify(
        {
          version: JSON.parse(
            fs.readFileSync(path.join(ext, "manifest.json"), "utf8"),
          ).version,
          separateDrafts: true,
          readmeAndBannerExport: true,
          uploadedGifByteIdentical: true,
          rgbHexLivePreviewAndCancel: true,
          framePaletteWorks: true,
          alternateRepositoryValidated: true,
          authorRegistrationRejectsImpersonation: true,
          mobileFits: true,
          mozillaSubmitted: false,
        },
        null,
        2,
      ),
    );
    console.log(
      "PASS: two independent modes, README/banner/GIF exports, RGB/HEX/live/revert, frame recolor, repo selection/identity validation, persistence and mobile.",
    );
  } finally {
    await context.close();
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
