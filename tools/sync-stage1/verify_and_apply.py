"""Reproduce the reviewed Stage-1 engine. Default is read-only; never calls a server."""
from pathlib import Path
import argparse
import hashlib
import os
import stat
import subprocess
import sys
import tempfile

BASE = "c38b2bf72b24a0d84a30fa53b6aeda1d92f55f6c"
TARGET = "36d80b9108cf345e89486195d85e8b28ef2a869fc23277aade4f53311aca17e7"
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]

def build(raw):
    blob = hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()
    if blob != BASE:
        raise RuntimeError("Source blob changed; refusing to apply the checkpoint")
    with tempfile.TemporaryDirectory() as folder:
        tree = Path(folder)
        (tree / "sync-v2.js").write_bytes(raw)
        patch = str(HERE / "revision.patch")
        for args in (["git", "apply", "--check", patch], ["git", "apply", patch]):
            subprocess.run(args, cwd=tree, check=True, capture_output=True)
        result = (tree / "sync-v2.js").read_bytes()
    if hashlib.sha256(result).hexdigest() != TARGET:
        raise RuntimeError("Patched engine hash mismatch")
    return result

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--emit", action="store_true", help="Print the candidate without modifying files")
    mode.add_argument("--apply", action="store_true", help="Explicitly replace the local engine; no Git commit")
    args = parser.parse_args()
    source = ROOT / "sync-v2.js"
    if source.is_symlink():
        raise RuntimeError("Symlink source rejected")
    raw = source.read_bytes()
    result = build(raw)
    if args.emit:
        sys.stdout.buffer.write(result)
        return
    if args.apply:
        pending = None
        try:
            with tempfile.NamedTemporaryFile(dir=source.parent, delete=False) as handle:
                pending = Path(handle.name)
                handle.write(result)
                handle.flush()
                os.fsync(handle.fileno())
            os.chmod(pending, stat.S_IMODE(source.stat().st_mode))
            if source.is_symlink() or source.read_bytes() != raw:
                raise RuntimeError("Source changed before replacement")
            os.replace(pending, source)
            if source.read_bytes() != result:
                raise RuntimeError("Replacement verification failed")
        finally:
            if pending is not None and pending.exists():
                pending.unlink()
        print("LOCAL ENGINE REPLACED; no Git commit or server request performed")
    else:
        print("CHECK PASS; source unchanged; candidate SHA256 " + TARGET)

if __name__ == "__main__":
    main()
