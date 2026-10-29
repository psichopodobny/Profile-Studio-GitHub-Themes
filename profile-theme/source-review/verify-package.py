import hashlib
import json
import sys
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parent
if len(sys.argv) != 2:
    raise SystemExit('Usage: python verify-package.py path/to/uploaded-firefox-package.zip')
expected = json.loads((root / 'expected-files.json').read_text(encoding='utf-8'))['files']
with zipfile.ZipFile(sys.argv[1]) as package:
    entries = {item.filename.replace('\\', '/'): package.read(item) for item in package.infolist() if not item.is_dir()}
if set(entries) != set(expected):
    raise SystemExit('Submitted package file list does not match.')
for name, submitted in entries.items():
    built = root / 'dist' / 'firefox' / Path(name)
    if not built.is_file() or built.read_bytes() != submitted:
        raise SystemExit('Built file differs: ' + name)
    if hashlib.sha256(submitted).hexdigest() != expected[name]:
        raise SystemExit('Hash differs: ' + name)
print(f'Verified {len(entries)} files: no code or asset differences from submitted package.')
