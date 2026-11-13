const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const base = path.resolve(__dirname, ".."),
  ext = path.join(base, "extension");
const options = require(path.join(ext, "options.js")),
  sharing = require(path.join(ext, "sharing.js"));
const source = fs.readFileSync(path.join(ext, "background.js"), "utf8");
const payload = sharing.serialize(
  { ...options.defaults, accent: "#22ccaa" },
  { owner: "alice", name: "Alice current" },
);
function issue(owner, repo, number) {
  return {
    state: "open",
    number,
    user: { login: owner },
    body: new URL(
      sharing.issueURL({ owner, repo, name: "Theme " + number }),
    ).searchParams.get("body"),
  };
}
function harness(reply) {
  let listener;
  const calls = [];
  const context = {
    PCWinterOptions: options,
    PCStudioSharing: sharing,
    PCStudioConsent: { granted: async () => true },
    Response,
    URL,
    TextDecoder,
    AbortSignal,
    fetch: async (url, init) => {
      calls.push(String(url));
      assert.equal(init.credentials, "omit");
      assert.equal(init.redirect, "error");
      return reply(String(url));
    },
    browser: {
      runtime: {
        id: "test",
        getURL: (p) => "moz-extension://test/" + p,
        onMessage: {
          addListener: (fn) => {
            listener = fn;
          },
        },
      },
      storage: {
        local: { get: async () => ({ enabled: true, showPublished: true }) },
      },
    },
  };
  vm.runInNewContext(source, context);
  function send(
    message,
    sender = { id: "test", url: "https://github.com/alice" },
  ) {
    return new Promise((resolve) => {
      const handled = listener(message, sender, (value) =>
        resolve(JSON.parse(JSON.stringify(value))),
      );
      if (!handled) resolve(null);
    });
  }
  return { calls, send };
}
(async () => {
  const older = issue("alice", "older-public-theme", 1);
  const newer = Array.from({ length: 100 }, (_, i) =>
    issue("user" + i, "themes", i + 2),
  );
  const paged = harness((url) => {
    if (url.includes("alice/alice/HEAD"))
      return new Response("", { status: 404 });
    if (url.includes("/issues?"))
      return new Response(
        JSON.stringify(
          new URL(url).searchParams.get("creator") === "alice"
            ? [older]
            : newer,
        ),
      );
    if (url.includes("alice/older-public-theme/HEAD"))
      return new Response(payload);
    return new Response("", { status: 404 });
  });
  const result = await paged.send({
    type: "studio-owner-theme",
    owner: "alice",
  });
  assert.equal(result.ok, true);
  assert.equal(result.theme.theme.name, "Alice current");
  assert.equal(result.ref.repo, "older-public-theme");
  assert(paged.calls.some((url) => url.includes("creator=alice")));
  const callsBefore = paged.calls.length;
  await paged.send({ type: "studio-owner-theme", owner: "alice" });
  assert.equal(
    paged.calls.length,
    callsBefore,
    "owner caches should avoid duplicate network work",
  );
  const broken = issue("alice", "broken", 5),
    good = issue("alice", "working", 4);
  const recovery = harness((url) => {
    if (url.includes("/issues?"))
      return new Response(JSON.stringify([broken, broken, good]));
    return new Response(
      url.includes("alice/working/HEAD") ? payload : '{"invalid":true}',
    );
  });
  const recovered = await recovery.send({
    type: "studio-owner-theme",
    owner: "alice",
  });
  assert.equal(recovered.ok, true);
  assert.equal(recovered.ref.repo, "working");
  assert.equal(
    recovery.calls.filter((url) => url.includes("alice/broken/HEAD")).length,
    1,
    "duplicate catalog references must be fetched once",
  );
  const blocked = harness(() => new Response("", { status: 403 }));
  const limited = await blocked.send({
    type: "studio-owner-theme",
    owner: "alice",
  });
  assert.equal(limited.ok, false);
  assert(/ограничил/.test(limited.error));
  assert.equal(
    blocked.calls.length,
    1,
    "rate limits must not trigger extra fallback requests",
  );
  const stranger = harness(() => {
    throw Error("must not fetch");
  });
  assert.equal(
    await stranger.send(
      { type: "studio-owner-theme", owner: "alice" },
      { id: "test", url: "https://github.com/alice/repo" },
    ),
    null,
  );
  assert.equal(
    await stranger.send({ type: "studio-owner-theme", owner: "bob" }),
    null,
  );
  assert.equal(stranger.calls.length, 0);
  const report = {
    version: JSON.parse(fs.readFileSync(path.join(ext, "manifest.json")))
      .version,
    olderThemeBeyondGlobalFirst100: true,
    authorScopedQuery: true,
    ownerCacheReused: true,
    invalidReferencesDoNotHideValidTheme: true,
    duplicateReferencesFetchedOnce: true,
    rateLimitStopsRequests: true,
    repositoryPagesAndWrongOwnersRejected: true,
  };
  fs.writeFileSync(
    path.join(base, "test-results/owner-discovery-12-results.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
