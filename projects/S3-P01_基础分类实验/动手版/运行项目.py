import json
import sys
from pathlib import Path
import 我的项目 as work

ROOT = Path(__file__).resolve().parent
data = json.loads((ROOT / "data/predictions.json").read_text(encoding="utf-8"))
result = work.evaluate_binary(data["truth"], data["predicted"])

(ROOT / "outputs").mkdir(exist_ok=True)
(ROOT / "outputs/result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(result, ensure_ascii=False, indent=2))
