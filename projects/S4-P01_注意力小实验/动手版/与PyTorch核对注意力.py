"""需 torch。先实现自己的 attention，再核对数值和因果性。"""
import json
from pathlib import Path
import torch
from torch.nn.functional import scaled_dot_product_attention
import 我的项目 as work

root = Path(__file__).resolve().parent
data = json.loads((root / "data/qkv.json").read_text(encoding="utf-8"))
mine = work.attention(data["q"], data["k"], data["v"], causal=True)
# 加上 batch 和 head 轴：[L,D] -> [1,1,L,D]。
q,k,v = [torch.tensor(data[name],dtype=torch.float64)[None,None] for name in ("q","k","v")]
actual = scaled_dot_product_attention(q,k,v,dropout_p=0.0,is_causal=True)[0,0]
assert torch.allclose(actual,torch.tensor(mine["output"],dtype=torch.float64),atol=1e-8)
changed = [row[:] for row in data["v"]]
changed[-1] = [x+100 for x in changed[-1]]
other = work.attention(data["q"],data["k"],changed,causal=True)
assert mine["output"][0] == other["output"][0]
(root / "outputs").mkdir(exist_ok=True)
(root / "outputs/torch_attention.json").write_text(json.dumps(actual.tolist(),indent=2),encoding="utf-8")
print("手算实现与 PyTorch 数值一致；改变未来 V 未影响第一个输出。")
