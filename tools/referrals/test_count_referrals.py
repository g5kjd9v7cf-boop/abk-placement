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


DEFAULT_PERIOD = "2026-11"


def snapshot(out: Path, code: str | None = None, period: str = DEFAULT_PERIOD) -> Path:
    label = f"{code}-{period}" if code else period
    return out.parent / f"zaehlung-{label}.csv"


def run(
    directory: Path,
    marketers: Path,
    candidates: Path,
    out: Path,
    code: str | None = None,
    extra: list[str] | None = None,
    period: str = DEFAULT_PERIOD,
):
    cmd = [
        sys.executable,
        str(SCRIPT),
        "--marketers",
        str(marketers),
        "--candidates",
        str(candidates),
        "--out",
        str(out),
        "--period",
        period,
    ]
    if code:
        cmd.extend(["--code", code])
    if extra:
        cmd.extend(extra)
    return subprocess.run(cmd, cwd=directory, capture_output=True, text=True)


def read_counts(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def summaries(path: Path) -> dict[str, dict[str, str]]:
    return {row["code"]: row for row in read_counts(path) if row["country"] == "gesamt"}


class CountReferralTests(unittest.TestCase):
    def test_suppresses_below_three_and_shows_three(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            marketers = write_csv(folder, "marketers.csv", MARKETERS)
            candidates = write_csv(
                folder,
                "candidates.csv",
                """candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date,full_name,country_of_residence
CID-SECRET-1,M001,yes,yes,2026-01-15,2026-06-01,Fullname Geheim Eins
CID-SECRET-2,M001,yes,yes,2026-02-01,2026-03-01,Fullname Geheim Zwei
CID-SECRET-3,M001,yes,no,2026-03-01,,Fullname Geheim Drei
CID-SECRET-4,M002,yes,no,2026-04-01,,Fullname Geheim Vier
CID-SECRET-5,direkt,yes,yes,2026-01-01,2026-02-01,Fullname Geheim Direkt
""",
            )
            out = folder / "counts.csv"
            proc = run(folder, marketers, candidates, out)
            written = snapshot(out)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            self.assertNotIn("name", written.read_text(encoding="utf-8").splitlines()[0])
            rows = summaries(written)
            self.assertEqual(list(rows), ["M001", "M002", "M003"])
            self.assertEqual(rows["M001"]["in_pool"], "3")
            self.assertEqual(rows["M001"]["contracts_placed"], "<3")
            self.assertEqual(rows["M002"]["in_pool"], "<3")
            self.assertEqual(rows["M002"]["contracts_placed"], "<3")
            self.assertEqual(rows["M003"]["in_pool"], "<3")
            blob = written.read_text(encoding="utf-8") + proc.stdout + proc.stderr
            for secret in SECRETS:
                self.assertNotIn(secret, blob)

    def test_first_code_wins_and_later_row_is_ignored(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            marketers = write_csv(folder, "marketers.csv", MARKETERS)
            candidates = write_csv(
                folder,
                "candidates.csv",
                """candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date,country_of_residence
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
            written = snapshot(out)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            self.assertIn("früheste Kontakt", proc.stderr)
            rows = summaries(written)
            self.assertEqual(rows["M001"]["in_pool"], "3")
            self.assertEqual(rows["M001"]["contracts_placed"], "<3")
            self.assertEqual(rows["M002"]["in_pool"], "<3")
            self.assertEqual(rows["M002"]["contracts_placed"], "<3")
            self.assertEqual(rows["M003"]["in_pool"], "3")
            self.assertNotIn("CID-SECRET", written.read_text(encoding="utf-8") + proc.stderr)

    def test_twelve_month_window_is_inclusive(self) -> None:
        header = "candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date,country_of_residence\n"
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
            self.assertEqual(read_counts(snapshot(out_in, "M001"))[0]["contracts_placed"], "3")

            out_file = write_csv(folder, "outside.csv", outside + "\n")
            out_out = folder / "out.csv"
            proc_out = run(folder, marketers, out_file, out_out, code="M001")
            self.assertEqual(proc_out.returncode, 0, proc_out.stderr)
            self.assertEqual(read_counts(snapshot(out_out, "M001"))[0]["contracts_placed"], "<3")
            self.assertIn("12 Monaten", proc_out.stderr)
            self.assertNotIn("CID-SECRET", proc_out.stderr)

    def test_missing_contract_date_does_not_count_or_leak(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            marketers = write_csv(folder, "marketers.csv", MARKETERS)
            candidates = write_csv(
                folder,
                "candidates.csv",
                """candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date,country_of_residence
CID-SECRET-1,M001,no,yes,2026-01-01,
CID-SECRET-2,M001,no,yes,2026-01-02,
CID-SECRET-3,M001,no,yes,2026-01-03,
""",
            )
            out = folder / "counts.csv"
            proc = run(folder, marketers, candidates, out, code="M001")
            written = snapshot(out, "M001")
            self.assertEqual(proc.returncode, 0, proc.stderr)
            row = read_counts(written)[0]
            self.assertEqual(row["contracts_placed"], "<3")
            self.assertIn("ohne Platzierungsdatum", proc.stderr)
            self.assertNotIn("CID-SECRET", proc.stderr + written.read_text(encoding="utf-8"))

    def test_bad_date_is_rejected_without_the_cell_value(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            marketers = write_csv(folder, "marketers.csv", MARKETERS)
            candidates = write_csv(
                folder,
                "candidates.csv",
                """candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date,country_of_residence
CID-SECRET-9,M001,yes,no,01.02.2026,
""",
            )
            out = folder / "counts.csv"
            proc = run(folder, marketers, candidates, out)
            self.assertEqual(proc.returncode, 2)
            self.assertFalse(out.exists())
            self.assertFalse(snapshot(out).exists())
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
                    """candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date,country_of_residence
CID-SECRET-1,M001,yes,no,2026-01-01,
""",
                )
                proc = run(folder, marketers, candidates, public)
                self.assertEqual(proc.returncode, 2)
                self.assertFalse(public.exists())
                self.assertFalse(snapshot(public).exists())
                self.assertNotIn("CID-SECRET", proc.stderr)
        finally:
            if public.exists():
                public.unlink()
            leaked = snapshot(public)
            if leaked.exists():
                leaked.unlink()

    def test_country_breakdown_suppresses_cells_under_three(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            marketers = write_csv(folder, "marketers.csv", MARKETERS)
            candidates = write_csv(
                folder,
                "candidates.csv",
                """candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date,country_of_residence
CID-SECRET-1,M001,yes,no,2026-01-01,,DE
CID-SECRET-2,M001,yes,no,2026-01-02,,de
CID-SECRET-3,M001,yes,no,2026-01-03,,DE
CID-SECRET-4,M001,yes,no,2026-01-04,,MA
CID-SECRET-5,M001,yes,no,2026-01-05,,MA
CID-SECRET-6,M001,yes,no,2026-01-06,,SY
CID-SECRET-7,M001,yes,no,2026-01-07,,
CID-SECRET-8,M001,no,no,2026-01-08,,FR
CID-SECRET-9,M001,yes,no,2026-01-09,,NotACountryNameXYZ
CID-SECRET-A,M002,yes,no,2026-02-01,,NG
CID-SECRET-B,M002,yes,no,2026-02-02,,KE
CID-SECRET-C,M001,yes,no,2026-01-10,,Anderes
CID-SECRET-D,M001,yes,no,2026-01-11,,other
CID-SECRET-E,M001,yes,no,2026-01-12,,other
""",
            )
            out = folder / "counts.csv"
            proc = run(folder, marketers, candidates, out)
            written = snapshot(out)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            text = written.read_text(encoding="utf-8")
            self.assertEqual(
                text.splitlines()[0],
                "code,country,in_pool,contracts_placed,countries",
            )
            self.assertNotIn("NotACountryNameXYZ", text + proc.stderr)
            self.assertNotIn("CID-SECRET", text + proc.stderr)
            self.assertNotIn("FR", text)
            self.assertNotIn("unbekannt", text)
            self.assertNotIn("keine_angabe", text)
            rows = read_counts(written)
            by_key = {(row["code"], row["country"]): row for row in rows}
            self.assertEqual(by_key[("M001", "gesamt")]["in_pool"], "11")
            self.assertEqual(by_key[("M001", "gesamt")]["countries"], "3")
            self.assertEqual(by_key[("M001", "DE")]["in_pool"], "3")
            self.assertEqual(by_key[("M001", "Andere")]["in_pool"], "8")
            self.assertNotIn(("M001", "MA"), by_key)
            self.assertNotIn(("M001", "SY"), by_key)
            self.assertNotIn(("M001", "other"), by_key)
            self.assertNotIn(("M001", "FR"), by_key)
            self.assertEqual(by_key[("M001", "DE")]["contracts_placed"], "")
            self.assertEqual(by_key[("M001", "DE")]["countries"], "")
            self.assertEqual(by_key[("M001", "Andere")]["contracts_placed"], "")
            self.assertEqual(by_key[("M002", "gesamt")]["in_pool"], "<3")
            self.assertEqual(by_key[("M002", "gesamt")]["countries"], "<10")
            self.assertNotIn(("M002", "NG"), by_key)
            self.assertNotIn(("M002", "KE"), by_key)
            self.assertNotIn(("M002", "Andere"), by_key)
            self.assert_no_small_remainder(rows)

            shown = folder / "shown.csv"
            proc_shown = run(
                folder,
                marketers,
                candidates,
                shown,
                code="M002",
                extra=["--distinct-countries-min", "0"],
            )
            self.assertEqual(proc_shown.returncode, 0, proc_shown.stderr)
            shown_rows = summaries(snapshot(shown, "M002"))
            self.assertEqual(shown_rows["M002"]["countries"], "2")

            week = folder / "week.csv"
            proc_week = run(folder, marketers, candidates, week, period="2026-W45")
            self.assertEqual(proc_week.returncode, 0, proc_week.stderr)
            self.assertTrue(snapshot(week, period="2026-W45").is_file())

    def test_anti_subtraction_folds_smallest_named_country(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            marketers = write_csv(folder, "marketers.csv", MARKETERS)
            candidates = write_csv(
                folder,
                "candidates.csv",
                """candidate_id,ref_code,in_pool,contract_placed,first_contact_date,contract_placed_date,country_of_residence
CID-SECRET-1,M001,yes,yes,2026-01-01,2026-02-01,DE
CID-SECRET-2,M001,yes,yes,2026-01-02,2026-02-02,DE
CID-SECRET-3,M001,yes,yes,2026-01-03,2026-02-03,DE
CID-SECRET-4,M001,yes,no,2026-01-04,,DE
CID-SECRET-5,M001,yes,no,2026-01-05,,DE
CID-SECRET-6,M001,yes,no,2026-01-06,,MA
CID-SECRET-7,M001,yes,no,2026-01-07,,MA
CID-SECRET-8,M001,yes,no,2026-01-08,,MA
CID-SECRET-9,M001,yes,no,2026-01-09,,SY
CID-SECRET-A,M001,yes,no,2026-01-10,,keine_angabe
CID-SECRET-B,M002,yes,no,2026-02-01,,DE
CID-SECRET-C,M002,yes,no,2026-02-02,,DE
CID-SECRET-D,M002,yes,no,2026-02-03,,DE
CID-SECRET-E,M002,yes,no,2026-02-04,,DE
CID-SECRET-F,M002,yes,no,2026-02-05,,FR
CID-SECRET-G,M002,yes,no,2026-02-06,,FR
CID-SECRET-H,M002,yes,no,2026-02-07,,FR
CID-SECRET-I,M002,yes,no,2026-02-08,,FR
CID-SECRET-J,M002,yes,no,2026-02-09,,
CID-SECRET-K,M002,yes,no,2026-02-10,,
""",
            )
            out = folder / "counts.csv"
            proc = run(folder, marketers, candidates, out)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            rows = read_counts(snapshot(out))
            by_key = {(row["code"], row["country"]): row for row in rows}
            self.assertEqual(by_key[("M001", "gesamt")]["in_pool"], "10")
            self.assertEqual(by_key[("M001", "gesamt")]["countries"], "3")
            self.assertEqual(by_key[("M001", "gesamt")]["contracts_placed"], "3")
            self.assertEqual(by_key[("M001", "DE")]["in_pool"], "5")
            self.assertEqual(by_key[("M001", "Andere")]["in_pool"], "5")
            self.assertNotIn(("M001", "MA"), by_key)
            self.assertNotIn(("M001", "SY"), by_key)
            self.assertNotIn(("M001", "keine_angabe"), by_key)
            self.assertEqual(by_key[("M002", "gesamt")]["in_pool"], "10")
            self.assertEqual(by_key[("M002", "DE")]["in_pool"], "4")
            self.assertEqual(by_key[("M002", "Andere")]["in_pool"], "6")
            self.assertNotIn(("M002", "FR"), by_key)
            self.assert_no_small_remainder(rows)

    def assert_no_small_remainder(self, rows: list[dict[str, str]]) -> None:
        grouped: dict[str, list[dict[str, str]]] = {}
        for row in rows:
            grouped.setdefault(row["code"], []).append(row)
        for code, group in grouped.items():
            total = next(row for row in group if row["country"] == "gesamt")
            parts = [row for row in group if row["country"] != "gesamt"]
            for row in parts:
                self.assertEqual(row["contracts_placed"], "", code)
                self.assertEqual(row["countries"], "", code)
                self.assertFalse(row["in_pool"].startswith("<"), row)
                self.assertGreaterEqual(int(row["in_pool"]), 3, row)
            if not str(total["in_pool"]).startswith("<"):
                self.assertEqual(sum(int(row["in_pool"]) for row in parts), int(total["in_pool"]), code)


if __name__ == "__main__":
    unittest.main()
