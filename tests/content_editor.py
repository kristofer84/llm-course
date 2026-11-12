"""Locale-isolated editing/provenance contracts using disposable catalogs."""
import contextlib
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("course_content", ROOT / "tools/content.py")
content = importlib.util.module_from_spec(spec)
spec.loader.exec_module(content)


class ContentEditorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.i18n = self.root / "src/i18n"
        self.values = {
            "sv": {"mod.1.name": "Grunder", "block.body": "  x [2]\n    + y", "live.label": "Nästa"},
            "en": {"mod.1.name": "Basics", "block.body": "  x [2]\n    + y", "live.label": "Next"},
            "de": {"mod.1.name": "Grundlagen", "block.body": "  x [2]\n    + y", "live.label": "Weiter"},
        }
        for locale, values in self.values.items():
            directory = self.i18n / locale
            directory.mkdir(parents=True)
            (directory / "build.json").write_text(json.dumps({"mod.1.name": values["mod.1.name"]}, ensure_ascii=False, indent=1))
            (directory / "sample.json").write_text(json.dumps({k: v for k, v in values.items() if not k.startswith("mod.")}, ensure_ascii=False, indent=1))
        self.patches = [
            patch.object(content, "ROOT", str(self.root)),
            patch.object(content, "I18N", str(self.i18n)),
            patch.object(content, "order_from_page", lambda: [("mod.1.name", "Lesson", "h1"), ("block.body", "Lesson", "div")]),
        ]
        for item in self.patches:
            item.start()
            self.addCleanup(item.stop)
        self.output = contextlib.redirect_stdout(io.StringIO())
        self.output.__enter__()
        self.addCleanup(lambda: self.output.__exit__(None, None, None))
        content.configure_locale("en")
        content.mark()
        content.configure_locale("de")
        content.mark()

    def test_locale_paths_and_no_edit_round_trip(self):
        self.assertEqual(Path(content.EDIT), self.i18n / "edit/de")
        self.assertEqual(Path(content.STATE), self.i18n / ".translation-state.de.json")
        before = {str(p): p.read_bytes() for p in self.i18n.rglob("*.json")}
        content.dump()
        markdown = (Path(content.EDIT) / "block.md").read_text()
        self.assertIn("DE|   x [2]\nDE|     + y", markdown)
        self.assertNotIn("EN|", markdown)
        self.assertTrue((Path(content.EDIT) / "live.md").exists(), "Runtime values must be editable")
        self.assertEqual(content.apply(quiet=True), ([], [], []))
        self.assertEqual(before, {str(p): p.read_bytes() for p in self.i18n.rglob("*.json")})
        content.configure_locale("en")
        self.assertEqual(Path(content.EDIT), self.i18n / "edit")
        self.assertEqual(Path(content.STATE), self.i18n / ".translation-state.json")

    def test_edit_preserves_real_catalog_ownership(self):
        content.dump()
        path = Path(content.EDIT) / "mod.md"
        path.write_text(path.read_text().replace("DE| Grundlagen", "DE| Die Grundlagen"))
        content.apply(quiet=True)
        german = json.loads((self.i18n / "de/build.json").read_text())
        self.assertEqual(german["mod.1.name"], "Die Grundlagen")
        self.assertFalse((self.i18n / "de/mod.json").exists())
        self.assertEqual(content.catalogs("en"), self.values["en"])
        self.assertEqual(content.catalogs("sv"), self.values["sv"])
        content.write_catalog("de", "mod.1.goal.new", "Erkläre den Unterschied")
        self.assertIn("mod.1.goal.new", json.loads((self.i18n / "de/build.json").read_text()))

    def test_provenance_is_independent_per_language(self):
        path = self.i18n / "sv/build.json"
        path.write_text(json.dumps({"mod.1.name": "Nya grunder"}))
        self.assertEqual(content.status(strict=True), 1)
        content.mark()
        self.assertEqual(content.status(strict=True), 0)
        content.configure_locale("en")
        self.assertEqual(content.status(strict=True), 1)
        with patch("sys.argv", ["content.py", "status", "--all", "--strict"]):
            self.assertEqual(content.main(), 1)

    def test_wrong_language_marker_is_rejected(self):
        content.dump()
        path = Path(content.EDIT) / "mod.md"
        path.write_text(path.read_text().replace("DE| Grundlagen", "EN| Basics"))
        with self.assertRaisesRegex(ValueError, "Wrong language marker"):
            content.apply(quiet=True)
        self.assertEqual(content.catalogs("de"), self.values["de"])


if __name__ == "__main__":
    unittest.main()
