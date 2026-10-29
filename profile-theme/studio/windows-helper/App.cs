using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace WinterProfile
{
    public sealed class ThemeButton : Button
    {
        public ThemeButton() { SetStyle(ControlStyles.UserPaint|ControlStyles.AllPaintingInWmPaint|ControlStyles.OptimizedDoubleBuffer,true); }
        protected override void OnPaint(PaintEventArgs e)
        {
            using(SolidBrush background=new SolidBrush(BackColor))e.Graphics.FillRectangle(background,ClientRectangle);
            using(Pen border=new Pen(Focused?Color.FromArgb(205,224,238):Color.FromArgb(65,86,104)))e.Graphics.DrawRectangle(border,0,0,Width-1,Height-1);
            TextRenderer.DrawText(e.Graphics,Text,Font,ClientRectangle,Enabled?ForeColor:Color.FromArgb(103,124,140),TextFormatFlags.HorizontalCenter|TextFormatFlags.VerticalCenter|TextFormatFlags.EndEllipsis);
        }
        protected override void OnEnabledChanged(EventArgs e) { base.OnEnabledChanged(e);Invalidate(); }
        protected override void OnGotFocus(EventArgs e) { base.OnGotFocus(e);Invalidate(); }
        protected override void OnLostFocus(EventArgs e) { base.OnLostFocus(e);Invalidate(); }
    }

    internal static class Program
    {
        [STAThread]
        private static int Main(string[] args)
        {
            try
            {
                if (args.Length == 2 && args[0] == "--self-test") return SelfTests.Run(Path.GetFullPath(args[1]));
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                if (args.Length == 2 && args[0] == "--render-preview")
                {
                    List<BrowserInfo> demo = new List<BrowserInfo> {
                        new BrowserInfo { Name="Firefox", Family=BrowserFamily.Firefox, IsDefault=true },
                        new BrowserInfo { Name="Microsoft Edge", Family=BrowserFamily.Edge },
                        new BrowserInfo { Name="Google Chrome", Family=BrowserFamily.Chromium }
                    };
                    using (MainWindow window = new MainWindow(demo, true))
                    {
                        typeof(Control).GetMethod("CreateControl",System.Reflection.BindingFlags.Instance|System.Reflection.BindingFlags.NonPublic,null,new[]{typeof(bool)},null).Invoke(window,new object[]{true});
                        window.PerformLayout();
                        using (Bitmap bitmap = new Bitmap(window.Width, window.Height))
                        {
                            window.DrawToBitmap(bitmap, new Rectangle(Point.Empty, window.Size));
                            bitmap.Save(Path.GetFullPath(args[1]), ImageFormat.Png);
                        }
                    }
                    return 0;
                }
                if (args.Length != 0) return 2;
                Application.Run(new MainWindow(BrowserDiscovery.Find(), false));
                return 0;
            }
            catch (Exception error)
            {
                if (args.Length == 0) MessageBox.Show(error.Message, "Winter Profile", MessageBoxButtons.OK, MessageBoxIcon.Error);
                else Console.Error.WriteLine(error.ToString());
                return 1;
            }
        }
    }

    public sealed class MainWindow : Form
    {
        private readonly List<BrowserInfo> browsers;
        private readonly CheckedListBox browserList = new CheckedListBox();
        private readonly TextBox log = new TextBox();
        private readonly Label defaultLabel = new Label();
        private readonly Label storeLabel = new Label();
        private readonly Button prepare = MakeButton("Подготовить для выбранных", true, 300);
        private readonly Button defaultOnly = MakeButton("Для основного браузера", false, 260);
        private readonly Button refresh = MakeButton("Проверить магазины", false, 190);
        private readonly Button openFolder = MakeButton("Открыть папку", false, 155);
        private readonly Button copyPath = MakeButton("Скопировать путь", false, 165);
        private readonly CheckBox openEditorAfter = new CheckBox { Text="Открыть редактор после подготовки", Checked=true, AutoSize=true, ForeColor=Color.FromArgb(153,174,190), Margin=new Padding(4,12,0,0) };
        private readonly BundleManager bundles;
        private DistributionInfo distribution;
        private string lastPath;
        private bool busy;
        private bool exiting;
        private readonly bool preview;
        private BrowserInfo mainBrowser;

        private static readonly Color Canvas = Color.FromArgb(12, 18, 25);
        private static readonly Color PanelColor = Color.FromArgb(21, 31, 42);
        private static readonly Color TextColor = Color.FromArgb(232, 239, 245);
        private static readonly Color Muted = Color.FromArgb(153, 174, 190);

        public MainWindow(List<BrowserInfo> browsers, bool preview)
        {
            this.browsers = browsers;
            this.preview = preview;
            distribution = Resources.BundledDistribution();
            bundles = new BundleManager(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "WinterProfile", "BrowserSetup"));
            Text = "Winter Profile Studio - темы и оформление";
            ClientSize = new Size(1000, 800);
            MinimumSize = new Size(980, 820);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Canvas;
            ForeColor = TextColor;
            Font = new Font("Segoe UI", 10F);
            using (Stream icon = System.Reflection.Assembly.GetExecutingAssembly().GetManifestResourceStream("WinterProfile.Icon.ico"))
                if (icon != null) Icon = new Icon(icon);

            TableLayoutPanel root = new TableLayoutPanel { Dock=DockStyle.Fill, ColumnCount=1, RowCount=7, Padding=new Padding(28), BackColor=Canvas };
            root.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 100));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 88));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 52));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 232));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 60));
            root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 100));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 24));
            Controls.Add(root);

            Panel header = new Panel { Dock=DockStyle.Fill };
            Label title = new Label { Text="Winter Profile Studio", Font=new Font("Segoe UI", 28F, FontStyle.Bold), AutoSize=true, Location=new Point(0,0), ForeColor=TextColor };
            Label subtitle = new Label { Text="6 готовых тем / свои шрифты, фон, аватар, рамки и текст", AutoSize=true, Location=new Point(3,56), ForeColor=Muted };
            header.Controls.Add(title); header.Controls.Add(subtitle); root.Controls.Add(header,0,0);

            mainBrowser = browsers.FirstOrDefault(browser=>browser.IsDefault);
            defaultLabel.Text = mainBrowser == null ? "Windows не сообщил основной браузер. Выбери браузеры ниже." : "Основной браузер Windows:  " + mainBrowser.Name;
            defaultLabel.Dock=DockStyle.Fill; defaultLabel.TextAlign=ContentAlignment.MiddleLeft; defaultLabel.BackColor=PanelColor; defaultLabel.Padding=new Padding(14,0,0,0);
            root.Controls.Add(defaultLabel,0,1);

            TableLayoutPanel middle = new TableLayoutPanel { Dock=DockStyle.Fill, ColumnCount=2, RowCount=1, Margin=new Padding(0,16,0,0) };
            middle.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,44)); middle.ColumnStyles.Add(new ColumnStyle(SizeType.Percent,56));
            browserList.Dock=DockStyle.Fill; browserList.CheckOnClick=true; browserList.BackColor=PanelColor; browserList.ForeColor=TextColor; browserList.BorderStyle=BorderStyle.None; browserList.IntegralHeight=false; browserList.Font=new Font("Segoe UI",12F); browserList.Margin=new Padding(8,10,18,10);
            foreach(BrowserInfo browser in browsers)browserList.Items.Add(browser,true);
            middle.Controls.Add(browserList,0,0);
            Panel help = new Panel { Dock=DockStyle.Fill, BackColor=PanelColor, Padding=new Padding(18), Margin=new Padding(0) };
            storeLabel.Dock=DockStyle.Fill; storeLabel.ForeColor=Muted;
            storeLabel.Text = "Файлы расширения уже внутри EXE.\r\n\r\nFirefox: в пакете пока нет ссылки Mozilla Add-ons. Будут подготовлены архив и инструкция.\r\n\r\nChromium: откроется менеджер расширений. Нужно включить режим разработчика и выбрать «Загрузить распакованное».";
            help.Controls.Add(storeLabel); middle.Controls.Add(help,1,0); root.Controls.Add(middle,0,2);

            FlowLayoutPanel actions = new FlowLayoutPanel { Dock=DockStyle.Fill, Padding=new Padding(0,12,0,0), WrapContents=false, Margin=new Padding(0) };
            actions.Controls.Add(prepare); actions.Controls.Add(defaultOnly); actions.Controls.Add(refresh); root.Controls.Add(actions,0,3);
            prepare.Enabled=browsers.Count>0; defaultOnly.Enabled=mainBrowser!=null;

            log.Dock=DockStyle.Fill; log.Multiline=true; log.ReadOnly=true; log.ScrollBars=ScrollBars.Vertical; log.BackColor=PanelColor; log.ForeColor=Muted; log.BorderStyle=BorderStyle.None; log.Font=new Font("Segoe UI",10F); log.Margin=new Padding(0,4,0,5);
            log.Text="Выбери браузеры. Помощник подготовит файлы и откроет нужные страницы.\r\nСамо добавление расширения подтверждается в браузере.\r\n";
            root.Controls.Add(log,0,4);

            FlowLayoutPanel footer = new FlowLayoutPanel { Dock=DockStyle.Fill, Padding=new Padding(0,8,0,0), WrapContents=true, Margin=new Padding(0) };
            openFolder.Enabled=false;copyPath.Enabled=false;
            Button windows = MakeButton("Настройки Windows",false,185);
            Button profile = MakeButton("Открыть профиль",false,165);
            footer.Controls.Add(openFolder);footer.Controls.Add(copyPath);footer.Controls.Add(windows);footer.Controls.Add(profile);root.Controls.Add(footer,0,5);
            Button editor = MakeButton("Редактор тем",true,175);
            footer.SetFlowBreak(profile,true);footer.Controls.Add(editor);footer.Controls.Add(openEditorAfter);
            Label note = new Label { Dock=DockStyle.Fill, Text="Без прав администратора. Тема сохраняет настройки локально. Пакет: " + BuildInfo.ExtensionVersion, ForeColor=Muted, Font=new Font("Segoe UI",9F), TextAlign=ContentAlignment.BottomLeft };
            root.Controls.Add(note,0,6);

            prepare.Click += async delegate { await PrepareFor(browserList.CheckedItems.Cast<BrowserInfo>().ToList()); };
            defaultOnly.Click += async delegate { if(mainBrowser!=null)await PrepareFor(new List<BrowserInfo>{mainBrowser}); };
            refresh.Click += async delegate { await RefreshStores(); };
            windows.Click += delegate { RunSafely(delegate { Process.Start(new ProcessStartInfo("ms-settings:defaultapps") { UseShellExecute=true }); }); };
            profile.Click += delegate { RunSafely(delegate { Process.Start(new ProcessStartInfo(Resources.Profile) { UseShellExecute=true }); }); };
            openFolder.Click += delegate { RunSafely(OpenPreparedFolder); };
            editor.Click += delegate { RunSafely(OpenEditor); };
            copyPath.Click += delegate { RunSafely(delegate { if(lastPath!=null){Clipboard.SetText(lastPath);WriteLog("Путь скопирован. Его можно вставить в окно выбора папки или файла.");} }); };
            if(!preview)Shown += async delegate { await RefreshStores(); };
            if(!preview)Activated += delegate { if(!busy)RefreshBrowsers(); };
            FormClosing += delegate { exiting=true; };
        }

        private static Button MakeButton(string text, bool primary, int width)
        {
            Button button = new ThemeButton { Text=text, Width=width, Height=37, FlatStyle=FlatStyle.Flat, Margin=new Padding(0,0,10,0), Font=new Font("Segoe UI",10F,primary?FontStyle.Bold:FontStyle.Regular), Cursor=Cursors.Hand };
            button.BackColor=primary?Color.FromArgb(215,229,239):PanelColor;
            button.ForeColor=primary?Canvas:TextColor;
            button.FlatAppearance.BorderColor=Color.FromArgb(65,86,104);
            return button;
        }

        private async Task RefreshStores()
        {
            if(preview||busy)return;
            refresh.Enabled=false;
            try
            {
                distribution=await Resources.FetchDistribution();
                if(exiting||IsDisposed)return;
                string firefox=distribution.StoreFor(BrowserFamily.Firefox);
                WriteLog(firefox==null?"Firefox: опубликованная ссылка магазина пока отсутствует.":"Firefox: доступна официальная страница установки.");
                if(firefox!=null)storeLabel.Text="Firefox: доступна установка через Mozilla Add-ons.\r\n\r\nПосле нажатия откроется страница в выбранном браузере. Подтверди добавление расширения.\r\n\r\nДля браузеров без опубликованной ссылки помощник подготовит встроенные файлы.";
            }
            catch { WriteLog("Статус магазинов не загрузился. Доступны встроенные пакеты и инструкция."); }
            finally { if(!IsDisposed)refresh.Enabled=true; }
        }

        private void RefreshBrowsers()
        {
            List<string> checkedPaths=browserList.CheckedItems.Cast<BrowserInfo>().Select(browser=>browser.Executable).ToList();
            List<string> knownPaths=browsers.Select(browser=>browser.Executable).ToList();
            List<BrowserInfo> fresh=BrowserDiscovery.Find();
            browsers.Clear();browsers.AddRange(fresh);
            browserList.BeginUpdate();browserList.Items.Clear();
            foreach(BrowserInfo browser in browsers)browserList.Items.Add(browser,checkedPaths.Contains(browser.Executable)||!knownPaths.Contains(browser.Executable));
            browserList.EndUpdate();
            mainBrowser=browsers.FirstOrDefault(browser=>browser.IsDefault);
            defaultLabel.Text=mainBrowser==null?"Windows не сообщил основной браузер. Выбери браузеры ниже.":"Основной браузер Windows:  "+mainBrowser.Name;
            prepare.Enabled=browsers.Count>0;defaultOnly.Enabled=mainBrowser!=null;
        }

        private async Task PrepareFor(List<BrowserInfo> selected)
        {
            if(busy||preview)return;
            if(selected.Count==0){WriteLog("Сначала выбери хотя бы один браузер.");return;}
            busy=true;prepare.Enabled=false;defaultOnly.Enabled=false;refresh.Enabled=false;
            try
            {
                foreach(BrowserInfo browser in selected)
                {
                    if(exiting||IsDisposed)break;
                    try
                    {
                        InstallPlan plan=Installation.Plan(browser,distribution);
                        if(plan.FirefoxPending)
                        {
                            lastPath=await Task.Run(()=>bundles.SaveFirefoxPublication());
                            if(exiting||IsDisposed)return;
                            WriteLog(browser.Name+": подготовлен архив для публикации в Mozilla. Установка не выполнялась.");
                            WriteLog(lastPath);
                        }
                        else if(plan.PrepareChromium)
                        {
                            lastPath=await Task.Run(()=>bundles.Prepare(false));
                            if(exiting||IsDisposed)return;
                            WriteLog(browser.Name+": файлы готовы. В браузере: режим разработчика → «Загрузить распакованное» → эта папка.");
                            WriteLog(lastPath);
                        }
                        else WriteLog(browser.Name+": открыта официальная страница. Подтверди установку в браузере.");
                        Installation.Open(browser,plan.BrowserUrl);
                    }
                    catch(Exception error){WriteLog(browser.Name+": "+error.Message);}
                }
                if(lastPath!=null&&!exiting&&!IsDisposed)
                {
                    openFolder.Enabled=true;copyPath.Enabled=true;
                    try{OpenPreparedFolder();}catch{WriteLog("Путь указан выше; папку можно открыть вручную.");}
                }
                if(openEditorAfter.Checked&&!exiting&&!IsDisposed)RunSafely(OpenEditor);
            }
            finally
            {
                busy=false;if(!IsDisposed){prepare.Enabled=browsers.Count>0;defaultOnly.Enabled=browsers.Any(browser=>browser.IsDefault);refresh.Enabled=true;}
            }
        }

        private void OpenEditor()
        {
            string directory=bundles.Prepare(false);
            string page=Path.Combine(directory,"studio.html");
            if(!File.Exists(page))throw new FileNotFoundException("В пакете не найден редактор тем.");
            Process.Start(new ProcessStartInfo(page){UseShellExecute=true});
            WriteLog("Открыт редактор файла темы. Скачай JSON и импортируй его в установленное расширение Studio 1.3.");
        }

        private void OpenPreparedFolder()
        {
            if(lastPath==null)return;
            string arguments=File.Exists(lastPath)?"/select,\""+lastPath+"\"":"\""+lastPath+"\"";
            Process.Start(new ProcessStartInfo("explorer.exe",arguments){UseShellExecute=true});
        }

        private void WriteLog(string text) { if(!exiting&&!IsDisposed)log.AppendText(text+"\r\n"); }
        private void RunSafely(Action action) { try{action();}catch(Exception error){WriteLog(error.Message);} }
    }
}
