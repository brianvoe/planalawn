"""Rasterises the social card, the one image that cannot be a vector.

Run `npm run logo` to redraw the artwork and then this. public/og-image.jpg is
the committed artefact and nothing reads this at build time.

Everything about the brand is drawn in scripts/logo-mark.mjs and ships as SVG.
This exists only because link previews on Facebook, Slack, LinkedIn and the
rest will not fetch an SVG og:image — they show no thumbnail at all — and the
preview card is worth the one raster.

Nothing else here is raster. There is deliberately no apple-touch-icon: iOS
would need a PNG for it, and an icon that only appears once someone adds the
site to their home screen is not worth keeping a second image pipeline alive.
"""

import sys
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts/og-card.svg"
OUT = ROOT / "public/og-image.jpg"
WIDTH, HEIGHT = 1200, 630
QUALITY = 86


def main():
    if not SRC.exists():
        sys.exit(f"missing {SRC} — run `npm run logo:mark` first")

    page = pymupdf.open(SRC)[0]
    box = page.rect
    pix = page.get_pixmap(
        matrix=pymupdf.Matrix(WIDTH / box.width, HEIGHT / box.height), alpha=False
    )

    # get_pixmap rounds the transformed box outwards, so it can overshoot by a
    # pixel. Trimming beats scaling: the edge lost is a fraction of a percent.
    if (pix.width, pix.height) != (WIDTH, HEIGHT):
        pix = pymupdf.Pixmap(pix, pymupdf.IRect(0, 0, WIDTH, HEIGHT))

    OUT.write_bytes(pix.tobytes(output="jpeg", jpg_quality=QUALITY))
    print(f"{OUT.name:16} {pix.width} x {pix.height}   {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
