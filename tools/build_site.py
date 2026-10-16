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

for page in out.rglob("*.html"):
    text = page.read_text(encoding="utf-8")
    if page == out / "samun.html":
        if not (out / "samun-note-sorting.js").is_file():
            raise ValueError("Missing Samun sorting module")
        if 'id="samun-note-sorting-loader"' not in text:
            text, count = re.subn(r"</body\s*>(?=\s*</html\s*>\s*\Z)", lambda m: '<script id="samun-note-sorting-loader" src="samun-note-sorting.js"></script>\n' + m.group(0), text, count=1, flags=re.I)
            if count != 1:
                raise ValueError("Samun sorting loader was not added")
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
