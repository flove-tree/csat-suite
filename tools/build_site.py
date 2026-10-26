import os
import re
import json
import shutil
import subprocess
from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

root = Path.cwd()
out = root / "_site"
sha = os.environ["BUILD_COMMIT"]
if not re.fullmatch(r"[0-9a-f]{40}", sha):
    raise ValueError("Invalid build commit")
built = datetime.now(timezone.utc)
label = built.astimezone(ZoneInfo("Asia/Seoul")).strftime("%Y-%m-%d %H:%M:%S")
if out.exists():
    shutil.rmtree(out)
out.mkdir()
tracked = subprocess.check_output(["git", "ls-files", "-z"]).decode().split("\0")
allowed = {".html", ".js", ".css", ".json", ".txt", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2", ".ttf", ".mp3", ".wav", ".ogg"}
for name in tracked:
    if not name:
        continue
    path = Path(name)
    if any(part.startswith(".") for part in path.parts) or path.parts[0] in {"tools", "_site"}:
        continue
    if path.suffix.lower() not in allowed and name != "CNAME":
        continue
    source = root / path
    if source.is_symlink():
        raise ValueError("Symlinks are not supported: " + name)
    target = out / path
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)

asset_pattern = re.compile(r"(<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*)([\"'])([^\"']+)(\2)", re.I)
def version_asset(match):
    value = match.group(3)
    parts = urlsplit(value)
    if parts.scheme or parts.netloc or not parts.path.lower().endswith((".js", ".css")):
        return match.group(0)
    query = [(key, val) for key, val in parse_qsl(parts.query, keep_blank_values=True) if key != "flove_build"]
    query.append(("flove_build", sha[:12]))
    url = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))
    return match.group(1) + match.group(2) + url + match.group(4)

def integrate_wishes(text):
    card = '<a id="wish-shortcut" href="soweon.html" class="wish-shortcut p-3.5 rounded-2xl min-w-[140px] text-center shadow-md" aria-label="소원 빌러가기, 별빛 소원 페이지로 이동">\n' + \
           '  <span class="wish-eyebrow">잠깐, 나를 위한 별빛</span>\n' + \
           '  <span class="wish-title"><span aria-hidden="true">✦</span> 소원 빌러가기 <span class="wish-arrow" aria-hidden="true">→</span></span>\n' + \
           '  <span class="wish-caption">오늘의 마음을 별에 담아</span>\n</a>'
    style = """<style id="wish-shortcut-style">
#wish-shortcut{display:flex;flex-direction:column;justify-content:center;gap:3px;flex-shrink:0;min-height:81px;text-decoration:none;color:#ede9fe;border:1px solid rgba(167,139,250,.35);background:radial-gradient(ellipse at 0 0,rgba(139,92,246,.18),transparent 75%),linear-gradient(135deg,#1e293b,#24253e);transition:background .2s,border-color .2s,box-shadow .2s}
#wish-shortcut .wish-eyebrow{display:block;font-size:10px;line-height:1.4;font-weight:600;color:#c4b5fd}
#wish-shortcut .wish-title{display:block;white-space:nowrap;font-size:14px;line-height:1.5;font-weight:800}
#wish-shortcut .wish-title>span:first-child{color:#ddd6fe}
#wish-shortcut .wish-arrow{display:inline-block;margin-left:3px;color:#c4b5fd;transition:transform .2s}
#wish-shortcut .wish-caption{display:block;font-size:10px;line-height:1.4;color:#cbd5e1}
#wish-shortcut:hover{border-color:rgba(196,181,253,.75);box-shadow:0 0 22px rgba(139,92,246,.13)}
#wish-shortcut:hover .wish-arrow{transform:translateX(2px)}
#wish-shortcut:focus-visible{outline:2px solid #ddd6fe;outline-offset:4px}
@media(prefers-reduced-motion:reduce){#wish-shortcut,#wish-shortcut .wish-arrow{transition:none}#wish-shortcut:hover .wish-arrow{transform:none}}
</style>"""
    replacements = [
        (r'<div\b[^>]*>\s*<p\b[^>]*>9월 평가원</p>\s*<p\b[^>]*\bid="dday-9pyung"[^>]*>[^<]*</p>\s*</div>', card),
        (r'^\s*const TARGET_9PYUNG = new Date\(2026, 8, 2\);[^\n]*\n', ''),
        (r"^\s*document\.getElementById\('dday-9pyung'\)\.textContent = calculateDDay\(TARGET_9PYUNG\);[^\n]*\n", ''),
        (r'</head\s*>', style + '\n</head>'),
    ]
    for pattern, replacement in replacements:
        text, count = re.subn(pattern, lambda m, value=replacement: value, text, flags=re.M)
        if count != 1:
            raise ValueError("Wish shortcut integration expected one match: " + pattern)
    if 'dday-9pyung' in text or 'TARGET_9PYUNG' in text:
        raise ValueError("Stale September D-Day references")
    if text.count('id="wish-shortcut"') != 1 or 'id="dday-suneung"' not in text:
        raise ValueError("Invalid wish / CSAT widgets")
    return text

def integrate_wish_home(text):
    marker = '<p id="cheer"></p>'
    if text.count(marker) != 1 or 'id="wish-home-link"' in text:
        raise ValueError("Wish completion panel changed")
    link = ('<div id="wish-home-actions"><a id="wish-home-link" href="index.html" '
            'aria-label="허브로 돌아가기">'
            '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" '
            'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true" focusable="false">'
            '<path d="M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9"/>'
            '</svg></a></div>')
    text = text.replace(marker, marker + link, 1)
    style = """<style id="wish-home-style">
#wish-home-actions{margin:24px 0 0;text-align:center}
#wish-home-link{display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;padding:0;border:1px solid #c6b6ec40;border-radius:50%;background:linear-gradient(135deg,#b39bdb18,#7997ce0d);color:#ddd3f2;text-decoration:none;box-shadow:0 4px 24px #05061930;transition:background .2s,border-color .2s,box-shadow .2s}
#wish-home-link svg{display:block;flex-shrink:0}
#wish-home-link:hover{background:linear-gradient(135deg,#b39bdb2b,#7997ce19);border-color:#d2bff087;box-shadow:0 0 22px #ab8add15}
#wish-home-link:focus-visible{outline:2px solid #cebeef;outline-offset:5px}
#done #edit{margin-top:12px}
@media(prefers-reduced-motion:reduce){#wish-home-link{transition:none}}
</style>"""
    text, count = re.subn(r'</head\s*>', lambda m: style + m.group(0), text)
    if count != 1:
        raise ValueError("Wish page head changed")
    return text

for page in out.rglob("*.html"):
    text = page.read_text(encoding="utf-8")
    if page == out / "index.html":
        if not (out / "soweon.html").is_file():
            raise ValueError("Missing wish page")
        text = integrate_wishes(text)
    if page == out / "soweon.html":
        if not (out / "index.html").is_file():
            raise ValueError("Missing hub page")
        text = integrate_wish_home(text)
    if page == out / "samun.html":
        if not (out / "samun-note-sorting.js").is_file():
            raise ValueError("Missing Samun sorting module")
        if 'id="samun-note-sorting-loader"' not in text:
            text, count = re.subn(r"</body\s*>(?=\s*</html\s*>\s*\Z)", lambda m: '<script id="samun-note-sorting-loader" src="samun-note-sorting.js"></script>\n' + m.group(0), text, count=1, flags=re.I)
            if count != 1:
                raise ValueError("Samun sorting loader was not added")
        if not (out / "samun-json-backup.js").is_file():
            raise ValueError("Missing Samun JSON backup module")
        if 'id="samun-json-backup-loader"' not in text:
            text, count = re.subn(r"</body\s*>(?=\s*</html\s*>\s*\Z)", lambda m: '<script id="samun-json-backup-loader" src="samun-json-backup.js"></script>\n' + m.group(0), text, count=1, flags=re.I)
            if count != 1:
                raise ValueError("Samun JSON backup loader was not added")
    text = asset_pattern.sub(version_asset, text)
    if page == out / "index.html":
        marker = ('<p id="flove-site-update" title="현재 HTML 배포본의 생성 시각입니다. 배포 완료 시각이나 새로고침 시각이 아닙니다." '
                  'style="font-size:11px;line-height:1.6;margin:10px 0 0;overflow-wrap:anywhere">'
                  f'최근 업데이트: <time datetime="{built.isoformat()}">{label} (KST)</time> '
                  f'· 버전 {sha[:7]} <span style="opacity:.8">(배포본 생성)</span></p>')
        if re.search(r"</footer\s*>", text, re.I):
            text = re.sub(r"</footer\s*>", lambda m: marker + m.group(0), text, count=1, flags=re.I)
        else:
            text = re.sub(r"</body\s*>", lambda m: '<footer style="text-align:center;color:#64748b;padding:16px">' + marker + '</footer>' + m.group(0), text, count=1, flags=re.I)
        if 'id="flove-site-update"' not in text:
            raise ValueError("Homepage footer was not added")
    page.write_text(text, encoding="utf-8")
(out / "site-version.json").write_text(json.dumps({"commit": sha, "builtAt": built.isoformat(), "timezone": "Asia/Seoul"}), encoding="utf-8")
(out / ".nojekyll").touch()
if not (out / "index.html").is_file():
    raise ValueError("Missing homepage")
print("Site build:", label, "KST", sha[:7])
