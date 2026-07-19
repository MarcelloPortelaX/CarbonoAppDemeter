from __future__ import annotations

import json
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []

for path in ROOT.rglob("*.json"):
    if "node_modules" in path.parts:
        continue
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"JSON {path.relative_to(ROOT)}: {exc}")

for pattern in ("*.yaml", "*.yml"):
    for path in ROOT.rglob(pattern):
        if "node_modules" in path.parts:
            continue
        try:
            yaml.safe_load(path.read_text(encoding="utf-8"))
        except yaml.YAMLError as exc:
            errors.append(f"YAML {path.relative_to(ROOT)}: {exc}")

if errors:
    print("\n".join(errors))
    raise SystemExit(1)
print("JSON/YAML OK")
