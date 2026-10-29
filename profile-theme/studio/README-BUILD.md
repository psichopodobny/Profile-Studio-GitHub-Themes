# Reproduce the Firefox Studio preview

This is source for Winter Profile Studio 1.3.0, a separate preview release. It does not replace the frozen 1.2.0 submission.

Requirements: Python 3.9+ and Node.js 24+ available on PATH. Tested on Windows 11 with Python 3.12 and Node 24.22.1. The Python build uses only the standard library. Node evaluates the local preset definitions; it uses only built-in modules. No npm packages, network requests, minification, bundling or transpilation are used by this build.

Run from the extracted source directory:

```text
python build.py
```

Outputs are `firefox/`, individual theme JSON files in `packs/`, and ZIP files in `dist/`. Firefox source is copied from `extension/` with only the Firefox manifest settings added. `expected-firefox.json` lists the SHA-256 of every file in the submitted Firefox package. Compare uncompressed file bytes; ZIP metadata can differ.

All JavaScript, CSS, HTML and media are included. Local image/font uploads and text edits are stored in browser.storage.local. There are no analytics, remote code or data uploads. Imported JSON is schema-validated. Custom fonts use binary FontFace data; personal content is rendered with textContent.

The optional Windows helper is built separately from windows-helper/build.ps1 using the Windows .NET Framework compiler after this Python build. It is not part of the Firefox extension and is not required to reproduce it.

Third-party artwork and original references: extension/ARTWORK.md. The MIT code license does not license third-party illustrations.
