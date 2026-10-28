# Windows setup assistant

Portable Windows Forms application, targeting the .NET Framework installed on supported Windows 10/11 systems. It embeds the Chromium source package and unsigned Firefox publication package. The current EXE has no publisher signature.

Build with `./build.ps1` from PowerShell. The script uses the Windows .NET Framework C# compiler and verifies package hashes when embedding them. No NuGet packages or external SDK are required. Source code and original snowflake icon are covered by the root MIT license; bundled third-party illustration rights are described in ARTWORK.md.

The program reads registered browser commands and Windows' HTTPS UserChoice association. It never writes registry values or changes the default browser. Browser launches use discovered browser executables and a bounded set of extension-manager, guide and official store destinations. Unknown executables are excluded.

At startup, it can read the fixed public GitHub distribution manifest. Only canonical HTTPS URLs on the listed browser stores are accepted. No executable updates are downloaded. Package extraction checks hashes and paths, uses new files, and preserves altered existing folders. It does not modify browser profiles or install enterprise policies.

Developer checks, with output paths inside a disposable work directory:

```text
WinterProfile-Setup.exe --self-test C:\workspace\helper-tests
WinterProfile-Setup.exe --render-preview C:\workspace\helper-preview.png
```

Self-test mode reads browser registration but never launches browsers, fetches network data, changes Windows associations or writes to browser profiles. It extracts embedded packages only under the explicitly supplied test directory. Preview mode renders a sample window without displaying it or starting browser actions.
