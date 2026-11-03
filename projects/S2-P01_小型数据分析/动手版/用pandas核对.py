"""先完成我的项目.py；当前解释器需 pandas 和 matplotlib。"""
import csv
import json
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt
import 我的项目 as work

root = Path(__file__).resolve().parent
with (root / "data/records.csv").open(encoding="utf-8", newline="") as f:
    rows = list(csv.DictReader(f))
expected = work.summarize(work.clean_rows(rows))
df = pd.read_csv(root / "data/records.csv", dtype=str)
df["minutes"] = pd.to_numeric(df["minutes"], errors="coerce")
df["topic"] = df["topic"].str.strip().str.lower()
clean = df[df["minutes"].notna() & (df["minutes"] >= 0) & (df["topic"].str.len() > 0)].copy()
# 本项目契约为整数分钟，不把小数静默截断。
clean = clean[clean["minutes"] % 1 == 0].drop_duplicates("id", keep="first")
actual = clean.groupby("topic")["minutes"].sum().to_dict()
assert actual == expected, (actual, expected)
output = root / "outputs"
output.mkdir(exist_ok=True)
clean.to_csv(output / "clean.csv", index=False)
(output / "totals.json").write_text(json.dumps(actual,ensure_ascii=False,indent=2),encoding="utf-8")
pd.Series(actual).plot.bar(color=["#356f9b", "#31806a"])
plt.ylabel("Minutes")
plt.tight_layout()
plt.savefig(output / "topic_minutes.png")
plt.close()
print("两版统计一致；已保存清理表、数值与图。")
