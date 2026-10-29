$ErrorActionPreference = 'Stop'
$taskThemeRoot = Split-Path -Parent $PSScriptRoot
$taskManifest = Get-Content -Raw -LiteralPath (Join-Path $taskThemeRoot 'extension/manifest.json') | ConvertFrom-Json
$taskVersion = $taskManifest.version
$taskChromium = Join-Path $taskThemeRoot ('dist/psichopodobny-winter-v' + $taskVersion + '.zip')
$taskFirefox = Join-Path $taskThemeRoot ('dist/psichopodobny-winter-firefox-v' + $taskVersion + '-unsigned.zip')
$taskChromiumHash = (Get-FileHash -LiteralPath $taskChromium -Algorithm SHA256).Hash.ToLowerInvariant()
$taskFirefoxHash = (Get-FileHash -LiteralPath $taskFirefox -Algorithm SHA256).Hash.ToLowerInvariant()
$taskFramework = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319'
if (-not (Test-Path -LiteralPath (Join-Path $taskFramework 'csc.exe'))) { $taskFramework = Join-Path $env:WINDIR 'Microsoft.NET/Framework/v4.0.30319' }
$taskCompiler = Join-Path $taskFramework 'csc.exe'
$taskOutput = Join-Path $taskThemeRoot 'dist/WinterProfile-Studio-Preview.exe'
$taskGenerated = Join-Path $PSScriptRoot 'BuildInfo.g.cs'
$taskInfo = @"
using System.Reflection;
[assembly: AssemblyTitle("Winter Profile Studio Preview")]
[assembly: AssemblyProduct("Winter Profile")]
[assembly: AssemblyDescription("Browser extension setup assistant")]
[assembly: AssemblyCompany("psichopodobny")]
[assembly: AssemblyVersion("1.3.0.0")]
[assembly: AssemblyFileVersion("1.3.0.0")]
namespace WinterProfile { public static class BuildInfo {
public const string ExtensionVersion = "$taskVersion";
public const string ChromiumSha256 = "$taskChromiumHash";
public const string FirefoxSha256 = "$taskFirefoxHash";
} }
"@
[System.IO.File]::WriteAllText($taskGenerated,$taskInfo)
$taskArguments = @('/nologo','/target:winexe','/platform:anycpu','/optimize+','/codepage:65001',('/out:' + $taskOutput),('/win32icon:' + (Join-Path $PSScriptRoot 'app.ico')),('/win32manifest:' + (Join-Path $PSScriptRoot 'app.manifest')))
foreach ($taskAssembly in @('System.dll','System.Core.dll','System.Drawing.dll','System.Windows.Forms.dll','System.IO.Compression.dll','System.IO.Compression.FileSystem.dll','System.Net.Http.dll','System.Web.Extensions.dll')) { $taskArguments += '/reference:' + (Join-Path $taskFramework $taskAssembly) }
$taskArguments += '/resource:' + $taskChromium + ',WinterProfile.Chromium.zip'
$taskArguments += '/resource:' + $taskFirefox + ',WinterProfile.Firefox.zip'
$taskArguments += '/resource:' + (Join-Path $taskThemeRoot 'browser-installation.json') + ',WinterProfile.Distribution.json'
$taskArguments += '/resource:' + (Join-Path $PSScriptRoot 'app.ico') + ',WinterProfile.Icon.ico'
$taskArguments += @(Join-Path $PSScriptRoot 'Core.cs')
$taskArguments += @(Join-Path $PSScriptRoot 'App.cs')
$taskArguments += @(Join-Path $PSScriptRoot 'SelfTests.cs')
$taskArguments += $taskGenerated
& $taskCompiler @taskArguments
if ($LASTEXITCODE -ne 0) { throw 'Compilation failed' }
Get-Item -LiteralPath $taskOutput | Select-Object Name,Length
