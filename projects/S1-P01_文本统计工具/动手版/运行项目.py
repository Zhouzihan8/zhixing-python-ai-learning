import json
import sys
from pathlib import Path
import 我的项目 as work

ROOT = Path(__file__).resolve().parent
text = (ROOT / "data/sample.txt").read_text(encoding="utf-8")
counts = work.count_words(text)
result = {"counts": counts, "top": work.top_words(counts)}

(ROOT / "outputs").mkdir(exist_ok=True)
(ROOT / "outputs/result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(result, ensure_ascii=False, indent=2))
