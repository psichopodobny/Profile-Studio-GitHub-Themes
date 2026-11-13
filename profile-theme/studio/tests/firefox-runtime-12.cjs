// Tests only a fresh, headless Firefox session. Does not attach to any user window/profile.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  net = require("node:net"),
  { spawn, execFileSync } = require("node:child_process");
const sharp = require(
  path.join(
    process.env.STUDIO_NODE_MODULES ||
      path.resolve("node_modules"),
    "sharp",
  ),
);
const root = path.resolve(__dirname, ".."),
  workspace = path.resolve(root, "../.."),
  tools = path.join(workspace, "work/firefox12-tools"),
  out = path.join(root, "test-results");
const firefox =
  process.env.FIREFOX_BINARY ||
  "";
const gecko = process.env.GECKODRIVER || path.join(tools, "geckodriver.exe");
const uuid = "d0c05e12-1111-4444-8888-111111111111",
  addonId = "winter-profile@psichopodobny";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
async function freePort() {
  const s = net.createServer();
  await new Promise((r) => s.listen(0, "127.0.0.1", r));
  const p = s.address().port;
  await new Promise((r) => s.close(r));
  return p;
}
class Bidi {
  constructor(ws) {
    this.ws = ws;
    this.sequence = 0;
    this.pending = new Map();
    this.handlers = new Map();
    this.errors = [];
    ws.addEventListener("message", (event) => {
      const v = JSON.parse(event.data);
      if (v.id) {
        const p = this.pending.get(v.id);
        if (p) {
          this.pending.delete(v.id);
          clearTimeout(p.timer);
          v.type === "error" ? p.reject(Error(v.message)) : p.resolve(v.result);
        }
      } else
        for (const handler of this.handlers.get(v.method) || [])
          Promise.resolve(handler(v.params)).catch((e) =>
            this.errors.push(e.message),
          );
    });
  }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((r, j) => {
      ws.addEventListener("open", r, { once: true });
      ws.addEventListener("error", j, { once: true });
    });
    return new Bidi(ws);
  }
  call(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(Error("BiDi timeout: " + method));
      }, 15000);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, handler) {
    this.handlers.set(method, [...(this.handlers.get(method) || []), handler]);
  }
  close() {
    this.ws.close();
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(Error("Test session closed"));
    }
    this.pending.clear();
  }
}
(async () => {
  assert(
    fs.existsSync(firefox),
    "Set FIREFOX_BINARY to an installed Firefox executable",
  );
  assert(
    fs.existsSync(gecko),
    "Set GECKODRIVER to the official Mozilla driver",
  );
  fs.mkdirSync(tools, { recursive: true });
  fs.mkdirSync(out, { recursive: true });
  const temp = fs.mkdtempSync(path.join(tools, "runtime-")),
    port = await freePort(),
    base = "http://127.0.0.1:" + port;
  const log = fs.openSync(path.join(temp, "geckodriver.log"), "w"),
    proc = spawn(
      gecko,
      [
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
        "--profile-root",
        temp,
        "--allow-system-access",
      ],
      { stdio: ["ignore", log, log], windowsHide: true },
    );
  let session, bidi;
  async function req(method, url, payload) {
    const r = await fetch(base + url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
        signal: AbortSignal.timeout(55000),
      }),
      v = (await r.json()).value;
    if (!r.ok && v?.error) throw Error(v.error + ": " + v.message);
    return v;
  }
  const js = (script, args = []) =>
    req("POST", "/session/" + session + "/execute/sync", { script, args });
  const asyncJS = (script, args = []) =>
    req("POST", "/session/" + session + "/execute/async", { script, args });
  const navigate = (url) =>
    req("POST", "/session/" + session + "/url", { url });
  const click = (selector) =>
    js(
      'const n=document.querySelector(arguments[0]);if(!n)throw Error("Missing test control: "+arguments[0]);n.click();',
      [selector],
    );
  const input = (selector, value) =>
    js(
      'const n=document.querySelector(arguments[0]);n.value=arguments[1];n.dispatchEvent(new Event("input",{bubbles:true}));n.dispatchEvent(new Event("change",{bubbles:true}));',
      [selector, value],
    );
  async function until(script, label) {
    for (let n = 0; n < 100; n++) {
      if (await js(script)) return;
      await delay(100);
    }
    throw Error("Timed out: " + label);
  }
  const checks = [];
  try {
    for (let i = 0; i < 60; i++) {
      try {
        await req("GET", "/status");
        break;
      } catch (e) {
        if (proc.exitCode !== null) throw e;
        await delay(100);
      }
    }
    const started = await req("POST", "/session", {
      capabilities: {
        alwaysMatch: {
          browserName: "firefox",
          webSocketUrl: true,
          "moz:firefoxOptions": {
            binary: firefox,
            args: ["-headless", "-no-remote"],
            prefs: {
              "extensions.webextensions.uuids": JSON.stringify({
                [addonId]: uuid,
              }),
            },
          },
          timeouts: { pageLoad: 30000, script: 15000, implicit: 0 },
        },
      },
    });
    session = started.sessionId;
    assert(
      path
        .resolve(started.capabilities["moz:profile"])
        .startsWith(path.resolve(temp) + path.sep),
    );
    await req("POST", "/session/" + session + "/window/rect", {
      width: 1600,
      height: 1000,
    });
    bidi = await Bidi.connect(started.capabilities.webSocketUrl);
    const browserLogs = [];
    bidi.on("log.entryAdded", (p) => {
      if (p.type === "javascript" && p.level === "error")
        browserLogs.push(p.text);
    });
    await bidi.call("session.subscribe", { events: ["log.entryAdded"] });
    const zip = path.join(
      root,
      "dist/profile-studio-v" +
        JSON.parse(fs.readFileSync(path.join(root, "extension/manifest.json")))
          .version +
        "-review-firefox-unsigned.zip",
    );
    const installed = await req(
      "POST",
      "/session/" + session + "/moz/addon/install",
      { addon: fs.readFileSync(zip).toString("base64"), temporary: true },
    );
    assert.equal(installed, addonId);
    const origin = "moz-extension://" + uuid;
    await navigate(origin + "/studio.html?profile=octocat");
    await until(
      'return !!document.querySelector("[data-preset]")',
      "extension editor startup",
    );
    assert.equal(
      await js("return browser.runtime.getManifest().version"),
      JSON.parse(fs.readFileSync(path.join(root, "extension/manifest.json")))
        .version,
    );
    await click("#mode-readme");
    await input("#readme-title", "Firefox Profile");
    await click("#readme-accent");
    await input("#picker-hex", "#23aabb");
    assert.equal(
      await js('return document.querySelector("#readme-accent").value'),
      "#23aabb",
    );
    assert(
      await js(
        'const r=document.querySelector("#picker-hue").getBoundingClientRect();return r.height>=180&&r.width<=30;',
      ),
    );
    await click(".picker-actions .secondary");
    assert.equal(
      await js('return document.querySelector("#readme-accent").value'),
      "#d8dce5",
    );
    checks.push(
      "Actual Firefox extension editor: both modes, HEX live preview, vertical hue geometry, cancel",
    );
    await click("#mode-extension");
    await click('[data-section="profile"]');
    await input("#displayName", "Firefox Runtime Check");
    await input("#frame", "ghost");
    await click('[data-section="background"]');
    await input("#background", "forest");
    await until(
      'return !document.querySelector("#settings-search").disabled',
      "new editor tools ready",
    );
    await click("#compare-pin");
    await input("#dim", "52");
    const currentShade = await js(
      'return document.querySelector(".ps-scene-shade").style.background',
    );
    await click("#compare-before");
    assert.notEqual(
      await js(
        'return document.querySelector(".ps-scene-shade").style.background',
      ),
      currentShade,
    );
    assert.equal(await js('return document.querySelector("#dim").value'), "52");
    await click("#compare-current");
    assert.equal(
      await js(
        'return document.querySelector(".ps-scene-shade").style.background',
      ),
      currentShade,
    );
    await click("#settings-search");
    await input("#settings-search-query", "размытие");
    await click('#settings-search-results [role="option"]');
    assert.equal(await js("return document.activeElement.id"), "blur");
    await click("#settings-search");
    await input("#settings-search-query", "сохранить свой вариант");
    await click('#settings-search-results [role="option"]');
    await input("#variant-name", "Firefox saved variant");
    await click('#variant-dialog button[type="submit"]');
    await until(
      'return !document.querySelector("#variant-dialog").open',
      "variant saved in Firefox",
    );
    assert.equal(
      await js(
        'return document.querySelector(".library-item strong").textContent',
      ),
      "Firefox saved variant",
    );
    checks.push(
      "Firefox polish tools: before/current separation, settings search/direct focus and named variant persistence",
    );
    await click("#save");
    // A controlled HTTPS fixture uses production URL matching and content scripts; no GitHub request or write occurs.
    const avatar =
      "data:image/png;base64," +
      fs
        .readFileSync(path.join(root, "extension/media/icon-128.png"))
        .toString("base64");
    bidi.on("network.beforeRequestSent", async (p) => {
      if (!p.isBlocked) return;
      const u = new URL(p.request.url),
        login = u.pathname.split("/")[1] || "octocat";
      const html =
        '<!doctype html><html><head><meta charset="utf-8"><style>body{font:14px Arial;margin:0;background:#fff}main{padding:40px;min-height:150vh}.avatar-user{width:170px;height:170px}.Layout-main{margin-left:240px}.pinned-item-list-item{padding:20px}</style></head><body><main><aside><img class="avatar-user width-full" src="' +
        avatar +
        '"><div class="vcard-names"><span class="p-name">Original Name</span><span class="p-nickname">' +
        login +
        '</span></div><div class="p-note">Original bio</div></aside><div class="Layout-main"><a id="repo" href="/' +
        login +
        '/project">Real repository link</a><div class="pinned-item-list-item">Project card</div></div></main></body></html>';
      await bidi.call("network.provideResponse", {
        request: p.request.request,
        statusCode: 200,
        headers: [
          {
            name: "Content-Type",
            value: { type: "string", value: "text/html; charset=utf-8" },
          },
        ],
        body: { type: "base64", value: Buffer.from(html).toString("base64") },
      });
    });
    await bidi.call("session.subscribe", {
      events: ["network.beforeRequestSent"],
    });
    await bidi.call("network.addIntercept", {
      phases: ["beforeRequestSent"],
      urlPatterns: [
        { type: "pattern", protocol: "https", hostname: "github.com" },
      ],
    });
    await navigate("https://github.com/octocat");
    await until(
      'return document.querySelector(".p-name")?.textContent==="Firefox Runtime Check"',
      "native local theme",
    );
    await until('return document.querySelector(".ps-scene-image")?.naturalWidth===1672', 'packaged wide background available on GitHub');
    assert.equal(
      await js(
        'return document.querySelectorAll("article.markdown-body").length',
      ),
      0,
    );
    assert.equal(
      await js('return document.querySelectorAll(".ps-scene").length'),
      1,
    );
    assert.equal(
      await js(
        'return document.querySelectorAll(".pc-avatar-frame svg").length',
      ),
      1,
    );
    assert.equal(
      await js('return document.querySelector("#repo").getAttribute("href")'),
      "/octocat/project",
    );
    const screenshot = async () =>
      Buffer.from(
        await req("GET", "/session/" + session + "/screenshot"),
        "base64",
      );
    const crop = await js(
      'const r=document.querySelector(".pc-avatar-frame").getBoundingClientRect();return {left:Math.round(r.left),top:Math.round(r.top),width:Math.round(r.width),height:Math.round(r.height)};',
    );
    const first = await sharp(await screenshot())
      .extract(crop)
      .raw()
      .toBuffer();
    await delay(280);
    const second = await sharp(await screenshot())
      .extract(crop)
      .raw()
      .toBuffer();
    let changed = 0;
    for (let i = 0; i < first.length; i++)
      if (Math.abs(first[i] - second[i]) > 3) changed++;
    assert(changed > 20, "The frame must change pixels in Firefox");
    fs.writeFileSync(
      path.join(out, "firefox-native-12.png"),
      Buffer.from(
        await req("GET", "/session/" + session + "/screenshot"),
        "base64",
      ),
    );
    checks.push(
      "Production Firefox content script: profile-scoped native theming without README, packaged background loaded, animated frame changes rendered pixels, preserved repository link",
    );
    const nativeHandle = await req("GET", "/session/" + session + "/window");
    await js('window.__retainedLink=document.querySelector("#repo");');
    const bobTab = await req("POST", "/session/" + session + "/window/new", {
      type: "tab",
    });
    await req("POST", "/session/" + session + "/window", {
      handle: bobTab.handle,
    });
    await navigate("https://github.com/bob");
    await until(
      'return !!document.querySelector(".p-nickname")',
      "other profile",
    );
    assert.equal(
      await js('return document.querySelectorAll("#pc-theme-root").length'),
      0,
    );
    await req("DELETE", "/session/" + session + "/window");
    await req("POST", "/session/" + session + "/window", {
      handle: nativeHandle,
    });
    const controlTab = await req(
      "POST",
      "/session/" + session + "/window/new",
      { type: "tab" },
    );
    await req("POST", "/session/" + session + "/window", {
      handle: controlTab.handle,
    });
    await navigate(origin + "/studio.html?profile=octocat");
    await until(
      'return !!document.querySelector("[data-preset]")',
      "editor revisit",
    );
    const consent = await asyncJS(
      "const done=arguments[arguments.length-1];PCStudioConsent.granted().then(done,e=>done({error:e.message}));",
    );
    assert.equal(consent, false);
    const denied = await asyncJS(
      'const done=arguments[arguments.length-1];browser.runtime.sendMessage({type:"studio-fetch-theme",ref:{owner:"octocat"}}).then(done,e=>done({error:e.message}));',
    );
    assert.equal(denied.ok, false);
    assert(/Разреши/.test(denied.error));
    checks.push(
      "Firefox optional online consent: disabled by default; no permission bypass",
    );
    await asyncJS(
      "const done=arguments[arguments.length-1];browser.storage.local.set({enabled:false}).then(()=>done(true),e=>done({error:e.message}));",
    );
    await req("POST", "/session/" + session + "/window", {
      handle: nativeHandle,
    });
    await until(
      'return !!document.querySelector(".p-name") && !document.querySelector("#pc-theme-root")',
      "disabled native page",
    );
    assert.equal(
      await js('return document.querySelector(".p-name").textContent'),
      "Original Name",
    );
    assert.equal(
      await js(
        'return document.querySelectorAll("#pc-theme-root,.ps-scene,.pc-avatar-frame").length',
      ),
      0,
    );
    assert(
      await js(
        'return window.__retainedLink===document.querySelector("#repo");',
      ),
    );
    checks.push(
      "Unconfigured profiles remain native; disabling removes custom layers in-place and preserves original DOM objects",
    );
    assert.deepEqual(bidi.errors, []);
    assert.deepEqual(browserLogs, []);
    const report = {
      version: JSON.parse(
        fs.readFileSync(path.join(root, "extension/manifest.json")),
      ).version,
      browser: "Firefox " + started.capabilities.browserVersion,
      driver: execFileSync(gecko, ["--version"], {
        windowsHide: true,
        encoding: "utf8",
      })
        .split("\n")[0]
        .trim(),
      isolatedProfile: true,
      network:
        "GitHub HTTPS traffic fulfilled with controlled fixture via standard WebDriver BiDi",
      checks,
      firefoxOwnerOnlineConsentGranted: false,
      firefoxOwnerOnlineLoad: "not exercised; consent gating verified",
      storeSubmitted: false,
    };
    fs.writeFileSync(
      path.join(out, "firefox-runtime-12-results.json"),
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    bidi?.close();
    if (session)
      try {
        await req("DELETE", "/session/" + session);
      } catch (e) {
        console.error("Session cleanup:", e.message);
      }
    if (proc.exitCode === null) proc.kill();
    fs.closeSync(log);
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
