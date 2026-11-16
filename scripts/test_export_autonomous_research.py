"""Offline regression tests for redacted local research publisher."""
import importlib.util
import json
import os
import sqlite3
import stat
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

MODULE = Path(__file__).with_name("export-autonomous-research.py")
spec = importlib.util.spec_from_file_location("export_autonomous_research", MODULE)
assert spec and spec.loader
pub = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pub)


class AutonomousExportTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name)
        self.root = self.home / "KRX-Private/Research"
        self.root.mkdir(parents=True)
        self.output = self.home / "Library/Application Support/TrisMarketLens/autonomous-research-publication.json"
        patcher = patch.object(Path, "home", return_value=self.home)
        patcher.start()
        self.addCleanup(patcher.stop)

    def study(self, name="study-1", *, sidecar=False):
        parent = self.root / name
        parent.mkdir()
        db = parent / "experiments.sqlite3"
        with sqlite3.connect(db) as conn:
            conn.execute("CREATE TABLE analysis_artifacts (id TEXT, kind TEXT, payload TEXT)")
            records = [
                ("autonomous_run", {"state":"completed","agent":"gemma","attempts":2,"completed":1,
                    "performance_approved":False,"execution_authorized":False,
                    "source_pin":"PRIVATE_ORIGINAL_PIN","checkpoint":"/private/checkpoint.bin"}),
                ("autonomous_result", {"mean_ap":0.62,"stability_ap":0.57,"worst_balanced_accuracy":0.52,
                    "pit_qualified":False,"performance_approved":False,"execution_authorized":False,
                    "deferred_diagnostic":{"private":"PRIVATE_HELDOUT_FIELDS"},
                    "model_sha256":"PRIVATE_MODEL_SHA","dataset_id":"SECRET_DATASET"}),
                ("autonomous_selection", {"agent":"gemma","state":"selected","history_count":1,
                    "candidate_view_pin":"PRIVATE_CANDIDATE_PIN"}),
                ("autonomous_terminal", {"state":"completed","mean_ap":0.62,
                    "checkpoint":"/private/terminal"})
            ]
            for i,(kind,value) in enumerate(records):
                conn.execute("INSERT INTO analysis_artifacts VALUES (?,?,?)",
                    (str(i),kind,json.dumps(value)))
        if sidecar:
            Path(str(db)+"-wal").write_text("active")
        return db

    def test_export_has_only_redacted_whitelist_and_private_file_permissions(self):
        source = self.study()
        original = source.read_bytes()
        summary = pub.export(self.root,self.output)
        self.assertEqual(summary["publishedStudies"],1)
        self.assertEqual(original,source.read_bytes())
        self.assertEqual(stat.S_IMODE(self.output.stat().st_mode),0o600)
        data = self.output.read_text()
        for secret in ("PRIVATE_","checkpoint.bin","SECRET_DATASET","model_sha256","candidate_view_pin"):
            self.assertNotIn(secret,data)
        report = json.loads(data)
        self.assertEqual(report["scope"],"operator_local_redacted_snapshot_not_a_live_api")
        self.assertEqual(report["aggregateCounts"],{
            "autonomous_run":1,"autonomous_result":1,
            "autonomous_selection":1,"autonomous_terminal":1,
        })
        self.assertTrue(report["studies"][0]["results"][0]["hasDeferredDiagnostic"])
        self.assertEqual(report["studies"][0]["results"][0]["meanAp"],0.62)

    def test_active_sidecar_skipped_and_writes_nothing(self):
        self.study(sidecar=True)
        with self.assertRaisesRegex(ValueError,"No eligible quiescent"):
            pub.export(self.root,self.output)
        self.assertFalse(self.output.exists())

    def test_nonfinite_and_invalid_research_metrics_rejected(self):
        self.assertIsNone(pub.metric(float("nan")))
        self.assertIsNone(pub.metric(9))
        self.assertIsNone(pub.metric(-1))
        self.assertIsNone(pub.count(True))
        self.assertIsNone(pub.text("private/path"))
        self.assertIsNone(pub.project("unknown",{}))

    def test_output_path_cannot_be_escaped(self):
        self.study()
        with self.assertRaisesRegex(ValueError,"Output must be"):
            pub.export(self.root,self.home/"public.json")

    def test_suspicious_study_symlink_is_skipped(self):
        db = self.study("base")
        alias = self.root/"alias"
        alias.symlink_to(db.parent, target_is_directory=True)
        result = pub.export(self.root,self.output)
        self.assertEqual(result["publishedStudies"],1)
        self.assertEqual(result["skippedStudies"],1)


if __name__ == "__main__":
    unittest.main()
