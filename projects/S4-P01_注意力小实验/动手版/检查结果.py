"""检查输入输出契约；可读参考答案，但通过检查不等于已经掌握。"""
import importlib.util
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
target = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "我的项目.py")
spec = importlib.util.spec_from_file_location("student_project", target)
work = importlib.util.module_from_spec(spec)
spec.loader.exec_module(work)

def close(actual, expected):
    if isinstance(expected, dict):
        return isinstance(actual, dict) and actual.keys() == expected.keys() and all(close(actual[k], v) for k, v in expected.items())
    if isinstance(expected, list):
        return isinstance(actual, (list, tuple)) and len(actual) == len(expected) and all(close(a, b) for a, b in zip(actual, expected))
    if isinstance(expected, (int, float)):
        return isinstance(actual, (int, float)) and math.isclose(actual, expected, abs_tol=1e-8, rel_tol=1e-8)
    return actual == expected

cases = json.loads((ROOT / "data/检查用例.json").read_text(encoding="utf-8"))
failed = 0
for number, (name, args, expected) in enumerate(cases, 1):
    try:
        actual = getattr(work, name)(*args)
        if not close(actual, expected):
            raise AssertionError(f"预期 {expected!r}，得到 {actual!r}")
        print(f"通过 {number}: {name}")
    except Exception as error:
        failed += 1
        print(f"待完成 {number}: {name} — {error}")
print("还需完成任务中的数据变更与解释。" if not failed else "先处理第一个未通过的例子，再运行检查。")
sys.exit(1 if failed else 0)
