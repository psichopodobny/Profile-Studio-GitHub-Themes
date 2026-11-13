"""Build local review artifacts only. No network, signing, Git, or publication."""
from pathlib import Path
import hashlib, json, shutil, zipfile, base64

ROOT=Path(__file__).resolve().parent
EXT=ROOT/'extension'
DIST=ROOT/'dist'
FIREFOX=ROOT/'firefox'
VERSION='1.5.4'
FILES=['manifest.json','options.js','scope.js','branding.js','asset-data.js','backgrounds.js','avatars.js','frame-catalog.js','frame-media.js','frame-settings.js','frame-designs.js','frames.js','frame-gallery.html','frame-gallery.css','frame-gallery.js','cursor.js','components.js','components.css','weather.js','scene.js','scene.css','effects.js','effects.css','view.js','controller.js','content.js','native.css','presets.js','sharing.js','personal-profile.js','consent.js','background.js','studio.html','studio.css','studio.js','color-picker.js','color-picker.css','readme-core.js','readme-studio.js','readme-studio.css','studio-tools.js','studio-tools.css','popup.html','popup.css','popup.js','gallery.html','gallery.css','gallery.js','LICENSE','ARTWORK.md','PRIVACY.md','INSTALL.ru.txt']
MEDIA=['avatar.svg','logo.svg','winter-forest.png','winter-forest-wide.webp','winter-lake.png','icon-16.png','icon-48.png','icon-128.png']
FONT_NAMES=['Manrope','Unbounded','JetBrainsMono','CormorantGaramond']
MEDIA += ['fonts/'+name+suffix for name in FONT_NAMES for suffix in ['.ttf','-OFL.txt']]
FILES += ['media/'+name for name in MEDIA]
FRAME_FILES = ['media/frames/'+p.name for p in sorted((EXT/'media/frames').glob('*')) if p.suffix in ['.png','.json','.md']]
FILES += FRAME_FILES

def digest(data): return hashlib.sha256(data).hexdigest()
def embedded_assets():
    lines=['// Generated deterministically from packaged images and fonts by build.py.','(function(root) {','  "use strict";','  const data = {']
    for name in ['winter-forest-wide.webp','winter-lake.png','icon-128.png']+['fonts/'+name+'.ttf' for name in FONT_NAMES]:
        mime='font/ttf' if name.endswith('.ttf') else 'image/webp' if name.endswith('.webp') else 'image/png'
        encoded='data:'+mime+';base64,'+base64.b64encode((EXT/'media'/name).read_bytes()).decode('ascii')
        chunks=[encoded[i:i+120] for i in range(0,len(encoded),120)]
        lines.append('    '+json.dumps('media/'+name)+': [')
        lines.extend('      '+json.dumps(chunk)+',' for chunk in chunks)
        lines.append('    ].join(""),')
    lines.extend(['  };','  root.PCStudioAssets = {source(path) {return data[path] || null;}};','})(globalThis);',''])
    (EXT/'asset-data.js').write_text('\n'.join(lines),encoding='utf-8',newline='\n')
def branding():
    encoded='data:image/png;base64,'+base64.b64encode((EXT/'media/icon-128.png').read_bytes()).decode('ascii')
    chunks=[encoded[i:i+120] for i in range(0,len(encoded),120)]
    lines=['// Generated from media/icon-128.png by build.py; selected PS concept 15.',
           '(function(root) {', '  "use strict";', '  const source = [']
    lines.extend('    '+json.dumps(chunk)+',' for chunk in chunks)
    lines.extend(['  ].join("");',
        '  function apply(doc) {',
        '    doc.querySelectorAll(".brand-logo").forEach(n => { n.src = source; });',
        '    doc.querySelectorAll("link[data-studio-icon]").forEach(n => { n.href = source; });',
        '  }',
        '  root.PCStudioBrand = {source, apply};',
        '  if (root.document && root.location?.hostname !== "github.com") apply(root.document);',
        '})(globalThis);', ''])
    (EXT/'branding.js').write_text('\n'.join(lines),encoding='utf-8',newline='\n')

def frame_data():
    items=json.loads((EXT/'media/frames/catalog.json').read_text(encoding='utf-8'))
    (EXT/'frame-catalog.js').write_text('// Generated from media/frames/catalog.json by build.py.\n(function(root){"use strict";root.PCStudioFrameCatalog='+json.dumps(items,ensure_ascii=False,indent=2)+';})(globalThis);\n',encoding='utf-8',newline='\n')
    for item in items:
        encoded='data:image/png;base64,'+base64.b64encode((EXT/item['file']).read_bytes()).decode('ascii')
        data='(function(root){"use strict";root.PCStudioLocalFrames ||= {};root.PCStudioLocalFrames['+json.dumps(item['id'])+']=['+'\n'+',\n'.join(json.dumps(encoded[i:i+120]) for i in range(0,len(encoded),120))+'\n].join("");})(globalThis);\n'
        (EXT/'media/frames'/str(item['id']+'.js')).write_text(data,encoding='utf-8',newline='\n')

def zipped(target, entries):
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name,data in sorted(entries.items()):
            info=zipfile.ZipInfo(name,(2026,11,1,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            info.external_attr=0o644<<16
            z.writestr(info,data)

def build():
    DIST.mkdir(exist_ok=True)
    embedded_assets()
    branding()
    frame_data()
    chrome={name:(EXT/name).read_bytes() for name in FILES}
    manifest=json.loads(chrome['manifest.json'])
    if manifest['version'] != VERSION: raise RuntimeError('Manifest/build version mismatch')
    # Keep the same add-on identity; this is not a new signed/public release.
    ff={**manifest,'background':{'scripts':['options.js','sharing.js','personal-profile.js','consent.js','background.js']},'browser_specific_settings':{'gecko':{'id':'winter-profile@psichopodobny','strict_min_version':'140.0','data_collection_permissions':{'required':['none'],'optional':['browsingActivity']}},'gecko_android':{'strict_min_version':'142.0'}}}
    firefox={**chrome,'manifest.json':(json.dumps(ff,ensure_ascii=False,indent=2)+'\n').encode()}
    for name,data in firefox.items():
        target=FIREFOX/name
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_bytes(data)
    for folder in [EXT,FIREFOX]:
        m=json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
        required=m['content_scripts'][0]['js']+m['content_scripts'][0]['css']+list(m['icons'].values())+[m['options_ui']['page'],m['action']['default_popup']]
        required+=m['background'].get('scripts',[])
        if 'service_worker' in m['background']:required.append(m['background']['service_worker'])
        for name in required:
            if not (folder/name).is_file():raise RuntimeError('Missing package file: '+name)
    html={**chrome,**{'media/frames/'+p.name:p.read_bytes() for p in (EXT/'media/frames').glob('*.js')}}
    names={
        f'profile-studio-v{VERSION}-review-chromium.zip':chrome,
        f'profile-studio-v{VERSION}-review-firefox-unsigned.zip':firefox,
        f'profile-studio-v{VERSION}-review-html.zip':html,
    }
    for name,entries in names.items():zipped(DIST/name,entries)
    packs={}
    for item in json.loads((ROOT/'packs.json').read_text(encoding='utf-8')):
        packs[item['id']+'.json']=(json.dumps(item['theme'],ensure_ascii=False,indent=2)+'\n').encode()
    packs_name='profile-studio-20-theme-packs.zip'
    zipped(DIST/packs_name,packs)
    expected={name:digest(data) for name,data in firefox.items()}
    (ROOT/'expected-firefox.json').write_text(json.dumps(expected,indent=2)+'\n',encoding='utf-8')
    source={'extension/'+name:data for name,data in chrome.items()}
    for name in ['build.py','packs.json','expected-firefox.json','README.md','README-BUILD.md']:
        source[name]=(ROOT/name).read_bytes()
    for f in (ROOT/'tests').glob('*.cjs'):source['tests/'+f.name]=f.read_bytes()
    for f in (ROOT/'tests/fixtures').glob('*'):
        if f.is_file(): source['tests/fixtures/'+f.name]=f.read_bytes()
    zipped(DIST/f'profile-studio-v{VERSION}-review-source.zip',source)
    current_names=set(names)|{packs_name,f'profile-studio-v{VERSION}-review-source.zip'}
    report={'version':VERSION,'revision':'polish-motion-13','status':'public_source_preview','publicStoreReady':False,'artworkRights':'Steam reference binaries excluded; imported artwork retains its rights','publishAllowed':False,'signed':False,'mozillaUploaded':False,'files':{f.name:{'bytes':f.stat().st_size,'sha256':digest(f.read_bytes())} for f in sorted(DIST.glob('*.zip')) if f.name in current_names}}
    (DIST/'build-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':report['status'],'packages':len(report['files']),'firefoxFiles':len(firefox),'publishAllowed':False}))

if __name__=='__main__':build()
