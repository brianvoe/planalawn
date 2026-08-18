"""
List the tables in an NTEP report, so TABLE_LAYOUT can be mapped by reading
what a report actually contains rather than assuming last year's numbering.

Prints one line per table: number, page, parsed column layout, and the title
as printed. The site codes matter as much as the title — a quality table with
no locations is a summary, not the regional table the app scores against.

  .venv/bin/python scripts/ntep/list_tables.py scripts/ntep/cache/pr22_26-5.pdf
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import pymupdf

from ingest_pdf import ROW_TAIL_RE, SKIP_NAME, clean_name, parse_header

TABLE_RE = re.compile(r"TABLE\s+([0-9]+[A-Z]?)\.\s*(.*)", re.I)


def title_for(text: str, match: re.Match) -> str:
    """NTEP wraps table titles over several lines; stop at the header row."""
    lines = text[match.start():].splitlines()
    parts = [lines[0]]
    for line in lines[1:6]:
        if "NAME" in line.upper() or not line.strip():
            break
        parts.append(line.strip())
    title = " ".join(parts)
    title = re.sub(r"\s+", " ", title)
    return title[:150]


def row_count(text: str) -> int:
    n = 0
    for line in text.splitlines():
        m = ROW_TAIL_RE.match(line.rstrip())
        if m and not SKIP_NAME.match(clean_name(m.group("name"))):
            n += 1
    return n


def main(path: str) -> None:
    doc = pymupdf.open(path)
    seen: set[str] = set()
    for i, page in enumerate(doc):
        text = page.get_text()
        for m in TABLE_RE.finditer(text):
            num = m.group(1).upper()
            title = title_for(text, m)
            if "CONT" in title.upper()[:40] and num in seen:
                continue
            seen.add(num)
            sites, has_entry, has_mean = parse_header(text)
            flags = []
            if has_entry:
                flags.append("ENTRY")
            if has_mean:
                flags.append("MEAN")
            print(
                f"p{i + 1:>3}  T{num:<4} rows={row_count(text):<4} "
                f"sites={','.join(sites) or '-':<40} {'+'.join(flags):<11} {title}"
            )


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "scripts/ntep/cache/pr22_26-5.pdf")
