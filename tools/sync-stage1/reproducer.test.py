"""Reproducer safety tests; every replacement occurs only in temporary fixture trees."""
from pathlib import Path
import hashlib
import importlib.util
import subprocess
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
spec = importlib.util.spec_from_file_location("stage1_reproducer", HERE / "verify_and_apply.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ReproducerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        raw = (ROOT / "sync-v2.js").read_bytes()
        if hashlib.sha256(raw).hexdigest() == module.TARGET:
            cls.target = raw
            with tempfile.TemporaryDirectory() as directory:
                tree = Path(directory)
                (tree / "sync-v2.js").write_bytes(raw)
                subprocess.run(["git", "apply", "-R", str(HERE / "revision.patch")], cwd=tree, check=True, capture_output=True)
                cls.base = (tree / "sync-v2.js").read_bytes()
        else:
            cls.base = raw
            cls.target = module.build(raw)
        blob = hashlib.sha1(b"blob " + str(len(cls.base)).encode() + b"\0" + cls.base).hexdigest()
        if blob != module.BASE:
            raise RuntimeError("Fixture baseline mismatch")

    def fixture(self, root, raw):
        folder = root / "tools" / "sync-stage1"
        folder.mkdir(parents=True)
        for name in ["verify_and_apply.py", "revision.patch"]:
            (folder / name).write_bytes((HERE / name).read_bytes())
        (root / "sync-v2.js").write_bytes(raw)
        return folder / "verify_and_apply.py"

    def test_baseline_reproduces_exact_target(self):
        self.assertEqual(module.build(self.base), self.target)
        self.assertEqual(hashlib.sha256(self.target).hexdigest(), module.TARGET)

    def test_already_applied_is_idempotent(self):
        self.assertEqual(module.build(self.target), self.target)

    def test_unknown_sources_are_rejected(self):
        for raw in [b"wrong source", self.base + b"\n", self.target + b"\n"]:
            with self.subTest(size=len(raw)):
                with self.assertRaisesRegex(RuntimeError, "Source blob changed"):
                    module.build(raw)

    def test_tampered_patch_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            tree = Path(directory)
            text = (HERE / "revision.patch").read_text()
            self.assertIn("+ let highest=null;", text)
            (tree / "revision.patch").write_text(text.replace("+ let highest=null;", "+ let highest=999;", 1))
            previous = module.HERE
            module.HERE = tree
            try:
                with self.assertRaisesRegex(RuntimeError, "Patched engine hash mismatch"):
                    module.build(self.base)
            finally:
                module.HERE = previous

    def test_default_and_emit_never_replace_source(self):
        for raw in [self.base, self.target]:
            with self.subTest(size=len(raw)), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                script = self.fixture(root, raw)
                check = subprocess.run([sys.executable, str(script)], capture_output=True, check=True)
                self.assertIn(b"CHECK PASS", check.stdout)
                emit = subprocess.run([sys.executable, str(script), "--emit"], capture_output=True, check=True)
                self.assertEqual(emit.stdout, self.target)
                self.assertEqual((root / "sync-v2.js").read_bytes(), raw)

    def test_explicit_apply_then_reapply_only_in_fixture(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            script = self.fixture(root, self.base)
            subprocess.run([sys.executable, str(script), "--apply"], capture_output=True, check=True)
            source = root / "sync-v2.js"
            self.assertEqual(source.read_bytes(), self.target)
            before = source.stat().st_mtime_ns
            again = subprocess.run([sys.executable, str(script), "--apply"], capture_output=True, check=True)
            self.assertIn(b"ALREADY APPLIED", again.stdout)
            self.assertEqual(source.read_bytes(), self.target)
            self.assertEqual(source.stat().st_mtime_ns, before)

    def test_unknown_source_cli_does_not_replace_it(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            script = self.fixture(root, b"unknown source")
            result = subprocess.run([sys.executable, str(script), "--apply"], capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual((root / "sync-v2.js").read_bytes(), b"unknown source")

if __name__ == "__main__":
    unittest.main(verbosity=2)
