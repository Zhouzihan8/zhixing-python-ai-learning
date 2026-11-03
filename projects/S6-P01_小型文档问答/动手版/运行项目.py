import json
import sys
from pathlib import Path
import 我的项目 as work

ROOT = Path(__file__).resolve().parent
docs = json.loads((ROOT / "data/documents.json").read_text(encoding="utf-8"))
query = " ".join(sys.argv[1:]) or "python function"
hits = work.retrieve(query, docs)
result = {"mode": "lexical_retrieval_not_rag_generation", "query": query, "hits": hits, "context": work.make_context(hits)}

(ROOT / "outputs").mkdir(exist_ok=True)
(ROOT / "outputs/result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(result, ensure_ascii=False, indent=2))
