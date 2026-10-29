"""Build the Studio preview with Python 3.9+ and Node 24+. No dependencies or network."""
from pathlib import Path
import hashlib, json, shutil, subprocess, zipfile

BASE=Path(__file__).resolve().parent
VERSION='1.3.0'

def archive(source,output):
    with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for f in sorted(source.rglob('*')):
            if f.is_file():
                info=zipfile.ZipInfo(f.relative_to(source).as_posix(),(2026,10,29,0,0,0))
                info.compress_type=zipfile.ZIP_DEFLATED
                z.writestr(info,f.read_bytes())

def main():
    dist=BASE/'dist'; dist.mkdir(exist_ok=True)
    source=BASE/'extension'; firefox=BASE/'firefox'
    shutil.copytree(source,firefox,dirs_exist_ok=True)
    m=json.loads((firefox/'manifest.json').read_text(encoding='utf8'))
    m['browser_specific_settings']={'gecko':{'id':'winter-profile@psichopodobny','strict_min_version':'140.0','data_collection_permissions':{'required':['none']}},'gecko_android':{'strict_min_version':'142.0'}}
    m['host_permissions']=['https://github.com/*']
    (firefox/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    presets=json.loads(subprocess.check_output(['node','-e','process.stdout.write(JSON.stringify(require('+json.dumps(str(source/'presets.js'))+')))'],encoding='utf8'))
    packs=BASE/'packs';packs.mkdir(exist_ok=True)
    for p in presets:
        data={'format':'winter-profile-theme','version':2,'name':p['name'],'appearance':p['appearance']}
        (packs/(p['id']+'.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    archive(packs,dist/'winter-theme-collection-v1.3.0.zip')
    archive(source,dist/f'psichopodobny-winter-v{VERSION}.zip')
    archive(firefox,dist/f'psichopodobny-winter-firefox-v{VERSION}-unsigned.zip')
    expected={f.relative_to(firefox).as_posix():hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(firefox.rglob('*')) if f.is_file()}
    (BASE/'expected-firefox.json').write_text(json.dumps(expected,indent=2)+'\n',encoding='utf8')
    with zipfile.ZipFile(dist/f'psichopodobny-winter-firefox-v{VERSION}-source.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for f in sorted(source.rglob('*')):
            if f.is_file():z.write(f,'extension/'+f.relative_to(source).as_posix())
        for name in ['build.py','README-BUILD.md','expected-firefox.json']:z.write(BASE/name,name)
    print(json.dumps({'version':VERSION,'themes':len(presets),'signed':False,'files':len(list(source.rglob('*')))},indent=2))

if __name__=='__main__':main()
