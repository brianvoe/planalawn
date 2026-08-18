"""
NTEP PDF → JSON ingest for Plan a Lawn.

Focuses on high-value homeowner metrics (not every ancillary table):
- Transition / regional turf quality (incl. TN1 Knoxville when present)
- Genetic color
- Brown patch
- Drought stress quality (when present)
- Cultivar entry list

Usage:
  .venv/bin/python scripts/ntep/ingest_pdf.py \\
    --pdf scripts/ntep/cache/tf18_24-8.pdf \\
    --species tall_fescue \\
    --trial tf18 \\
    --year 2023 \\
    --out src/data/ntep
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path

import pymupdf


# A data row is a name followed by a run of numeric cells. The name is NOT
# constrained to exclude digits, because plenty of cultivars end in a number
# ("PPG-TF 316", "BRAVO 2"). Splitting name from values is decided by the
# column count taken from the table header, never by the regex — see
# split_row_values.
ROW_TAIL_RE = re.compile(
    r"^\s*\*?(?P<name>\S.*?)\s+(?P<nums>\d+(?:\.\d+)?(?:\s+\d+(?:\.\d+)?)+)\s*$"
)

# Word-boundary anchored: without \b, a real cultivar named e.g. "MEANDER"
# would be silently discarded as a summary row.
SKIP_NAME = re.compile(
    r"^(NAME|LSD|C\.?V\.?|MEAN|TABLE|GROWN|TURFGRASS|ENTRY|LOCATION|TOTAL)\b",
    re.I,
)


def clean_name(raw: str) -> str:
    """Collapse whitespace and drop the NTEP significance asterisk."""
    return re.sub(r"\s+", " ", raw.strip().strip("*").strip())


def split_name_code(name: str):
    """
    "FIERCE (K18-RS6)" -> ("FIERCE", "K18-RS6")

    NTEP lists a cultivar under its commercial name with the experimental code
    in parentheses in some tables, and under the bare code in others. Both
    halves are needed to recognise those as one cultivar.
    """
    m = re.match(r"^(.*?)\s*\(([^)]*)\)\s*$", name)
    if m and m.group(1).strip():
        return m.group(1).strip(), m.group(2).strip()
    return name.strip(), None


def norm_key(s: str) -> str:
    """
    Identity key that ignores case, spacing and punctuation, so the source
    PDF's own inconsistencies collapse instead of becoming separate cultivars:
    "RAD-TF 115"/"RAD-TF115" and "O'KEEFE"/"OKEEFE" are each one grass.
    """
    return re.sub(r"[^A-Z0-9]", "", (s or "").upper())


ROMAN_RE = re.compile(r"^(?:I{1,3}|IV|VI{0,3}|IX|XI{0,3})$")


def display_name(raw: str) -> str:
    """
    Title-case for display without mangling the codes NTEP embeds in names.
    Plain `.title()` turns "TAR HEEL III" into "Tar Heel Iii" and
    "TITANIUM G-LS" into "Titanium G-Ls".
    """
    if not raw.isupper():
        return raw

    def fix(token: str) -> str:
        if ROMAN_RE.match(token):
            return token
        # Anything carrying a digit, or with no vowel at all, is a breeder code
        # rather than a word ("DLFPS", "TF", "PST") and keeps its casing.
        if any(ch.isdigit() for ch in token):
            return token
        letters = re.sub(r"[^A-Z]", "", token)
        if letters and not set(letters) & set("AEIOUY"):
            return token
        return token.title()

    # Split on spaces and hyphens but keep the separators.
    return "".join(
        part if part in " -/" else fix(part) for part in re.split(r"([ \-/])", raw)
    )


def parse_header(text: str):
    """
    Column layout for a table, read from its header row rather than guessed.

    Returns (sites, has_entry, has_mean). `sites` is empty for tables whose
    columns are not locations (Table 15 is by month), in which case the caller
    falls back to the row-width mode.
    """
    for line in text.splitlines():
        upper = line.upper()
        if "NAME" not in upper:
            continue
        sites = re.findall(r"\b([A-Z]{2}\d)\b", upper)
        if sites or "MEAN" in upper:
            return sites, "ENTRY" in upper, "MEAN" in upper
    return [], False, False


def split_row_values(line: str, expected: int, has_entry: bool):
    """
    Separate a row into name / entry number / values using the known column
    count.

    Every numeric token beyond `expected` sits to the LEFT of the values. When
    the table has an ENTRY # column the last of those extras is the entry
    number; anything before it is part of the cultivar name. When it does not,
    all extras belong to the name. This is what keeps "PPG-TF 316" intact
    instead of reading 316 as an entry number and collapsing six distinct
    cultivars onto one key.
    """
    m = ROW_TAIL_RE.match(line.rstrip())
    if not m:
        return None
    name = m.group("name")
    tokens = m.group("nums").split()
    if len(tokens) < expected:
        return None

    extras = tokens[: len(tokens) - expected]
    values = tokens[len(tokens) - expected :]

    entry = None
    if has_entry and extras:
        entry = int(float(extras[-1]))
        extras = extras[:-1]
    if extras:
        name = f"{name} {' '.join(extras)}"

    name = clean_name(name)
    if not name or SKIP_NAME.match(name):
        return None
    return {"name": name, "entry": entry, "values": [float(v) for v in values]}


def pages_for_table(doc, table_num: int | str, title_hint: str = ""):
    pages = []
    start = None
    label = str(table_num)
    pat = re.compile(rf"TABLE\s+{re.escape(label)}\.", re.I)
    hint = title_hint.upper()
    for i, page in enumerate(doc):
        text = page.get_text()
        if pat.search(text) and (not hint or hint in text.upper()):
            if start is None:
                start = i
            pages.append(i)
        elif start is not None and pages and i > pages[-1] + 1:
            # allow contiguous continuation pages only
            # if we already started and this page doesn't match, stop when gap
            if not pat.search(text) and "(CONT" not in text.upper():
                # continuation pages still have TABLE N (CONT'D)
                if pages and i == pages[-1] + 1 and f"TABLE {table_num}" in text.upper().replace("TABLE  ", "TABLE "):
                    pages.append(i)
                elif pages and i > pages[-1] + 0:
                    # check CONT'D for same table
                    if f"TABLE {table_num}" in text.upper() or (
                        "(CONT" in text.upper() and hint and hint in text.upper()
                    ):
                        pages.append(i)
                    else:
                        break
    # Fallback: gather all matching pages
    if not pages:
        for i, page in enumerate(doc):
            text = page.get_text()
            if pat.search(text) and (not hint or hint in text.upper()):
                pages.append(i)
    return pages


def parse_table_pages(doc, page_indexes):
    """
    Parse every cultivar row across a table's pages.

    Two passes: the first establishes how many numeric columns a row has, the
    second uses that width to split names from values. Without a fixed width
    there is no way to tell a name's trailing digits from a data cell.
    """
    pages = [doc[i].get_text() for i in page_indexes]

    sites: list[str] = []
    has_entry = has_mean = False
    for text in pages:
        s, e, m = parse_header(text)
        if s or m:
            sites, has_entry, has_mean = s, e, m
            break

    if sites:
        expected = len(sites) + (1 if has_mean else 0)
    else:
        # Some tables' columns are months or stress measures rather than
        # locations, so the width has to come from the rows.
        #
        # Count only the decimal tokens. Ratings are always printed as X.Y,
        # while the integers in a row are the entry number and the digits that
        # belong to the cultivar's name. Counting every token instead breaks on
        # any trial whose names mostly end in numbers — nearly all of zoysia and
        # St. Augustine — because the mode then lands one column too wide and
        # every "DALZ 1701" loses its number into the data.
        widths = Counter()
        fallback = Counter()
        for text in pages:
            for line in text.splitlines():
                m = ROW_TAIL_RE.match(line.rstrip())
                if not m or SKIP_NAME.match(clean_name(m.group("name"))):
                    continue
                tokens = m.group("nums").split()
                fallback[len(tokens)] += 1
                decimals = [t for t in tokens if "." in t]
                if decimals:
                    widths[len(decimals)] += 1
        counts = widths or fallback
        if not counts:
            return {"sites": [], "rows": [], "expected": 0}
        expected = counts.most_common(1)[0][0]

    rows = []
    for text in pages:
        for line in text.splitlines():
            parsed = split_row_values(line, expected, has_entry)
            if not parsed:
                continue
            vals = parsed["values"]
            base, code = split_name_code(parsed["name"])
            record = {
                "name": parsed["name"],
                "base": base,
                "code": code,
                "entry": parsed["entry"],
                # MEAN is the last column. zip() stops at the shorter sequence,
                # so pairing sites with vals leaves that trailing mean unpaired.
                "mean": vals[-1] if has_mean else round(sum(vals) / len(vals), 2),
                "bySite": dict(zip(sites, vals)) if sites else {},
            }
            rows.append(record)
    return {"sites": sites, "rows": rows, "expected": expected}


class Identity:
    """
    Union-find over cultivar name keys.

    NTEP refers to the same grass by commercial name in one table and by
    experimental code in another, so rows must be joined on either. Merging by
    a single collapsed display name is what previously stitched four different
    PPG-TF entries into one record.
    """

    def __init__(self):
        self.parent: dict[str, str] = {}

    def find(self, key: str) -> str:
        self.parent.setdefault(key, key)
        while self.parent[key] != key:
            self.parent[key] = self.parent[self.parent[key]]
            key = self.parent[key]
        return key

    def union(self, *keys: str) -> str:
        keys = [k for k in keys if k]
        root = self.find(keys[0])
        for k in keys[1:]:
            other = self.find(k)
            if other != root:
                self.parent[other] = root
        return root

    def keys_for(self, row) -> list[str]:
        return [k for k in (norm_key(row["base"]), norm_key(row["code"])) if k]


# Metric key -> parsed table key. lpiGroup1 (Table 1) is listed last because
# it is the authoritative entry list, so its commercial names win the display
# name once every other table has been folded in.
METRIC_NOTE_LABELS = {
    "transitionQuality": "regional quality",
    "geneticColor": "genetic color",
    "brownPatch": "disease",
    "droughtQuality": "drought",
    "nationalMeanQuality": "national mean quality",
}

METRIC_SOURCES = [
    ("transitionQuality", "transitionQuality"),
    ("geneticColor", "geneticColor"),
    ("brownPatch", "brownPatch"),
    ("droughtQuality", "droughtQuality"),
    ("nationalMeanQuality", "lpiGroup1"),
]


def build_cultivar_index(tables: dict, warnings: list):
    """Combine metrics into one record per cultivar, joined on name or code."""
    ident = Identity()
    year = tables["meta"]["year"]

    # Establish identities across every table before assigning any metric, so a
    # cultivar named only by its code in one table still lands on the record
    # that carries its commercial name.
    for _, table_key in METRIC_SOURCES:
        for row in tables.get(table_key, {}).get("rows", []):
            ident.union(*ident.keys_for(row))

    records: dict[str, dict] = {}

    def ensure(row, authoritative: bool):
        root = ident.union(*ident.keys_for(row))
        c = records.setdefault(
            root,
            {"id": "", "name": "", "aliases": [], "metrics": {}, "entry": None},
        )
        # A row that names the cultivar commercially with its code in parens is
        # the better label; Table 1 breaks ties because it is the entry list.
        better = row["code"] is not None and (authoritative or not c["name"])
        if better or not c["name"]:
            c["name"] = display_name(row["base"])
        for alias in (row["name"], row["base"], row["code"]):
            if alias and alias not in c["aliases"]:
                c["aliases"].append(alias)
        if authoritative and row["entry"] is not None:
            c["entry"] = row["entry"]
        return c

    for metric_key, table_key in METRIC_SOURCES:
        table = tables.get(table_key)
        if not table:
            continue
        authoritative = table_key == "lpiGroup1"
        for row in table["rows"]:
            c = ensure(row, authoritative)
            if metric_key in c["metrics"]:
                warnings.append(
                    f"{metric_key}: duplicate rows collapsed onto {c['name']!r} "
                    f"({row['name']!r}) — check the source table"
                )
                continue
            c["metrics"][metric_key] = {
                "mean": row["mean"],
                "bySite": row["bySite"],
                "year": year,
            }
            # Knoxville is the transition-region site the app localizes against,
            # so it is promoted out of bySite into its own metric.
            if metric_key == "transitionQuality" and "TN1" in row["bySite"]:
                c["metrics"]["knoxvilleQuality"] = {
                    "mean": row["bySite"]["TN1"],
                    "year": year,
                }

    for root, c in records.items():
        c["id"] = re.sub(r"[^a-z0-9]+", "-", c["name"].lower()).strip("-") or root
        c["aliases"] = [a for a in c["aliases"] if a != c["name"]]

    return sorted(records.values(), key=lambda x: x["name"].lower())


RATING_MIN, RATING_MAX = 1.0, 9.0


def panel_size(tables: dict) -> int:
    """
    How many cultivars the trial entered.

    Table 1 is the entry list, so its row count is the panel. Reports that do
    not yield it fall back to the widest table parsed.
    """
    if "lpiGroup1" in tables:
        return len(tables["lpiGroup1"]["rows"])
    counts = [len(tables[key]["rows"]) for _, key in METRIC_SOURCES if key in tables]
    return max(counts) if counts else 0


def expected_metrics(tables: dict, panel: int) -> set[str]:
    """
    The metrics every cultivar in this report must carry.

    Only tables covering the whole panel qualify. Reports differ in what they
    measure — Kentucky bluegrass runs no drought trial at all — and several
    stress trials deliberately enter a subset, the way zoysia's large patch
    study takes 31 of 39 entries to one site in Florida. Demanding those of
    every cultivar would reject good data, so they are allowed to be partial
    and the UI reports the thinner coverage. A table that covers the panel is
    still mandatory for every cultivar, which is what catches a merge failure.
    """
    metrics = {
        metric
        for metric, table_key in METRIC_SOURCES
        if table_key in tables and len(tables[table_key]["rows"]) == panel
    }
    transition = tables.get("transitionQuality")
    if transition and "TN1" in transition["sites"] and "transitionQuality" in metrics:
        metrics.add("knoxvilleQuality")
    return metrics


def validate(tables: dict, cultivars: list, warnings: list):
    """
    Post-ingest assertions. Row identity problems are fatal, because a record
    silently built from two different grasses is worse than no data; value
    oddities are reported, since NTEP publishes some legitimately off-scale
    LPI-adjusted numbers.
    """
    errors = []

    counts = {
        key: len(tables[key]["rows"])
        for _, key in METRIC_SOURCES
        if key in tables
    }
    panel = panel_size(tables)

    # More rows than the trial has entries means the parser read something that
    # is not a cultivar, or ran two tables together off one page.
    oversized = {k: n for k, n in counts.items() if n > panel}
    if oversized:
        errors.append(f"tables longer than the {panel}-entry panel: {oversized}")

    if len(cultivars) != panel:
        errors.append(
            f"{len(cultivars)} cultivars built from a {panel}-entry panel"
        )

    expected = expected_metrics(tables, panel)
    partial = [c["name"] for c in cultivars if not expected <= set(c["metrics"])]
    if partial:
        errors.append(
            f"{len(partial)} cultivars missing full-panel metrics (merge failure): "
            f"{', '.join(partial[:12])}"
        )

    for key, n in sorted(counts.items()):
        if n < panel:
            warnings.append(f"{key}: {n} of {panel} entries — subset trial, scored where present")

    ids = Counter(c["id"] for c in cultivars)
    dupe_ids = [i for i, n in ids.items() if n > 1]
    if dupe_ids:
        errors.append(f"duplicate ids: {dupe_ids}")

    entries = Counter(c["entry"] for c in cultivars if c["entry"] is not None)
    dupe_entries = [e for e, n in entries.items() if n > 1]
    if dupe_entries:
        errors.append(f"duplicate entry numbers: {dupe_entries}")
    missing_entry = [c["name"] for c in cultivars if c["entry"] is None]
    if missing_entry:
        warnings.append(
            f"{len(missing_entry)} cultivars without an entry number: "
            f"{', '.join(missing_entry[:8])}"
        )

    used_sites = {
        code
        for c in cultivars
        for m in c["metrics"].values()
        for code in m.get("bySite", {})
    }
    unknown = sorted(used_sites - set(NTEP_SITES))
    if unknown:
        errors.append(f"site codes missing from NTEP_SITES: {unknown}")
    unused = sorted(set(NTEP_SITES) - used_sites)
    if unused:
        warnings.append(f"NTEP_SITES entries never referenced: {unused}")

    for c in cultivars:
        for key, m in c["metrics"].items():
            for label, v in [("mean", m["mean"]), *m.get("bySite", {}).items()]:
                if not RATING_MIN <= v <= RATING_MAX:
                    warnings.append(
                        f"{c['name']}/{key}/{label} = {v} outside the 1-9 scale"
                    )

    if errors:
        raise SystemExit(
            "Ingest validation failed:\n  - " + "\n  - ".join(errors)
        )


# Which numbered table holds which metric, per species report. The title hint
# is required to match on the page, so a report that numbers its tables
# differently fails loudly instead of writing the wrong metric.
#
# Two trials here have newer replacements that are deliberately not used yet.
# NTEP has retired tf18 and kb17 in favor of tf24 and kb23, but those report a
# single season (2025) of establishment data, where plot-to-plot differences
# still swamp cultivar differences. The reports below are the last published on
# mature stands, so they rank cultivars better despite the older date. Revisit
# once the new trials have three years behind them.
TABLE_LAYOUT = {
    # 2018 National Tall Fescue Test (tf18_24-8), superseded by tf24 — see above.
    "tall_fescue": [
        ("transitionQuality", 6, "TRANSITION"),
        ("geneticColor", 17, "GENETIC COLOR"),
        ("brownPatch", 27, "BROWN PATCH"),
        ("droughtQuality", 15, "DROUGHT"),
        ("lpiGroup1", 1, "LPI"),
    ],
    # 2019 National Bermudagrass Test final report (bg19_24-11f). "A" tables are
    # seeded + vegetative together. Spring dead spot fills the disease slot
    # (9 = no disease), same scale as tall fescue brown patch.
    "bermudagrass": [
        ("transitionQuality", "15A", "SCHEDULE B"),
        ("geneticColor", "32A", "GENETIC COLOR"),
        ("brownPatch", "50A", "SPRING DEAD SPOT"),
        ("droughtQuality", "23A", "DROUGHT"),
        ("lpiGroup1", "1A", "LPI"),
    ],
    # 2017 National Kentucky Bluegrass Test (kb17_23-9), superseded by kb23 —
    # see above. Three metrics only, and
    # that is the honest ceiling for this report: it runs no drought trial, and
    # its disease tables (stem rust, dollar spot, summer patch) are printed two
    # cultivars per line, which the row parser cannot split on text alone.
    # Cultivars therefore score on 3 of 5 factors and say so in the UI.
    "kentucky_bluegrass": [
        ("transitionQuality", 6, "TRANSITION REGION"),
        ("geneticColor", 12, "GENETIC COLOR"),
        ("lpiGroup1", 1, "LPI"),
    ],
    # 2022 National Perennial Ryegrass Test (pr22_26-5). No transition-region
    # table exists for a grass tested this far north, so the six-location North
    # Central table is the regional one. Brown patch is measured at a single
    # site on a fraction of the entries, so dollar spot — full panel, two sites
    # — takes the disease slot instead.
    "perennial_ryegrass": [
        ("transitionQuality", 6, "NORTH CENTRAL REGION"),
        ("geneticColor", 12, "GENETIC COLOR"),
        ("brownPatch", 22, "DOLLAR SPOT"),
        ("lpiGroup1", 1, "LPI"),
    ],
    # 2020 National Fineleaf Fescue Test (ff20_25-7). Every metric is split by
    # subspecies; the "A" tables are the combined fineleaf panel and the only
    # ones covering all 43 entries. The report groups locations by LPI rather
    # than region, so LPI group 2 supplies the second location set.
    "fine_fescue": [
        ("transitionQuality", "2A", "LPI"),
        ("geneticColor", "11A", "GENETIC COLOR"),
        ("brownPatch", "20A", "DOLLAR SPOT"),
        ("lpiGroup1", "1A", "LPI"),
    ],
    # 2019 National Zoysiagrass Test final report (zg19_24-12f). Mirrors the
    # bermuda layout: Schedule B is the broad regional table. Large patch is
    # the disease that decides zoysia, filling the brown-patch slot on the same
    # 1-9 scale where 9 is clean.
    "zoysiagrass": [
        ("transitionQuality", 15, "SCHEDULE B"),
        ("geneticColor", 20, "GENETIC COLOR"),
        ("brownPatch", 19, "LARGE PATCH"),
        ("droughtQuality", "17D", "DROUGHT"),
        ("lpiGroup1", 1, "LPI"),
    ],
    # 2023 National St. Augustinegrass Test (sa23_26-3). Gray leaf spot is the
    # disease for this species. Table 17 rates it at one site on part of the
    # panel; table 24 covers every entry, so that is the one used.
    "st_augustinegrass": [
        ("transitionQuality", 2, "LPI"),
        ("geneticColor", 6, "GENETIC COLOR"),
        ("brownPatch", 24, "GRAY LEAF SPOT"),
        ("droughtQuality", 4, "DROUGHT"),
        ("lpiGroup1", 1, "LPI"),
    ],
    # 2020 National Bentgrass Test, fairway/tee (bt20f_26-6). The fairway trial
    # is used rather than the putting-green one because it is mown at a height
    # a lawn could plausibly share. The water-use table is left out: it prints
    # two different column sets across its pages, which the row parser reads as
    # a double-length table rather than one trial.
    "creeping_bentgrass": [
        ("transitionQuality", 2, "LPI"),
        ("geneticColor", 6, "GENETIC COLOR"),
        ("brownPatch", 16, "BROWN PATCH"),
        ("lpiGroup1", 1, "LPI"),
    ],
    # 2023 National Seashore Paspalum Test (sp23_26-4). A seven-entry trial:
    # quality and color are the only tables covering the full panel, so these
    # cultivars score on two factors and the UI says so.
    "seashore_paspalum": [
        ("geneticColor", 5, "GENETIC COLOR"),
        ("lpiGroup1", 1, "LPI"),
    ],
}


# Every lawn grass the site is willing to name, whether or not we hold trial
# data for it — people have to be able to say what is already in their yard.
#
# Writes species.json, which is the single list behind every grass dropdown in
# the app, so entries are ordered the way they should read in a menu: cool
# season then warm, most common first. `status` records why a species has no
# scores yet:
#   schema_ready       NTEP has a current trial report we could still ingest.
#   no_national_trial  No current trial, so the species stays label-only.
# Adding an id here also means adding it to the glob in src/data/seedDb.ts.
SPECIES_CATALOG = {
    "tall_fescue": {
        "id": "tall_fescue",
        "label": "Tall fescue",
        "season": "cool",
        "ntepTrials": ["tf18"],
    },
    "kentucky_bluegrass": {
        "id": "kentucky_bluegrass",
        "label": "Kentucky bluegrass",
        "season": "cool",
        "ntepTrials": ["kb17"],
    },
    "perennial_ryegrass": {
        "id": "perennial_ryegrass",
        "label": "Perennial ryegrass",
        "season": "cool",
        "ntepTrials": ["pr22"],
    },
    "fine_fescue": {
        "id": "fine_fescue",
        "label": "Fine fescue",
        "season": "cool",
        "ntepTrials": ["ff20"],
    },
    "creeping_bentgrass": {
        "id": "creeping_bentgrass",
        "label": "Creeping bentgrass",
        "season": "cool",
        "ntepTrials": ["bt20f"],
    },
    "bermudagrass": {
        "id": "bermudagrass",
        "label": "Bermudagrass",
        "season": "warm",
        "ntepTrials": ["bg19"],
    },
    "zoysiagrass": {
        "id": "zoysiagrass",
        "label": "Zoysiagrass",
        "season": "warm",
        "ntepTrials": ["zg19"],
    },
    "st_augustinegrass": {
        "id": "st_augustinegrass",
        "label": "St. Augustinegrass",
        "season": "warm",
        "ntepTrials": ["sa23"],
    },
    # NTEP's only buffalograss test ran in 2002 (bu02_07-12f, 2003-06 data). Its
    # ten entries do include cultivars still sold — Bowie, Legacy, Texoka — but
    # omit Prestige, Cody and Sundancer, which is most of what a homeowner is
    # offered now. Scoring a third of the market on twenty-year-old ratings
    # would read as authoritative, so the species stays selectable but unscored.
    "buffalograss": {
        "id": "buffalograss",
        "label": "Buffalograss",
        "season": "warm",
        "ntepTrials": [],
        "status": "no_national_trial",
    },
    "seashore_paspalum": {
        "id": "seashore_paspalum",
        "label": "Seashore paspalum",
        "season": "warm",
        "ntepTrials": ["sp23"],
    },
    "centipedegrass": {
        "id": "centipedegrass",
        "label": "Centipedegrass",
        "season": "warm",
        "ntepTrials": [],
        "status": "no_national_trial",
    },
    "bahiagrass": {
        "id": "bahiagrass",
        "label": "Bahiagrass",
        "season": "warm",
        "ntepTrials": [],
        "status": "no_national_trial",
    },
}


# Transcribed from the trial's location table (source PDF page 5). Every code
# that appears in any parsed table must be listed here — validate() fails the
# ingest otherwise, which is how this drifted out of sync before.
NTEP_SITES = {
    "TN1": {"name": "Knoxville, TN", "state": "TN", "climateBand": "transition", "lat": 35.96, "lon": -83.92},
    "DE1": {"name": "Newark, DE", "state": "DE", "climateBand": "transition", "lat": 39.68, "lon": -75.75},
    "MD1": {"name": "College Park, MD", "state": "MD", "climateBand": "transition", "lat": 38.99, "lon": -76.94},
    "NC1": {"name": "Raleigh, NC", "state": "NC", "climateBand": "transition", "lat": 35.78, "lon": -78.64},
    "VA1": {"name": "Blacksburg, VA", "state": "VA", "climateBand": "transition", "lat": 37.23, "lon": -80.41},
    "KS1": {"name": "Manhattan, KS", "state": "KS", "climateBand": "transition", "lat": 39.18, "lon": -96.57},
    "OK1": {"name": "Stillwater, OK", "state": "OK", "climateBand": "transition", "lat": 36.12, "lon": -97.06},
    "GA1": {"name": "Griffin, GA", "state": "GA", "climateBand": "warm", "lat": 33.25, "lon": -84.28},
    "MS1": {"name": "Mississippi State, MS", "state": "MS", "climateBand": "warm", "lat": 33.45, "lon": -88.79},
    "NJ1": {"name": "North Brunswick, NJ", "state": "NJ", "climateBand": "cool", "lat": 40.45, "lon": -74.45},
    # NJ2 is Adelphia; NJ3 (not used here) is the North Brunswick traffic trial.
    "NJ2": {"name": "Adelphia, NJ", "state": "NJ", "climateBand": "cool", "lat": 40.19, "lon": -74.25},
    "IN1": {"name": "West Lafayette, IN", "state": "IN", "climateBand": "cool", "lat": 40.42, "lon": -86.91},
    "OR1": {"name": "Corvallis, OR", "state": "OR", "climateBand": "cool", "lat": 44.56, "lon": -123.26},
    "CT1": {"name": "Storrs, CT", "state": "CT", "climateBand": "cool", "lat": 41.81, "lon": -72.25},
    "IA1": {"name": "Ames, IA", "state": "IA", "climateBand": "cool", "lat": 42.03, "lon": -93.62},
    "MI1": {"name": "East Lansing, MI", "state": "MI", "climateBand": "cool", "lat": 42.73, "lon": -84.48},
    "NE1": {"name": "Mead, NE", "state": "NE", "climateBand": "cool", "lat": 41.23, "lon": -96.49},
    "UT1": {"name": "Logan, UT", "state": "UT", "climateBand": "cool", "lat": 41.74, "lon": -111.83},
    # 2017 National Kentucky Bluegrass Test additions (kb17).
    "MN1": {"name": "St. Paul, MN", "state": "MN", "climateBand": "cool", "lat": 44.98, "lon": -93.18},
    "ND1": {"name": "Fargo, ND", "state": "ND", "climateBand": "cool", "lat": 46.88, "lon": -96.79},
    # Guelph is in Ontario, so `state` holds a province and country is explicit.
    # Distance ranking still works; only the label needs the distinction.
    "ON1": {"name": "Guelph, ON", "state": "ON", "country": "CA", "climateBand": "cool", "lat": 43.53, "lon": -80.23},
    # 2019 National Bermudagrass Test locations (bg19). Codes already used by
    # the tall fescue trial keep their existing coords.
    "AL1": {"name": "Auburn, AL", "state": "AL", "climateBand": "warm", "lat": 32.61, "lon": -85.48},
    "AR1": {"name": "Fayetteville, AR", "state": "AR", "climateBand": "transition", "lat": 36.06, "lon": -94.16},
    "CA3": {"name": "Riverside, CA", "state": "CA", "climateBand": "warm", "lat": 33.95, "lon": -117.40},
    "FL3": {"name": "Jay, FL", "state": "FL", "climateBand": "warm", "lat": 30.95, "lon": -87.15},
    "FL5": {"name": "Fort Lauderdale, FL", "state": "FL", "climateBand": "warm", "lat": 26.12, "lon": -80.14},
    "KS2": {"name": "Wichita, KS", "state": "KS", "climateBand": "transition", "lat": 37.69, "lon": -97.34},
    "KY1": {"name": "Lexington, KY", "state": "KY", "climateBand": "transition", "lat": 38.04, "lon": -84.50},
    "MO1": {"name": "Columbia, MO", "state": "MO", "climateBand": "transition", "lat": 38.95, "lon": -92.33},
    "NM1": {"name": "Las Cruces, NM", "state": "NM", "climateBand": "warm", "lat": 32.32, "lon": -106.76},
    "NM2": {"name": "Las Cruces, NM (salinity)", "state": "NM", "climateBand": "warm", "lat": 32.32, "lon": -106.76},
    "NC2": {"name": "Raleigh, NC", "state": "NC", "climateBand": "transition", "lat": 35.78, "lon": -78.64},
    "OK2": {"name": "Stillwater, OK (divot)", "state": "OK", "climateBand": "transition", "lat": 36.12, "lon": -97.06},
    "OK3": {"name": "Stillwater, OK (1.5 in)", "state": "OK", "climateBand": "transition", "lat": 36.12, "lon": -97.06},
    "TN2": {"name": "Knoxville, TN (traffic)", "state": "TN", "climateBand": "transition", "lat": 35.96, "lon": -83.92},
    "TX2": {"name": "College Station, TX (drought)", "state": "TX", "climateBand": "warm", "lat": 30.63, "lon": -96.33},
    "TX3": {"name": "College Station, TX (shade)", "state": "TX", "climateBand": "warm", "lat": 30.63, "lon": -96.33},
    # 2022 perennial ryegrass, 2020 fineleaf fescue, 2020 bentgrass and 2019
    # zoysia additions. Suffixed codes are a second plot at a site already
    # listed, so they share its coordinates and say what makes them different.
    "FL1": {"name": "Gainesville, FL (shade)", "state": "FL", "climateBand": "warm", "lat": 29.65, "lon": -82.32},
    "IN2": {"name": "West Lafayette, IN (fairway)", "state": "IN", "climateBand": "cool", "lat": 40.42, "lon": -86.91},
    "MI2": {"name": "East Lansing, MI (no traffic)", "state": "MI", "climateBand": "cool", "lat": 42.73, "lon": -84.48},
    "OH1": {"name": "Columbus, OH", "state": "OH", "climateBand": "cool", "lat": 39.96, "lon": -83.00},
    "QE1": {"name": "Quebec City, QC", "state": "QC", "country": "CA", "climateBand": "cool", "lat": 46.81, "lon": -71.21},
    "VA2": {"name": "Blacksburg, VA (fairway)", "state": "VA", "climateBand": "transition", "lat": 37.23, "lon": -80.41},
    "WA1": {"name": "Pullman, WA", "state": "WA", "climateBand": "cool", "lat": 46.73, "lon": -117.18},
    "WI1": {"name": "Madison, WI", "state": "WI", "climateBand": "cool", "lat": 43.07, "lon": -89.40},
}


def ingest(pdf_path: Path, species: str, trial: str, year: int, out_dir: Path):
    if species not in SPECIES_CATALOG:
        raise SystemExit(
            f"Unknown species {species!r}. Add it to SPECIES_CATALOG first. "
            f"Known: {', '.join(sorted(SPECIES_CATALOG))}"
        )
    if species not in TABLE_LAYOUT:
        raise SystemExit(
            f"No table layout for {species!r}. Map its report's table numbers in "
            f"TABLE_LAYOUT before ingesting, or metrics will be silently wrong."
        )
    doc = pymupdf.open(pdf_path)
    meta = {
        "species": species,
        "trial": trial,
        "year": year,
        "sourcePdf": pdf_path.name,
        # Filled in below from the tables that actually parsed, because reports
        # differ in what they measure and a fixed blurb would overstate it.
        "notes": "",
    }

    tables = {"meta": meta}
    warnings: list[str] = []

    # Table numbers differ between species reports, so each is paired with a
    # title hint and the hint must be found on the page. A number alone would
    # happily parse the wrong metric into a correct-sounding key.
    for table_key, table_num, hint in TABLE_LAYOUT[species]:
        pages = pages_for_table(doc, table_num, hint)
        if not pages:
            warnings.append(f"table {table_num} ({hint}) not found — {table_key} skipped")
            continue
        tables[table_key] = parse_table_pages(doc, pages)
        tables[table_key]["pages"] = [p + 1 for p in pages]

    cultivars = build_cultivar_index(tables, warnings)
    for c in cultivars:
        c["species"] = species
        c["trial"] = trial

    parsed = ", ".join(
        METRIC_NOTE_LABELS[metric]
        for metric, table_key in METRIC_SOURCES
        if table_key in tables
    )
    meta["notes"] = f"Parsed high-value NTEP tables only ({parsed})."

    validate(tables, cultivars, warnings)

    out_dir.mkdir(parents=True, exist_ok=True)

    (out_dir / "species.json").write_text(json.dumps(list(SPECIES_CATALOG.values()), indent=2))
    (out_dir / "sites.json").write_text(json.dumps(NTEP_SITES, indent=2))
    (out_dir / f"tables_{trial}_{year}.json").write_text(json.dumps({
        "meta": meta,
        "tables": {k: v for k, v in tables.items() if k != "meta"},
    }, indent=2))

    # The file the app imports, one per species. Derived from `species` rather
    # than hardcoded, so ingesting a second species cannot overwrite the first
    # one's data. Trial and year live in `meta`, so no separate per-cycle copy
    # is written.
    (out_dir / f"cultivars_{species}.json").write_text(json.dumps({
        "meta": meta,
        "count": len(cultivars),
        "cultivars": cultivars,
    }, indent=2))

    for w in warnings:
        print(f"  warning: {w}")
    print(f"Wrote {len(cultivars)} cultivars → {out_dir}")
    return cultivars


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--species", default="tall_fescue")
    ap.add_argument("--trial", default="tf18")
    ap.add_argument("--year", type=int, default=2023)
    ap.add_argument("--out", default="src/data/ntep")
    args = ap.parse_args()
    ingest(Path(args.pdf), args.species, args.trial, args.year, Path(args.out))


if __name__ == "__main__":
    main()
