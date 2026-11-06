#!/usr/bin/env python3
"""Counts stay anonymous: first code, 12-month window, numbers under 3 hidden."""

from __future__ import annotations

import csv
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = Path(__file__).resolve().parent / "count_referrals.py"
MARKETERS = """code,name,active
M001,Beispiel Mueller XYZ,yes
M002,Beispiel Schmidt XYZ,yes
M003,Beispiel Inaktiv XYZ,no
"""
SECRETS = (
    "Mueller",
    "Schmidt",
    "Inaktiv",
    "XYZ",
    "CID-SECRET",
    "Fullname Geheim",
    "01.02.2026",
)


def write_csv(directory: Path, name: str, text: str) -> Path:
    path = directory / name
    path.write_text(text, encoding="utf-8")
    return path


def run(directory: Path, marketers: Path, candidates: Path, out: Path, code: str | None = None):
    cmd = [
        sys.executable,
        str(SCRIPT),
        "--marketers",
        str(marketers),
        "--candidates",
        str(candidates),
        "--out",
        str(out),
    ]
    if code:
        cmd.extend(["--code", code])
    return subprocess.run(cmd, cwd=directory, capture_output=True, text=True)


def read_counts(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


class CountReferralTests(unittest.TestCase):
    def test_suppresses_below_three_and_shows_three(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            marketers = write_csv(folder, "marketers.csv", MARKETERS)
            candidates = write_csv(
                folder,
                "candidates.csv",
                """candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date,full_name
CID-SECRET-1,M001,yes,yes,2026-01-15,2026-06-01,Fullname Geheim Eins
CID-SECRET-2,M001,yes,yes,2026-02-01,2026-03-01,Fullname Geheim Zwei
CID-SECRET-3,M001,yes,no,2026-03-01,,Fullname Geheim Drei
CID-SECRET-4,M002,yes,no,2026-04-01,,Fullname Geheim Vier
CID-SECRET-5,direkt,yes,yes,2026-01-01,2026-02-01,Fullname Geheim Direkt
""",
            )
            out = folder / "counts.csv"
            proc = run(folder, marketers, candidates, out)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            self.assertNotIn("name", out.read_text(encoding="utf-8").splitlines()[0])
            rows = {row["code"]: row for row in read_counts(out)}
            self.assertEqual(list(rows), ["M001", "M002", "M003"])
            self.assertEqual(rows["M001"]["in_pool"], "3")
            self.assertEqual(rows["M001"]["contracts_placed"], "<3")
            self.assertEqual(rows["M002"]["in_pool"], "<3")
            self.assertEqual(rows["M002"]["contracts_placed"], "<3")
            self.assertEqual(rows["M003"]["in_pool"], "<3")
            blob = out.read_text(encoding="utf-8") + proc.stdout + proc.stderr
            for secret in SECRETS:
                self.assertNotIn(secret, blob)

    def test_first_code_wins_and_later_row_is_ignored(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            marketers = write_csv(folder, "marketers.csv", MARKETERS)
            candidates = write_csv(
                folder,
                "candidates.csv",
                """candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date
CID-SECRET-1,M001,yes,yes,2026-01-01,2026-02-01
CID-SECRET-1,M002,yes,yes,2026-06-01,2026-07-01
CID-SECRET-2,M001,yes,yes,2026-01-02,2026-02-02
CID-SECRET-3,M001,yes,no,2026-01-03,
CID-SECRET-6,M003,yes,no,2026-05-01,
CID-SECRET-7,M003,yes,no,2026-05-02,
CID-SECRET-8,M003,yes,no,2026-05-03,
""",
            )
            out = folder / "counts.csv"
            proc = run(folder, marketers, candidates, out)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            self.assertIn("früheste Kontakt", proc.stderr)
            rows = {row["code"]: row for row in read_counts(out)}
            self.assertEqual(rows["M001"]["in_pool"], "3")
            self.assertEqual(rows["M001"]["contracts_placed"], "<3")
            self.assertEqual(rows["M002"]["in_pool"], "<3")
            self.assertEqual(rows["M002"]["contracts_placed"], "<3")
            self.assertEqual(rows["M003"]["in_pool"], "3")
            self.assertNotIn("CID-SECRET", out.read_text(encoding="utf-8") + proc.stderr)

    def test_twelve_month_window_is_inclusive(self) -> None:
        header = "candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date\n"
        inside = header + "\n".join(
            [
                "CID-SECRET-A,M001,yes,yes,2026-01-15,2027-01-15",
                "CID-SECRET-B,M001,yes,yes,2024-02-29,2025-02-28",
                "CID-SECRET-C,M001,yes,yes,2026-03-01,2026-03-01",
            ]
        )
        outside = header + "\n".join(
            [
                "CID-SECRET-A,M001,yes,yes,2026-01-15,2027-01-16",
                "CID-SECRET-B,M001,yes,yes,2024-02-29,2025-03-01",
                "CID-SECRET-C,M001,yes,yes,2026-04-01,2026-03-01",
            ]
        )
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            marketers = write_csv(folder, "marketers.csv", MARKETERS)
            in_file = write_csv(folder, "inside.csv", inside + "\n")
            out_in = folder / "in.csv"
            proc_in = run(folder, marketers, in_file, out_in, code="M001")
            self.assertEqual(proc_in.returncode, 0, proc_in.stderr)
            self.assertEqual(read_counts(out_in)[0]["contracts_placed"], "3")

            out_file = write_csv(folder, "outside.csv", outside + "\n")
            out_out = folder / "out.csv"
            proc_out = run(folder, marketers, out_file, out_out, code="M001")
            self.assertEqual(proc_out.returncode, 0, proc_out.stderr)
            self.assertEqual(read_counts(out_out)[0]["contracts_placed"], "<3")
            self.assertIn("12 Monaten", proc_out.stderr)
            self.assertNotIn("CID-SECRET", proc_out.stderr)

    def test_missing_contract_date_does_not_count_or_leak(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            marketers = write_csv(folder, "marketers.csv", MARKETERS)
            candidates = write_csv(
                folder,
                "candidates.csv",
                """candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date
CID-SECRET-1,M001,no,yes,2026-01-01,
CID-SECRET-2,M001,no,yes,2026-01-02,
CID-SECRET-3,M001,no,yes,2026-01-03,
""",
            )
            out = folder / "counts.csv"
            proc = run(folder, marketers, candidates, out, code="M001")
            self.assertEqual(proc.returncode, 0, proc.stderr)
            row = read_counts(out)[0]
            self.assertEqual(row["contracts_placed"], "<3")
            self.assertIn("ohne Platzierungsdatum", proc.stderr)
            self.assertNotIn("CID-SECRET", proc.stderr + out.read_text(encoding="utf-8"))

    def test_bad_date_is_rejected_without_the_cell_value(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            marketers = write_csv(folder, "marketers.csv", MARKETERS)
            candidates = write_csv(
                folder,
                "candidates.csv",
                """candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date
CID-SECRET-9,M001,yes,no,01.02.2026,
""",
            )
            out = folder / "counts.csv"
            proc = run(folder, marketers, candidates, out)
            self.assertEqual(proc.returncode, 2)
            self.assertFalse(out.exists())
            self.assertNotIn("01.02.2026", proc.stderr)
            self.assertNotIn("CID-SECRET", proc.stderr)
            self.assertIn("JJJJ-MM-TT", proc.stderr)

    def test_refuses_to_write_counts_into_the_published_site(self) -> None:
        public = ROOT / "public-counts.csv"
        try:
            with tempfile.TemporaryDirectory() as tmp:
                folder = Path(tmp)
                marketers = write_csv(folder, "marketers.csv", MARKETERS)
                candidates = write_csv(
                    folder,
                    "candidates.csv",
                    """candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date
CID-SECRET-1,M001,yes,no,2026-01-01,
""",
                )
                proc = run(folder, marketers, candidates, public)
                self.assertEqual(proc.returncode, 2)
                self.assertFalse(public.exists())
                self.assertNotIn("CID-SECRET", proc.stderr)
        finally:
            if public.exists():
                public.unlink()


if __name__ == "__main__":
    unittest.main()
