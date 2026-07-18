"""Comparação visual simples para screenshots do app.

Uso:
  python scripts/visual_diff.py --actual artifacts/validation/home-dark.png \
    --reference design/references/screens/home-dark-screen.png \
    --output artifacts/validation/home-dark-diff.png

A métrica não substitui revisão humana; ela ajuda a localizar divergências grandes.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageStat


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--actual", required=True)
    parser.add_argument("--reference", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    actual = Image.open(args.actual).convert("RGB")
    reference = Image.open(args.reference).convert("RGB")
    actual = actual.resize(reference.size, Image.Resampling.LANCZOS)
    diff = ImageChops.difference(actual, reference)
    stat = ImageStat.Stat(diff)
    mae = sum(stat.mean) / (3 * 255)
    similarity = max(0.0, 1.0 - mae)
    enhanced = ImageEnhance.Contrast(diff).enhance(3.0)
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    enhanced.save(out)
    print(f"pixel_similarity={similarity:.4f}")
    print("Observação: valide também tipografia, hierarquia, estados e acessibilidade manualmente.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
