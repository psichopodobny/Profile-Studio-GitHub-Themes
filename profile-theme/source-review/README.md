# Winter Profile 1.2.0: Mozilla source submission

This source archive corresponds to `psichopodobny-winter-firefox-v1.2.0-unsigned.zip` submitted to AMO. The add-on ID is `winter-profile@psichopodobny`.

## Environment and build

Requires Node.js 24.14.0 or later. The build was verified with Node.js 24.22.1 on Windows. The script uses only Node.js built-in modules and is portable to Linux/macOS, including the default Mozilla reviewer environment. No npm packages, lockfile, network access, private dependencies, credentials or proprietary tools are needed.

From the extracted source archive directory, run:

```sh
node build.cjs
```

The build writes the exact extension file contents to `dist/firefox` and automatically compares the names and SHA-256 hashes of every output file with `expected-files.json`. Successful output reports that all 22 files match the submitted Firefox 1.2.0 package byte for byte.

If Node.js is not present, install it from https://nodejs.org/en/download before running the command. The default Mozilla review environment already provides a suitable Node.js version.

## Source layout and processing

`src/` contains the complete, readable cross-browser JavaScript, CSS, HTML, manifest and all packaged binary image assets. Nothing is fetched during the build. There is no minification, obfuscation, transpilation, concatenation or bundling of executable code.

The custom browser-adaptation script adds Firefox manifest identity, version requirements and host permissions; ensures the Firefox browser API namespace is used; replaces one scroll behavior string with `auto`; and writes the Firefox-specific installation text. This preprocessing step is why the submission includes source code. The final extension's JavaScript is also readable directly inside the submitted package.

The ZIP container originally came from Windows Compress-Archive. ZIP order, compression settings and timestamps are not part of the source comparison: all uncompressed filenames and file bytes must match, and the build verifies them.

For a separate comparison with the uploaded ZIP, optional Python 3.9+ can be used:

```sh
python verify-package.py /path/to/psichopodobny-winter-firefox-v1.2.0-unsigned.zip
```

This compares `dist/firefox` with each uncompressed ZIP entry. No Python dependencies are required.

The Windows EXE helper is a separate application and is not part of this add-on or source submission. Third-party artwork attribution and license scope are included in `src/ARTWORK.md` and `src/LICENSE`.
