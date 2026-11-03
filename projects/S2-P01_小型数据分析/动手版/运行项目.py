import json
import sys
from pathlib import Path
import 我的项目 as work
import csv

ROOT = Path(__file__).resolve().parent
with (ROOT / "data/records.csv").open(encoding="utf-8", newline="") as stream:
    rows = list(csv.DictReader(stream))
clean = work.clean_rows(rows)
result = {"raw_count": len(rows), "clean_count": len(clean), "totals": work.summarize(clean)}

(ROOT / "outputs").mkdir(exist_ok=True)
(ROOT / "outputs/result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(result, ensure_ascii=False, indent=2))
