#!/usr/bin/env python3
"""Offline counts for marketer codes. Standard library only.

One code per candidate: the earliest first_contact_date wins. Later rows for
the same candidate_id are ignored. A contract counts only when that winning
row has contract_placed yes and contract_placed_date falls on or before the
first contact plus 12 calendar months. Pool membership is not limited by that
window.

Numbers below 3 are written as <3. Names and candidate ids are never written.
A country is named only when at least 3 people in the pool live there.
Smaller countries, other, unbekannt and keine_angabe fold into one Andere row.
If that row would stay under 3, the smallest named country is folded in as
well, until Andere reaches 3 or no named country remains. A remainder under 3
is omitted. The distinct-country count is shown only when the pool has at
least --distinct-countries-min people (default 10); otherwise the cell is <N.
Each run writes one dated snapshot for --period.
"""

from __future__ import annotations

import argparse
import calendar
import csv
import re
import sys
from datetime import date, datetime
from pathlib import Path

CODE_RE_TEXT = r"^M\d{3,4}$"
SUPPRESS_BELOW = 3
YES = {"yes", "ja", "y", "1", "true"}
NO = {"no", "nein", "n", "0", "false"}
MARKETER_COLUMNS = ("code", "name", "active")
CANDIDATE_COLUMNS = (
    "candidate_id",
    "ref_code",
    "in_pool",
    "contract_placed",
    "first_contact_date",
    "contract_placed_date",
    "country_of_residence",
)
TOTAL_ROW = "gesamt"
UNKNOWN_COUNTRY = "unbekannt"
OTHER_COUNTRY = "other"
FOLDED_ROW = "Andere"
DEFAULT_COUNTRIES_MIN = 10
# ISO 3166-1 alpha-2, plus XK for Kosovo. Free text is never copied into the report.
ISO_CODES = frozenset(
    """
    AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL
    BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV
    CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD
    GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM
    IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK
    LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW
    MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR
    PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS
    ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY
    UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW
    """.split()
)


class InputError(ValueError):
    """A problem in a CSV. The message must not contain cell values."""


def add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def suppress(count: int) -> str:
    if count >= SUPPRESS_BELOW:
        return str(count)
    return "<3"


def parse_date(text: str, line_no: int, column: str, required: bool) -> date | None:
    raw = (text or "").strip()
    if not raw:
        if required:
            raise InputError(f"Zeile {line_no}: Spalte {column} fehlt.")
        return None
    try:
        return datetime.strptime(raw, "%Y-%m-%d").date()
    except ValueError:
        raise InputError(
            f"Zeile {line_no}: Spalte {column} ist kein Datum JJJJ-MM-TT."
        ) from None


def parse_yes_no(text: str, line_no: int, column: str) -> bool:
    raw = (text or "").strip().lower()
    if raw in YES:
        return True
    if raw in NO or raw == "":
        return False
    raise InputError(f"Zeile {line_no}: Spalte {column} ist nicht ja oder nein.")


def normalize_country(text: str | None) -> str:
    raw = (text or "").strip()
    if not raw:
        return UNKNOWN_COUNTRY
    token = raw.casefold()
    if token in {"other", "anderes", "andere", "autre", "أخرى"}:
        return OTHER_COUNTRY
    if token in {"keine_angabe", "keine angabe", "non renseigné", "not specified", "غير محدد"}:
        return "keine_angabe"
    if token == UNKNOWN_COUNTRY:
        return UNKNOWN_COUNTRY
    code = raw.strip().upper()
    if code in ISO_CODES:
        return code
    return OTHER_COUNTRY


def distinct_countries(breakdown: dict[str, int]) -> int:
    return sum(1 for country, count in breakdown.items() if count > 0 and country in ISO_CODES)


def countries_cell(pool: int, distinct: int, minimum: int) -> str:
    if minimum > 0 and pool < minimum:
        return f"<{minimum}"
    return str(distinct)


def publish_countries(breakdown: dict[str, int]) -> tuple[dict[str, int], int]:
    """Name only residence countries with at least 3 people.

    Anything smaller, plus other, unbekannt and keine_angabe, goes into Andere.
    If Andere would stay under 3, fold the smallest named country into it so
    the total minus the visible rows cannot expose a count of 1 or 2. When
    counts tie, the alphabetically last code is folded first. If Andere is
    still under 3 and nothing named remains, omit the row.
    """
    named = {
        country: count
        for country, count in breakdown.items()
        if country in ISO_CODES and count >= SUPPRESS_BELOW
    }
    folded = sum(count for country, count in breakdown.items() if country not in named)
    while 0 < folded < SUPPRESS_BELOW and named:
        smallest = min(named.values())
        pick = max(country for country, count in named.items() if count == smallest)
        folded += named.pop(pick)
    if folded < SUPPRESS_BELOW:
        folded = 0
    return named, folded


def validate_period(value: str) -> str:
    text = (value or "").strip()
    if re.fullmatch(r"\d{4}-(?:0[1-9]|1[0-2])", text):
        return text
    if re.fullmatch(r"\d{4}-W(?:0[1-9]|[1-4]\d|5[0-3])", text):
        return text
    raise InputError("Zeitraum muss JJJJ-MM oder JJJJ-Wnn sein, zum Beispiel 2026-11 oder 2026-W45.")


def snapshot_path(out: Path, period: str, code: str | None) -> Path:
    directory = out.parent if out.suffix.lower() == ".csv" else out
    if code:
        name = f"zaehlung-{code}-{period}.csv"
    else:
        name = f"zaehlung-{period}.csv"
    return directory / name


def parse_active(text: str, line_no: int) -> bool:
    raw = (text or "").strip().lower()
    if raw in YES:
        return True
    if raw in NO:
        return False
    raise InputError(f"Zeile {line_no}: Spalte active ist nicht ja oder nein.")


def read_table(path: Path) -> tuple[list[str], list[tuple[int, dict[str, str]]]]:
    if not path.is_file():
        raise InputError(f"Datei fehlt: {path.name}")
    try:
        with path.open(newline="", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            if not reader.fieldnames:
                raise InputError(f"CSV ohne Kopfzeile: {path.name}")
            fields = [(name or "").strip() for name in reader.fieldnames]
            rows: list[tuple[int, dict[str, str]]] = []
            for line_no, raw in enumerate(reader, start=2):
                if raw is None:
                    continue
                values = {
                    (key or "").strip(): (value or "").strip()
                    for key, value in raw.items()
                    if key is not None
                }
                if not any(values.values()):
                    continue
                rows.append((line_no, values))
            return fields, rows
    except InputError:
        raise
    except OSError:
        raise InputError(f"Datei nicht lesbar: {path.name}") from None
    except csv.Error:
        raise InputError(f"CSV nicht lesbar: {path.name}") from None


def require_columns(fields: list[str], required: tuple[str, ...], label: str) -> None:
    missing = [name for name in required if name not in fields]
    if missing:
        raise InputError(f"{label}: Spalte {missing[0]} fehlt.")


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def inside(path: Path, parent: Path) -> bool:
    try:
        path.resolve().relative_to(parent.resolve())
        return True
    except ValueError:
        return False


def check_output_path(path: Path) -> None:
    root = repo_root()
    resolved = path.resolve()
    if not inside(resolved, root):
        return
    allowed = root / "tools" / "referrals"
    if not inside(resolved, allowed):
        raise InputError(
            "Die Zähldatei darf im Projekt nur unter tools/referrals/ liegen."
        )


def load_marketers(path: Path) -> list[dict[str, object]]:
    fields, rows = read_table(path)
    require_columns(fields, MARKETER_COLUMNS, path.name)
    seen: set[str] = set()
    marketers: list[dict[str, object]] = []
    for line_no, row in rows:
        code = row.get("code", "").strip().upper()
        if not re.fullmatch(CODE_RE_TEXT, code):
            raise InputError(f"Zeile {line_no}: Code entspricht nicht dem Muster M und 3 oder 4 Ziffern.")
        if code in seen:
            raise InputError(f"Zeile {line_no}: Code ist doppelt.")
        seen.add(code)
        marketers.append(
            {
                "code": code,
                "active": parse_active(row.get("active", ""), line_no),
            }
        )
    return marketers


def load_candidates(path: Path) -> list[dict[str, object]]:
    fields, rows = read_table(path)
    require_columns(fields, CANDIDATE_COLUMNS, path.name)
    candidates: list[dict[str, object]] = []
    for line_no, row in rows:
        candidate_id = row.get("candidate_id", "").strip()
        if not candidate_id:
            raise InputError(f"Zeile {line_no}: Spalte candidate_id fehlt.")
        first = parse_date(row.get("first_contact_date", ""), line_no, "first_contact_date", True)
        placed_raw = row.get("contract_placed_date", "")
        contract_placed = parse_yes_no(row.get("contract_placed", ""), line_no, "contract_placed")
        placed = parse_date(placed_raw, line_no, "contract_placed_date", False)
        candidates.append(
            {
                "line": line_no,
                "candidate_id": candidate_id,
                "ref_code": row.get("ref_code", "").strip().upper(),
                "in_pool": parse_yes_no(row.get("in_pool", ""), line_no, "in_pool"),
                "contract_placed": contract_placed,
                "first_contact": first,
                "contract_date": placed,
                "country": normalize_country(row.get("country_of_residence")),
            }
        )
    return candidates


def attribute(candidates: list[dict[str, object]]) -> tuple[list[dict[str, object]], int]:
    grouped: dict[str, dict[str, object]] = {}
    ignored = 0
    for row in candidates:
        key = str(row["candidate_id"])
        current = grouped.get(key)
        if current is None:
            grouped[key] = row
            continue
        ignored += 1
        current_key = (current["first_contact"], current["line"])
        row_key = (row["first_contact"], row["line"])
        if row_key < current_key:
            grouped[key] = row
    return list(grouped.values()), ignored


def contract_counts(row: dict[str, object]) -> str:
    """Return counted, missing_date, or outside."""
    if not row["contract_placed"]:
        return "no"
    placed = row["contract_date"]
    first = row["first_contact"]
    if not isinstance(placed, date) or not isinstance(first, date):
        return "missing_date"
    if placed < first or placed > add_months(first, 12):
        return "outside"
    return "counted"


def build_counts(
    marketers: list[dict[str, object]],
    candidates: list[dict[str, object]],
    countries_min: int = DEFAULT_COUNTRIES_MIN,
) -> tuple[list[dict[str, str]], dict[str, int]]:
    winners, ignored = attribute(candidates)
    known = {str(item["code"]) for item in marketers}
    totals = {str(item["code"]): {"pool": 0, "contracts": 0} for item in marketers}
    by_country: dict[str, dict[str, int]] = {str(item["code"]): {} for item in marketers}
    notes = {"duplicates": ignored, "missing_date": 0, "outside": 0, "unattributed": 0}
    for row in winners:
        code = str(row["ref_code"])
        if code not in known:
            notes["unattributed"] += 1
            continue
        if row["in_pool"]:
            totals[code]["pool"] += 1
            country = str(row["country"])
            by_country[code][country] = by_country[code].get(country, 0) + 1
        status = contract_counts(row)
        if status == "counted":
            totals[code]["contracts"] += 1
        elif status == "missing_date":
            notes["missing_date"] += 1
        elif status == "outside":
            notes["outside"] += 1
    rendered: list[dict[str, str]] = []
    for item in marketers:
        code = str(item["code"])
        pool = int(totals[code]["pool"])
        rendered.append(
            {
                "code": code,
                "country": TOTAL_ROW,
                "in_pool": suppress(pool),
                "contracts_placed": suppress(int(totals[code]["contracts"])),
                "countries": countries_cell(pool, distinct_countries(by_country[code]), countries_min),
            }
        )
        named, folded = publish_countries(by_country[code])
        for country in sorted(named):
            rendered.append(
                {
                    "code": code,
                    "country": country,
                    "in_pool": str(named[country]),
                    "contracts_placed": "",
                    "countries": "",
                }
            )
        if folded:
            rendered.append(
                {
                    "code": code,
                    "country": FOLDED_ROW,
                    "in_pool": str(folded),
                    "contracts_placed": "",
                    "countries": "",
                }
            )
    return rendered, notes


def write_counts(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["code", "country", "in_pool", "contracts_placed", "countries"],
            lineterminator="\n",
        )
        writer.writeheader()
        writer.writerows(rows)


def counted(amount: int, one: str, many: str) -> str:
    word = one if amount == 1 else many
    return f"{amount} {word}"


def print_notes(notes: dict[str, int]) -> None:
    if notes["duplicates"]:
        if notes["duplicates"] == 1:
            duplicate_note = "Hinweis: 1 zusätzliche Zeile derselben Kennung wurde ignoriert."
        else:
            duplicate_note = (
                f"Hinweis: {notes['duplicates']} zusätzliche Zeilen derselben Kennung wurden ignoriert."
            )
        print(
            duplicate_note + " Gezählt wurde nur der früheste Kontakt.",
            file=sys.stderr,
        )
    if notes["missing_date"]:
        print(
            "Hinweis: "
            + counted(notes["missing_date"], "Vertrag", "Verträge")
            + " ohne Platzierungsdatum, nicht gezählt.",
            file=sys.stderr,
        )
    if notes["outside"]:
        print(
            "Hinweis: "
            + counted(notes["outside"], "Vertrag", "Verträge")
            + " außerhalb von 12 Monaten, nicht gezählt.",
            file=sys.stderr,
        )


def warn_if_candidates_in_repo(path: Path) -> None:
    if inside(path.resolve(), repo_root()):
        print(
            "Hinweis: Die Kandidaten-Datei liegt im Projektordner. "
            "Nicht committen und nicht veröffentlichen.",
            file=sys.stderr,
        )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Zählt Pool und Verträge je Vermittler-Code. Gibt keine Namen aus."
    )
    parser.add_argument("--marketers", required=True, help="CSV mit code,name,active")
    parser.add_argument("--candidates", required=True, help="Lokale Export-CSV, nicht veröffentlichen")
    parser.add_argument("--out", required=True, help="Ordner für die Momentaufnahme")
    parser.add_argument("--period", required=True, help="Zeitraum JJJJ-MM oder JJJJ-Wnn, zum Beispiel 2026-11")
    parser.add_argument("--code", help="Nur diese eine Kennung in die Zähldatei schreiben")
    parser.add_argument(
        "--distinct-countries-min",
        type=int,
        default=DEFAULT_COUNTRIES_MIN,
        help="Länderzahl nur wenn der Pool mindestens so groß ist, sonst <N. 0 zeigt die Zahl immer. Standard: 10.",
    )
    args = parser.parse_args(argv)

    try:
        period = validate_period(args.period)
        code_for_name = None
        if args.code:
            code_for_name = args.code.strip().upper()
            if not re.fullmatch(CODE_RE_TEXT, code_for_name):
                raise InputError("Die gewählte Kennung entspricht nicht dem Muster.")
        out_path = snapshot_path(Path(args.out), period, code_for_name)
        check_output_path(out_path)
        marketers_path = Path(args.marketers)
        candidates_path = Path(args.candidates)
        warn_if_candidates_in_repo(candidates_path)
        marketers = load_marketers(marketers_path)
        if args.code:
            wanted = args.code.strip().upper()
            if wanted not in {str(item["code"]) for item in marketers}:
                raise InputError("Die gewählte Kennung steht nicht in der Vermittler-Datei.")
            marketers = [item for item in marketers if item["code"] == wanted]
        if args.distinct_countries_min < 0:
            raise InputError("distinct-countries-min darf nicht negativ sein.")
        candidates = load_candidates(candidates_path)
        rows, notes = build_counts(marketers, candidates, args.distinct_countries_min)
        write_counts(out_path, rows)
        print_notes(notes)
    except InputError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
