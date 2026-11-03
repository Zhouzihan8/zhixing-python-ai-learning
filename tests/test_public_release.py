from __future__ import annotations

import json
import re
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"


class PublicReleaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.lessons = json.loads((SITE / "content" / "course.json").read_text(encoding="utf-8"))["lessons"]

    def test_all_lessons_have_practice_and_project_downloads(self):
        self.assertEqual(len(self.lessons), 54)
        self.assertEqual(len({lesson["id"] for lesson in self.lessons}), 54)
        for lesson in self.lessons:
            for key in ("practiceDownload",):
                self.assertTrue((SITE / lesson[key].removeprefix("./")).is_file(), lesson["id"])
            self.assertTrue((SITE / lesson["project"]["download"].removeprefix("./")).is_file(), lesson["id"])

    def test_static_site_has_no_local_api_or_machine_paths(self):
        source = "\n".join(path.read_text(encoding="utf-8") for path in SITE.rglob("*") if path.is_file() and path.suffix in {".html", ".js", ".json", ".md", ".css"})
        self.assertNotIn("/api/course", source)
        self.assertNotIn("/api/run", source)
        self.assertNotIn("文件导航.html", source)
        self.assertNotRegex(source, r"[A-Za-z]:\\(?:Users|学习)\\")
        self.assertNotRegex(source, r"gh[pousr]_[A-Za-z0-9]{15,}|sk-[A-Za-z0-9]{10,}")

    def test_browser_runner_uses_pyodide_module_worker_and_course_io(self):
        app = (SITE / "app.js").read_text(encoding="utf-8")
        worker = (SITE / "pyodide-worker.js").read_text(encoding="utf-8")
        self.assertIn('new Worker("./pyodide-worker.js",{type:"module"})', app)
        self.assertIn("/full/pyodide.mjs", worker)
        self.assertIn("loadPackagesFromImports", worker)
        self.assertIn("setStdin", worker)
        self.assertIn("runpy.run_path", worker)

    def test_six_project_sources_are_documented_and_clean(self):
        projects = sorted(path for path in (ROOT / "projects").iterdir() if path.is_dir())
        self.assertEqual(len(projects), 6)
        for project in projects:
            self.assertTrue((project / "README.md").is_file(), project.name)
            self.assertTrue(any(project.rglob("*.py")), project.name)
            for path in project.rglob("*"):
                if not path.is_file():
                    continue
                self.assertNotIn("__pycache__", path.parts)
                self.assertNotEqual(path.suffix, ".code-workspace")
                self.assertNotEqual(path.name, "我的练习.py")
                if path.suffix.lower() in {".py", ".md", ".json", ".csv", ".txt"}:
                    source = path.read_text(encoding="utf-8")
                    self.assertNotRegex(source, r"[A-Za-z]:\\(?:Users|学习)\\")
                    self.assertNotRegex(source, r"gh[pousr]_[A-Za-z0-9]{15,}|sk-[A-Za-z0-9]{10,}")

    def test_download_archives_are_readable(self):
        archives = list((SITE / "downloads").rglob("*.zip"))
        self.assertEqual(len(archives), 60)
        for archive in archives:
            with zipfile.ZipFile(archive) as bundle:
                self.assertTrue(bundle.namelist(), archive.name)
                self.assertFalse(any("__pycache__" in name or name.endswith(".code-workspace") for name in bundle.namelist()), archive.name)
                if "practice" in archive.parts:
                    self.assertFalse(any(name.endswith(("我的练习.py", "参考实现.py")) for name in bundle.namelist()), archive.name)


if __name__ == "__main__":
    unittest.main()
