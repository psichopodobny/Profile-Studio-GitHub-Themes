"""Create a local visual preview without installing or modifying a browser."""
from pathlib import Path
import html,json,os

base=Path(os.environ['LOCALAPPDATA'])/'ProfileStudio'
assets=base/'Firefox-1.3.0'
manifest=json.loads((assets/'manifest.json').read_text(encoding='utf8'))
assert manifest['version']=='1.3.0'
uri=assets.as_uri()+'/'
def url(name):return html.escape(uri+name,quote=True)
document='''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>psichopodobny - Profile Studio preview</title>
<style>html,body{margin:0;background:#0a0d10;color:#dce5ee;font-family:Segoe UI,system-ui,sans-serif}.preview-notice{position:relative;z-index:200;display:flex;justify-content:space-between;gap:20px;padding:12px 28px;font-size:12px;background:#131c26;border-bottom:1px solid #ffffff20;line-height:1.7}.preview-notice a{color:#b8d2e7}.preview-notice span{color:#8da4b9}@media(max-width:600px){.preview-notice{display:block;padding:12px 18px}}</style>
<link rel="stylesheet" href="@@EFFECTS@@"></head><body data-assets="@@ASSETS@@"><div class="preview-notice"><div><strong>Profile Studio / psichopodobny</strong><br><span>Локальный предпросмотр. Подключение расширения к Firefox выполняется отдельно.</span></div><a href="https://github.com/psichopodobny">Открыть профиль на GitHub ↗</a></div><main id="preview-main"></main>
<script src="@@OPTIONS@@"></script><script src="@@VIEW@@"></script><script src="@@JS@@"></script>
<script>
(()=>{
  const main=document.getElementById('preview-main'),host=document.createElement('div'),shadow=host.attachShadow({mode:'open'}),asset=p=>new URL(p,document.body.dataset.assets).href;
  let preferences=PCWinterOptions.normalize({motion:!matchMedia('(prefers-reduced-motion: reduce)').matches}),effects;
  const style=document.createElement('link');style.rel='stylesheet';style.href=asset('theme.css');shadow.append(style);main.append(host);
  const view=PCWinterView.createView({document,asset,route:'personal',profileLogin:'psichopodobny',preferences,onPreference(key,value){preferences=PCWinterOptions.normalize({...preferences,[key]:value});view.update(preferences);effects?.update(preferences);},onExit(){location.href='https://github.com/psichopodobny';}});
  shadow.append(view.element);view.activate(window,main);effects=PCWinterEffects.create({document,main,view:view.element,native:false,route:'personal'});effects.update(preferences);
  addEventListener('pagehide',()=>{effects.destroy();view.destroy();},{once:true});
})();
</script></body></html>'''
for key,value in {'EFFECTS':url('effects.css'),'ASSETS':html.escape(uri,quote=True),'OPTIONS':url('options.js'),'VIEW':url('view.js'),'JS':url('effects.js')}.items():document=document.replace('@@'+key+'@@',value)
output=base/'my-profile-preview.html'
output.write_text(document,encoding='utf8')
print(json.dumps({'preview':str(output),'uri':output.as_uri(),'browserInstalled':False},ensure_ascii=False))
