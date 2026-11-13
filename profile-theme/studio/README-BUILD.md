# Build and validation / 1.5.4 public sources

Python 3.10+ with its standard library is sufficient: run `python build.py` from this directory. There is no transpiler, minifier, network download, signing, registry access or external publishing step. The build embeds packaged images/fonts, generates branding/frame catalog JavaScript and writes Chromium, Firefox, HTML and source ZIPs. Existing 1.3 archives are historical and are not overwritten.

The original Steam reference APNG binaries are excluded. `extension/media/frames/catalog.json` is empty in public sources. Procedural SVG designs and custom PNG/APNG upload remain available. Never imply that the public build contains the separate local reference collection.

UI tests require Node24+ and Playwright with installed Edge. Set `PLAYWRIGHT_MODULE` to your local Playwright module and `STUDIO_NODE_MODULES` to the parent node_modules directory where needed. No test attaches to an existing user browser profile.

```powershell
node tests/review.cjs
node tests/two-modes-11.cjs
node tests/owner-discovery-12.cjs
node tests/polish-13.cjs
```

Installed Firefox test: `node tests/firefox-runtime-12.cjs`. Requires official Firefox, Mozilla geckodriver 0.37.1 and Sharp. Set `FIREFOX_BINARY`, `GECKODRIVER` and `STUDIO_NODE_MODULES` for your environment. The driver archive is https://github.com/mozilla/geckodriver/releases/download/v0.37.1/geckodriver-v0.37.1-win64.zip ; verified SHA256 dfed9315abe8d2fbc1b6161a2ee8002452e79cf05ee92fdc653a4e26bc35edd8. The driver is not shipped in the repository.

The Firefox test uses a fresh headless profile, temporary extension and standard WebDriver BiDi fixtures on controlled GitHub HTTPS routes. Its allow-system-access flag applies only to that isolated test session. It checks editor/HEX/cancel, before/current comparison, search, local named variants, a packaged background on GitHub, frame motion and native-page restoration. It makes no account changes. Real online owner loading after the user grants Firefox browsingActivity is not exercised; pre-consent blocking is checked.

Validate the generated Firefox directory using `web-ext lint --source-dir firefox --warnings-as-errors`. The public verification report records exact source/build hashes and completed checks. A successful lint is not Mozilla approval. The generated Firefox ZIP is unsigned.

Rebuilding from the generated source ZIP must produce the same four ZIP hashes. Bundled font licenses are retained under extension/media/fonts. The forest WebP bytes are already included; regeneration through image_gen is not a build dependency. The generation prompt records the requested 2560×1440 target and actual 1672×941 output.
