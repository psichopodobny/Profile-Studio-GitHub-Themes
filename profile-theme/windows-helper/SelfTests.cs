using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Script.Serialization;

namespace WinterProfile
{
    public static class SelfTests
    {
        public static int Run(string directory)
        {
            Directory.CreateDirectory(directory);
            List<string> checks=new List<string>();
            Action<bool,string> check=delegate(bool success,string name){if(!success)throw new InvalidDataException("Self-test failed: "+name);checks.Add(name);};
            check(BrowserDiscovery.ParseExecutable("\"C:\\Program Files\\Mozilla Firefox\\firefox.exe\" -osint -url \"%1\"")==@"C:\Program Files\Mozilla Firefox\firefox.exe","quoted browser command");
            check(BrowserDiscovery.ParseExecutable(@"C:\Program Files\Google\Chrome\Application\chrome.exe --single-argument %1")==@"C:\Program Files\Google\Chrome\Application\chrome.exe","unquoted browser command");
            check(BrowserDiscovery.ParseExecutable("cmd /c something")==null,"shell command is not a browser executable");
            check(BrowserDiscovery.Classify(@"C:\Windows\System32\cmd.exe","Chrome")==BrowserFamily.Unknown,"reject non-browser launchers");
            check(DistributionInfo.AllowedStoreUrl("firefox","https://addons.mozilla.org/en-US/firefox/addon/example/"),"allow official Mozilla listing");
            check(DistributionInfo.AllowedStoreUrl("chromium","https://chromewebstore.google.com/detail/example/abcdefghijklmnopabcdefghijklmnop"),"allow Chrome store listing");
            foreach(string url in new[]{"http://addons.mozilla.org/en-US/firefox/addon/example/","https://addons.mozilla.org.evil.example/en-US/firefox/addon/example/","https://user@addons.mozilla.org/en-US/firefox/addon/example/","javascript:alert(1)","file:///C:/Windows/System32/cmd.exe","https://addons.mozilla.org/en-US/firefox/addon/example/?redirect=elsewhere"})check(!DistributionInfo.AllowedStoreUrl("firefox",url),"reject unsafe store address "+checks.Count);
            DistributionInfo distribution=Resources.BundledDistribution();
            BrowserInfo firefox=new BrowserInfo{Name="Firefox",Executable=@"C:\Browsers\firefox.exe",Family=BrowserFamily.Firefox,IsDefault=true};
            BrowserInfo chrome=new BrowserInfo{Name="Chrome",Executable=@"C:\Browsers\chrome.exe",Family=BrowserFamily.Chromium};
            BrowserInfo edge=new BrowserInfo{Name="Edge",Executable=@"C:\Browsers\msedge.exe",Family=BrowserFamily.Edge};
            InstallPlan firefoxPlan=Installation.Plan(firefox,distribution),chromePlan=Installation.Plan(chrome,distribution);
            check(firefoxPlan.FirefoxPending&&!firefoxPlan.PrepareChromium&&firefoxPlan.BrowserUrl==Resources.FirefoxGuide,"unsigned Firefox is a pending publication, never reported as installed");
            check(chromePlan.PrepareChromium&&chromePlan.BrowserUrl=="chrome://extensions/","Chromium plan prepares an unpacked package");
            check(Installation.ManagerUrl(edge)=="edge://extensions/","Edge opens its own extension manager");
            DistributionInfo signed=new DistributionInfo{schemaVersion=1,stores=new Dictionary<string,string>{{"firefox","https://addons.mozilla.org/en-US/firefox/addon/example/"}}};
            check(Installation.Plan(firefox,signed).StoreUrl!=null&&!Installation.Plan(firefox,signed).FirefoxPending,"published Firefox uses normal store confirmation");
            string sandbox=Path.Combine(directory,"files-"+Guid.NewGuid().ToString("N"));
            BundleManager bundles=new BundleManager(sandbox);
            string chromium=bundles.Prepare(false);
            check(File.Exists(Path.Combine(chromium,"manifest.json")),"Chromium archive extracted with root manifest");
            check(Directory.GetFiles(chromium,"*",SearchOption.AllDirectories).Length==22,"Chromium package contains all 22 files");
            check(bundles.Prepare(false)==chromium,"identical prepared package is reused");
            string original=File.ReadAllText(Path.Combine(chromium,"manifest.json"));
            File.WriteAllText(Path.Combine(chromium,"manifest.json"),"user-edited");
            string preserved=bundles.Prepare(false);
            check(preserved!=chromium&&File.ReadAllText(Path.Combine(chromium,"manifest.json"))=="user-edited","user-edited files are preserved");
            check(File.ReadAllText(Path.Combine(preserved,"manifest.json"))==original,"replacement package is complete");
            string publication=bundles.SaveFirefoxPublication();
            check(Resources.Sha256(File.ReadAllBytes(publication))==BuildInfo.FirefoxSha256,"Firefox publication archive keeps its hash");
            check(publication==bundles.SaveFirefoxPublication(),"matching Firefox archive is reused");
            foreach(string entry in new[]{"../escape.txt",@"..\escape.txt",@"C:\outside.txt","/outside.txt"})
            {
                bool rejected=false;try{BundleManager.ResolveEntry(sandbox,entry);}catch{rejected=true;}
                check(rejected,"reject archive path traversal "+checks.Count);
            }
            List<BrowserInfo> actual=BrowserDiscovery.Find();
            var report=new{success=true,checks=checks,detectedBrowsers=actual.Select(browser=>new{name=browser.Name,family=browser.Family.ToString(),isDefault=browser.IsDefault}).ToArray(),registryAccess="read-only",browserLaunches=0,defaultChanged=false,chromiumBundleSha256=BuildInfo.ChromiumSha256,firefoxBundleSha256=BuildInfo.FirefoxSha256};
            File.WriteAllText(Path.Combine(directory,"verification.json"),new JavaScriptSerializer().Serialize(report));
            Console.WriteLine("Passed "+checks.Count+" checks; no browsers were launched and no Windows associations changed.");
            return 0;
        }
    }
}
