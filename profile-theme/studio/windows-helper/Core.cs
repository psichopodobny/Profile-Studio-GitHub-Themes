using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using Microsoft.Win32;

namespace WinterProfile
{
    public enum BrowserFamily { Firefox, Chromium, Edge, Opera, Unknown }

    public sealed class BrowserInfo
    {
        public string Name;
        public string Executable;
        public BrowserFamily Family;
        public bool IsDefault;
        public override string ToString() { return Name + (IsDefault ? "  • основной в Windows" : ""); }
    }

    public static class BrowserDiscovery
    {
        public static string ParseExecutable(string command)
        {
            if (String.IsNullOrWhiteSpace(command)) return null;
            command = Environment.ExpandEnvironmentVariables(command.Trim());
            Match match = Regex.Match(command, "^(?:\"(?<exe>[^\"]+\\.exe)\"|(?<exe>.+?\\.exe)(?=\\s|$))", RegexOptions.IgnoreCase);
            if (!match.Success) return null;
            string file = match.Groups["exe"].Value;
            return Path.IsPathRooted(file) ? Path.GetFullPath(file) : null;
        }

        public static BrowserFamily Classify(string executable, string name)
        {
            string file = Path.GetFileName(executable ?? "").ToLowerInvariant();
            string label = (name ?? "").ToLowerInvariant();
            if (new[] { "firefox.exe", "waterfox.exe", "librewolf.exe", "floorp.exe" }.Contains(file)) return BrowserFamily.Firefox;
            if (file == "msedge.exe") return BrowserFamily.Edge;
            if (file == "opera.exe" || (file == "launcher.exe" && label.Contains("opera"))) return BrowserFamily.Opera;
            if (new[] { "chrome.exe", "brave.exe", "vivaldi.exe", "thorium.exe", "chromium.exe" }.Contains(file)) return BrowserFamily.Chromium;
            if (file == "browser.exe" && (label.Contains("yandex") || label.Contains("яндекс") || executable.IndexOf("Yandex", StringComparison.OrdinalIgnoreCase) >= 0)) return BrowserFamily.Chromium;
            return BrowserFamily.Unknown;
        }

        private static string ReadDefaultCommand()
        {
            try
            {
                using (RegistryKey choice = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice", false))
                {
                    string progId = choice == null ? null : choice.GetValue("ProgId") as string;
                    if (String.IsNullOrEmpty(progId)) return null;
                    using (RegistryKey command = Registry.ClassesRoot.OpenSubKey(progId + @"\shell\open\command", false))
                        return command == null ? null : command.GetValue(null) as string;
                }
            }
            catch (System.Security.SecurityException) { return null; }
            catch (UnauthorizedAccessException) { return null; }
        }

        public static List<BrowserInfo> Find()
        {
            Dictionary<string, BrowserInfo> found = new Dictionary<string, BrowserInfo>(StringComparer.OrdinalIgnoreCase);
            Action<string, string> add = delegate(string name, string command)
            {
                string executable;
                try { executable = ParseExecutable(command); } catch { return; }
                if (executable == null || !File.Exists(executable)) return;
                if (found.ContainsKey(executable)) return;
                BrowserFamily family = Classify(executable, name);
                if (family == BrowserFamily.Unknown) return;
                found.Add(executable, new BrowserInfo { Name = String.IsNullOrWhiteSpace(name) ? Path.GetFileNameWithoutExtension(executable) : name, Executable = executable, Family = family });
            };
            foreach (RegistryHive hive in new[] { RegistryHive.CurrentUser, RegistryHive.LocalMachine })
            foreach (RegistryView view in new[] { RegistryView.Registry64, RegistryView.Registry32 })
            {
                try
                {
                    using (RegistryKey root = RegistryKey.OpenBaseKey(hive, view))
                    using (RegistryKey clients = root.OpenSubKey(@"Software\Clients\StartMenuInternet", false))
                    {
                        if (clients == null) continue;
                        foreach (string clientName in clients.GetSubKeyNames())
                        using (RegistryKey client = clients.OpenSubKey(clientName, false))
                        using (RegistryKey command = client == null ? null : client.OpenSubKey(@"shell\open\command", false))
                        {
                            if (command != null) add(client.GetValue(null) as string ?? clientName, command.GetValue(null) as string);
                        }
                    }
                }
                catch (System.Security.SecurityException) { }
                catch (UnauthorizedAccessException) { }
                catch (IOException) { }
            }

            string program = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            string program32 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
            string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            foreach (string folder in new[] { program, program32, local })
            {
                if (String.IsNullOrEmpty(folder)) continue;
                foreach (string[] candidate in new[] {
                    new[]{"Mozilla Firefox", @"Mozilla Firefox\firefox.exe"},
                    new[]{"Google Chrome", @"Google\Chrome\Application\chrome.exe"},
                    new[]{"Microsoft Edge", @"Microsoft\Edge\Application\msedge.exe"},
                    new[]{"Brave", @"BraveSoftware\Brave-Browser\Application\brave.exe"},
                    new[]{"Vivaldi", @"Vivaldi\Application\vivaldi.exe"},
                    new[]{"Yandex Browser", @"Yandex\YandexBrowser\Application\browser.exe"},
                    new[]{"Opera", @"Programs\Opera\opera.exe"},
                    new[]{"Opera GX", @"Programs\Opera GX\opera.exe"}
                }) add(candidate[0], "\"" + Path.Combine(folder, candidate[1]) + "\"");
            }

            string defaultExecutable = ParseExecutable(ReadDefaultCommand());
            if (defaultExecutable != null && !found.ContainsKey(defaultExecutable)) add(Path.GetFileNameWithoutExtension(defaultExecutable), "\"" + defaultExecutable + "\"");
            foreach (BrowserInfo browser in found.Values) browser.IsDefault = String.Equals(browser.Executable, defaultExecutable, StringComparison.OrdinalIgnoreCase);
            return found.Values.OrderByDescending(b => b.IsDefault).ThenBy(b => b.Name, StringComparer.CurrentCultureIgnoreCase).ToList();
        }
    }

    public sealed class DistributionInfo
    {
        public int schemaVersion { get; set; }
        public string extensionVersion { get; set; }
        public Dictionary<string, string> stores { get; set; }

        public string StoreFor(BrowserFamily family)
        {
            if (stores == null) return null;
            string key = family == BrowserFamily.Firefox ? "firefox" : family == BrowserFamily.Edge ? "edge" : family == BrowserFamily.Opera ? "opera" : "chromium";
            string value;
            if (!stores.TryGetValue(key, out value) || !AllowedStoreUrl(key, value)) return null;
            return value;
        }

        public static bool AllowedStoreUrl(string kind, string value)
        {
            Uri uri;
            if (!Uri.TryCreate(value, UriKind.Absolute, out uri) || uri.Scheme != Uri.UriSchemeHttps || !uri.IsDefaultPort || uri.UserInfo.Length != 0 || uri.Query.Length != 0 || uri.Fragment.Length != 0) return false;
            if (kind == "firefox") return uri.Host.Equals("addons.mozilla.org", StringComparison.OrdinalIgnoreCase) && uri.AbsolutePath.Contains("/firefox/addon/");
            if (kind == "edge") return uri.Host.Equals("microsoftedge.microsoft.com", StringComparison.OrdinalIgnoreCase) && uri.AbsolutePath.StartsWith("/addons/detail/", StringComparison.Ordinal);
            if (kind == "opera") return uri.Host.Equals("addons.opera.com", StringComparison.OrdinalIgnoreCase) && uri.AbsolutePath.Contains("/extensions/details/");
            return kind == "chromium" && uri.Host.Equals("chromewebstore.google.com", StringComparison.OrdinalIgnoreCase) && uri.AbsolutePath.StartsWith("/detail/", StringComparison.Ordinal);
        }

        public static DistributionInfo Parse(string json)
        {
            DistributionInfo result = new JavaScriptSerializer { MaxJsonLength = 32768 }.Deserialize<DistributionInfo>(json);
            if (result == null || result.schemaVersion != 1) throw new InvalidDataException("Неподдерживаемый формат данных публикации.");
            return result;
        }
    }

    public static class Resources
    {
        public const string Guide = "https://github.com/psichopodobny/psichopodobny/blob/main/profile-theme/studio/README.md";
        public const string FirefoxGuide = "https://github.com/psichopodobny/psichopodobny/blob/main/profile-theme/studio/README.md#firefox";
        public const string Metadata = "https://raw.githubusercontent.com/psichopodobny/psichopodobny/main/profile-theme/studio/browser-installation.json";
        public const string Profile = "https://github.com/psichopodobny";

        public static byte[] Read(string name)
        {
            using (Stream input = Assembly.GetExecutingAssembly().GetManifestResourceStream(name))
            {
                if (input == null) throw new FileNotFoundException("Не найден встроенный ресурс: " + name);
                using (MemoryStream output = new MemoryStream()) { input.CopyTo(output); return output.ToArray(); }
            }
        }

        public static DistributionInfo BundledDistribution()
        {
            return DistributionInfo.Parse(Encoding.UTF8.GetString(Read("WinterProfile.Distribution.json")));
        }

        public static async Task<DistributionInfo> FetchDistribution()
        {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            using (HttpClient client = new HttpClient())
            {
                client.Timeout = TimeSpan.FromSeconds(7);
                client.DefaultRequestHeaders.UserAgent.ParseAdd("WinterProfile-Setup/1.0");
                using (HttpResponseMessage response = await client.GetAsync(Metadata, HttpCompletionOption.ResponseHeadersRead))
                {
                    response.EnsureSuccessStatusCode();
                    if (response.Content.Headers.ContentLength > 32768) throw new InvalidDataException("Слишком большой ответ сервера.");
                    using(Stream input=await response.Content.ReadAsStreamAsync())
                    using(MemoryStream body=new MemoryStream())
                    {
                        byte[] buffer=new byte[4096];int read;
                        while((read=await input.ReadAsync(buffer,0,buffer.Length))>0)
                        {
                            if(body.Length+read>32768)throw new InvalidDataException("Слишком большой ответ сервера.");
                            body.Write(buffer,0,read);
                        }
                        return DistributionInfo.Parse(Encoding.UTF8.GetString(body.ToArray()));
                    }
                }
            }
        }

        public static string Sha256(byte[] bytes)
        {
            using (SHA256 algorithm = SHA256.Create()) return BitConverter.ToString(algorithm.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant();
        }
    }

    public sealed class BundleManager
    {
        private readonly string root;
        public BundleManager(string root) { this.root = Path.GetFullPath(root); }

        public static string ResolveEntry(string destination, string entry)
        {
            entry = entry.Replace('/', Path.DirectorySeparatorChar);
            if (Path.IsPathRooted(entry)) throw new InvalidDataException("Недопустимый путь в пакете.");
            string fullRoot = Path.GetFullPath(destination).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
            string path = Path.GetFullPath(Path.Combine(fullRoot, entry));
            if (!path.StartsWith(fullRoot, StringComparison.OrdinalIgnoreCase) || entry.Split(Path.DirectorySeparatorChar).Any(part => part == "..")) throw new InvalidDataException("Путь выходит за папку расширения.");
            return path;
        }

        public string Prepare(bool firefox)
        {
            string resource = firefox ? "WinterProfile.Firefox.zip" : "WinterProfile.Chromium.zip";
            byte[] bytes = Resources.Read(resource);
            string expected = firefox ? BuildInfo.FirefoxSha256 : BuildInfo.ChromiumSha256;
            if (Resources.Sha256(bytes) != expected) throw new InvalidDataException("Повреждён встроенный пакет расширения.");
            string name = (firefox ? "Firefox-publication-" : "Chromium-") + BuildInfo.ExtensionVersion;
            string destination = Path.Combine(root, name);
            if (Directory.Exists(destination) && Matches(destination, bytes)) return destination;
            if (Directory.Exists(destination) || File.Exists(destination)) destination += "-" + Guid.NewGuid().ToString("N").Substring(0, 8);
            Directory.CreateDirectory(destination);
            using (MemoryStream stream = new MemoryStream(bytes))
            using (ZipArchive zip = new ZipArchive(stream, ZipArchiveMode.Read))
            {
                foreach (ZipArchiveEntry entry in zip.Entries)
                {
                    string file = ResolveEntry(destination, entry.FullName);
                    if (String.IsNullOrEmpty(entry.Name)) { Directory.CreateDirectory(file); continue; }
                    Directory.CreateDirectory(Path.GetDirectoryName(file));
                    using (Stream source = entry.Open())
                    using (FileStream output = new FileStream(file, FileMode.CreateNew, FileAccess.Write)) source.CopyTo(output);
                }
            }
            return destination;
        }

        public string SaveFirefoxPublication()
        {
            byte[] bytes=Resources.Read("WinterProfile.Firefox.zip");
            if(Resources.Sha256(bytes)!=BuildInfo.FirefoxSha256)throw new InvalidDataException("Повреждён встроенный архив Firefox.");
            Directory.CreateDirectory(root);
            string file=Path.Combine(root,"winter-profile-firefox-"+BuildInfo.ExtensionVersion+"-unsigned.zip");
            if(File.Exists(file))
            {
                if(new FileInfo(file).Length==bytes.Length&&Resources.Sha256(File.ReadAllBytes(file))==BuildInfo.FirefoxSha256)return file;
                file=Path.Combine(root,"winter-profile-firefox-"+BuildInfo.ExtensionVersion+"-"+Guid.NewGuid().ToString("N").Substring(0,8)+"-unsigned.zip");
            }
            using(FileStream output=new FileStream(file,FileMode.CreateNew,FileAccess.Write))output.Write(bytes,0,bytes.Length);
            return file;
        }

        private static bool Matches(string destination, byte[] bytes)
        {
            try
            {
                if ((File.GetAttributes(destination) & FileAttributes.ReparsePoint) != 0) return false;
                using (MemoryStream stream = new MemoryStream(bytes))
                using (ZipArchive zip = new ZipArchive(stream, ZipArchiveMode.Read))
                {
                    foreach (ZipArchiveEntry entry in zip.Entries)
                    {
                        if (String.IsNullOrEmpty(entry.Name)) continue;
                        string file = ResolveEntry(destination, entry.FullName);
                        if (!File.Exists(file) || new FileInfo(file).Length != entry.Length || (File.GetAttributes(file) & FileAttributes.ReparsePoint) != 0) return false;
                        using (MemoryStream original = new MemoryStream())
                        using (Stream source = entry.Open())
                        {
                            source.CopyTo(original);
                            if (Resources.Sha256(original.ToArray()) != Resources.Sha256(File.ReadAllBytes(file))) return false;
                        }
                    }
                }
                return true;
            }
            catch { return false; }
        }
    }

    public sealed class InstallPlan
    {
        public BrowserInfo Browser;
        public string StoreUrl;
        public bool PrepareChromium;
        public bool FirefoxPending;
        public string BrowserUrl;
    }

    public static class Installation
    {
        public static string ManagerUrl(BrowserInfo browser)
        {
            if (browser.Family == BrowserFamily.Edge) return "edge://extensions/";
            if (browser.Family == BrowserFamily.Opera) return "opera://extensions/";
            string file = Path.GetFileName(browser.Executable).ToLowerInvariant();
            if (file == "brave.exe") return "brave://extensions/";
            if (file == "vivaldi.exe") return "vivaldi://extensions/";
            if (file == "browser.exe") return "browser://extensions/";
            return "chrome://extensions/";
        }

        public static InstallPlan Plan(BrowserInfo browser, DistributionInfo distribution)
        {
            if (browser.Family == BrowserFamily.Unknown) throw new InvalidOperationException("Браузер не поддерживается.");
            string store = distribution.StoreFor(browser.Family);
            return new InstallPlan { Browser = browser, StoreUrl = store, FirefoxPending = store == null && browser.Family == BrowserFamily.Firefox, PrepareChromium = store == null && browser.Family != BrowserFamily.Firefox, BrowserUrl = store ?? (browser.Family == BrowserFamily.Firefox ? Resources.FirefoxGuide : ManagerUrl(browser)) };
        }

        public static void Open(BrowserInfo browser, string url)
        {
            if (BrowserDiscovery.Classify(browser.Executable, browser.Name) == BrowserFamily.Unknown || !File.Exists(browser.Executable)) throw new InvalidOperationException("Браузер больше не найден.");
            if (url.IndexOf('"') >= 0 || url.IndexOf('\r') >= 0 || url.IndexOf('\n') >= 0) throw new InvalidDataException("Некорректный адрес.");
            bool allowed=url==Resources.Guide||url==Resources.FirefoxGuide||url==Resources.Profile||url==ManagerUrl(browser)||new[]{"firefox","edge","opera","chromium"}.Any(kind=>DistributionInfo.AllowedStoreUrl(kind,url));
            if(!allowed)throw new InvalidDataException("Адрес не относится к установке расширения.");
            Process.Start(new ProcessStartInfo(browser.Executable, "\"" + url + "\"") { UseShellExecute = false });
        }
    }
}
