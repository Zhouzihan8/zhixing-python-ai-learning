"""真实 sklearn 分类；先在同一虚拟环境安装 scikit-learn。"""
import json
from pathlib import Path
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
import 我的项目 as work

X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, random_state=7)
model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
model.fit(X_train, y_train)
predicted = model.predict(X_test)
report = {"model": "scaled_logistic_regression", "seed": 7,
          "positive_class": "数据集标签 1（良性），指标仅用于学习，不作医学判断",
          "metrics": work.evaluate_binary(y_test.tolist(), predicted.tolist()),
          "error_indices_in_test": [i for i,(a,b) in enumerate(zip(y_test,predicted)) if a != b]}
root = Path(__file__).resolve().parent
(root / "outputs").mkdir(exist_ok=True)
(root / "outputs/model_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(report)
