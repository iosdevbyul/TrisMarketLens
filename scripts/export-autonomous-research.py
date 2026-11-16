#!/usr/bin/env python3
"""Create a *separate* bounded, sanitized web report from existing autonomous DBs.

The research SQLite files are immutable inputs. This command does not start studies,
change models, create an API server, or copy raw artifact payloads into the web.
"""
import argparse
import json
import math
import os
import re
import sqlite3
import stat
import tempfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

VERSION = "autonomous_research_local_publication_v1"
ALLOWED_KINDS = ("autonomous_run", "autonomous_result", "autonomous_selection", "autonomous_terminal")
MAX_STUDIES = 40
MAX_ROWS_PER_KIND = 500
MAX_DB_BYTES = 256 * 1024 * 1024
SAFE_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$")
SAFE_STATE = re.compile(r"^[a-zA-Z0-9_ -]{1,64}$")


def text(value):
    if isinstance(value, str) and SAFE_STATE.fullmatch(value):
        return value
    return None


def count(value):
    if isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 100_000:
        return value
    return None


def metric(value):
    if isinstance(value, (float, int)) and not isinstance(value, bool) and math.isfinite(value) and 0 <= value <= 1:
        return round(value, 6)
    return None


def flag(value):
    return value if isinstance(value, bool) else None


def safe_timestamp(value):
    if not isinstance(value, str) or len(value) > 48 or not re.match(r"^20\d\d-\d\d-\d\dT", value):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.isoformat() if parsed.tzinfo is not None else None
    except ValueError:
        return None


def project(kind, raw):
    if not isinstance(raw, dict):
        return None
    if kind == "autonomous_run":
        return {
            "state": text(raw.get("state")), "agent": text(raw.get("agent")),
            "recordedAt": safe_timestamp(raw.get("recorded_at")),
            "attempts": count(raw.get("attempts")), "completed": count(raw.get("completed")),
            "failed": count(raw.get("failed")), "remaining": count(raw.get("remaining")),
            "trainedThisRun": count(raw.get("trained_this_run")),
            "cacheHits": count(raw.get("cache_hits_this_run")),
            "llmAccepted": count(raw.get("llm_accepted")), "llmRejected": count(raw.get("llm_rejected")),
            "gemmaAccepted": count(raw.get("gemma_accepted")), "gemmaRejected": count(raw.get("gemma_rejected")),
            "pitQualified": flag(raw.get("pit_qualified")),
            "performanceApproved": flag(raw.get("performance_approved")),
            "executionAuthorized": flag(raw.get("execution_authorized")),
            "independentFuturePerformanceEstablished": flag(raw.get("independent_future_performance_established")),
        }
    if kind == "autonomous_result":
        return {
            "meanAp": metric(raw.get("mean_ap")),
            "stabilityAp": metric(raw.get("stability_ap")),
            "worstBalancedAccuracy": metric(raw.get("worst_balanced_accuracy")),
            "largestTrainGap": count(raw.get("largest_train_gap")),
            "pitQualified": flag(raw.get("pit_qualified")),
            "performanceApproved": flag(raw.get("performance_approved")),
            "executionAuthorized": flag(raw.get("execution_authorized")),
            "hasDeferredDiagnostic": isinstance(raw.get("deferred_diagnostic"), dict),
            "hasRobustSummary": isinstance(raw.get("robust_summary"), dict),
            "hasGeneralizationTraining": isinstance(raw.get("generalization_training"), dict),
        }
    if kind == "autonomous_selection":
        return {
            "state": text(raw.get("state")), "agent": text(raw.get("agent")),
            "at": safe_timestamp(raw.get("at")),
            "historyCount": count(raw.get("history_count")),
            "adaptation": text(raw.get("adaptation")),
        }
    if kind == "autonomous_terminal":
        return {
            "state": text(raw.get("state")),
            "startedAt": safe_timestamp(raw.get("started_at")),
            "finishedAt": safe_timestamp(raw.get("finished_at")),
            "meanAp": metric(raw.get("mean_ap")),
            "stabilityAp": metric(raw.get("stability_ap")),
            "largestTrainGap": count(raw.get("largest_train_gap")),
        }
    return None


def load_study(path):
    if path.is_symlink() or not path.is_file() or path.stat().st_size > MAX_DB_BYTES:
        return None
    if any(Path(str(path) + suffix).exists() for suffix in ("-wal", "-journal", "-shm")):
        return None
    result = {"study": path.parent.name, "kinds": {}, "runs": [], "results": [], "selections": [], "terminals": [], "truncated": False}
    uri = path.resolve().as_uri() + "?mode=ro&immutable=1"
    with sqlite3.connect(uri, uri=True) as db:
        db.execute("PRAGMA query_only=ON")
        if db.execute("PRAGMA quick_check").fetchone() != ("ok",):
            return None
        if not db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='analysis_artifacts'").fetchone():
            return None
        for kind, key in (("autonomous_run", "runs"), ("autonomous_result", "results"),
                          ("autonomous_selection", "selections"), ("autonomous_terminal", "terminals")):
            total = db.execute("SELECT count(*) FROM analysis_artifacts WHERE kind=?", (kind,)).fetchone()[0]
            result["kinds"][kind] = total
            if total > MAX_ROWS_PER_KIND:
                result["truncated"] = True
            rows = db.execute(
                "SELECT payload FROM analysis_artifacts WHERE kind=? ORDER BY rowid LIMIT ?",
                (kind, MAX_ROWS_PER_KIND + 1),
            )
            for (payload,) in rows:
                if len(result[key]) >= MAX_ROWS_PER_KIND:
                    break
                if not isinstance(payload, (bytes, str)) or len(payload) > 2 * 1024 * 1024:
                    result["truncated"] = True
                    continue
                try:
                    record = project(kind, json.loads(payload))
                except (ValueError, TypeError, UnicodeDecodeError):
                    result["truncated"] = True
                    continue
                if record is None:
                    result["truncated"] = True
                else:
                    result[key].append(record)
    return result if any(result["kinds"].values()) else None


def export(root, output):
    root = root.expanduser()
    output = output.expanduser()
    if root.is_symlink() or not root.is_dir():
        raise ValueError("Research root must be an existing, non-symlink directory")
    allowed_root = Path.home() / "KRX-Private" / "Research"
    if root.resolve() != allowed_root.resolve():
        raise ValueError("Research root must be the operator-owned KRX-Private/Research directory")
    approved = Path.home() / "Library" / "Application Support" / "TrisMarketLens"
    if output.parent.resolve() != approved.resolve() or output.name != "autonomous-research-publication.json":
        raise ValueError("Output must be the fixed local TrisMarketLens Application Support publication")
    output.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    if output.is_symlink():
        raise ValueError("Output cannot be a symbolic link")
    if output.exists() and not output.is_file():
        raise ValueError("Output must be a regular file")
    studies = []
    skipped = 0
    paths = sorted(root.glob("*/experiments.sqlite3"))
    if len(paths) > MAX_STUDIES:
        raise ValueError("Research study count exceeds the bounded export limit")
    for path in paths:
        if not SAFE_NAME.fullmatch(path.parent.name) or path.parent.is_symlink():
            skipped += 1
            continue
        try:
            result = load_study(path)
        except (OSError, sqlite3.Error):
            result = None
        if result is None:
            skipped += 1
        else:
            studies.append(result)
    if not studies:
        raise ValueError("No eligible quiescent autonomous research records; no report was written")
    totals = Counter()
    for study in studies:
        totals.update(study["kinds"])
    report = {
        "schemaVersion": VERSION,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "scope": "operator_local_redacted_snapshot_not_a_live_api",
        "studyCount": len(studies),
        "skippedStudyCount": skipped,
        "aggregateCounts": {key: int(totals[key]) for key in ALLOWED_KINDS},
        "containsPartialStudies": any(study["truncated"] for study in studies) or skipped > 0,
        "studies": studies,
    }
    payload = json.dumps(report, ensure_ascii=True, separators=(",", ":"), allow_nan=False).encode()
    if len(payload) > 2 * 1024 * 1024:
        raise ValueError("Publication exceeds the bounded output size")
    fd, tmp = tempfile.mkstemp(prefix=".autonomous-research-", dir=output.parent)
    try:
        os.fchmod(fd, stat.S_IRUSR | stat.S_IWUSR)
        with os.fdopen(fd, "wb") as file:
            file.write(payload)
            file.flush()
            os.fsync(file.fileno())
        os.replace(tmp, output)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    return {"publishedStudies": len(studies), "skippedStudies": skipped,
            "aggregateCounts": report["aggregateCounts"], "containsPartialStudies": report["containsPartialStudies"]}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Local read-only autonomous research web publication")
    parser.add_argument("--research-root", type=Path, default=Path.home() / "KRX-Private/Research")
    parser.add_argument("--output", type=Path, default=Path.home() / "Library/Application Support/TrisMarketLens/autonomous-research-publication.json")
    args = parser.parse_args()
    try:
        print(json.dumps(export(args.research_root, args.output), sort_keys=True))
    except (OSError, ValueError) as exc:
        parser.exit(1, "Publication unavailable: " + str(exc) + "\n")
