"""真实 PyTorch 分类；依赖 torch、scikit-learn。复用自己的评价函数。"""
import json
from pathlib import Path
import torch
from torch import nn
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import 我的项目 as work

torch.manual_seed(7)
X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X,y,stratify=y,random_state=7)
# 与“训练分类器.py”固定同一留出集；正式选模型还需训练内的验证过程。
scale = StandardScaler().fit(X_train)
features = torch.tensor(scale.transform(X_train),dtype=torch.float32)
targets = torch.tensor(y_train,dtype=torch.long)
test_features = torch.tensor(scale.transform(X_test),dtype=torch.float32)
model = nn.Sequential(nn.Linear(features.shape[1],16),nn.ReLU(),nn.Linear(16,2))
optimizer = torch.optim.SGD(model.parameters(),lr=0.05)
criterion = nn.CrossEntropyLoss()
history = []
for epoch in range(60):
    model.train()
    optimizer.zero_grad()
    loss = criterion(model(features),targets)
    loss.backward()
    optimizer.step()
    history.append({"epoch":epoch+1,"train_loss":float(loss.detach())})
model.eval()
with torch.no_grad():
    predicted = model(test_features).argmax(dim=1).tolist()
report = {"seed":7,"mode":"real_torch_training","positive_class":"数据集标签1（良性）",
          "metrics":work.evaluate_binary(y_test.tolist(),predicted),"history":history}
root = Path(__file__).resolve().parent
(root / "outputs").mkdir(exist_ok=True)
torch.save(model.state_dict(),root / "outputs/model_state.pt")
(root / "outputs/torch_report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(report["metrics"])
# 比较时说明：训练损失不是留出指标；这个小例子不用于医学判断。
