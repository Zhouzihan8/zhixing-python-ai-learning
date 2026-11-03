"""需 torch、transformers；先用环境变量 MODEL_ID 指定已选模型或本地模型目录。"""
import json
import os
from pathlib import Path
import torch
from transformers import AutoTokenizer,AutoModelForCausalLM
import 我的项目 as work

root = Path(__file__).resolve().parent
model_id = os.environ["MODEL_ID"]
samples = json.loads((root / "data/samples.json").read_text(encoding="utf-8"))
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id).float().cpu()
model.eval()
records = []
for sample in samples:
    messages = [{"role":"user","content":'Classify the sentiment as positive or negative. Return only JSON with key "label". Text: '+sample["text"]}]
    prompt = tokenizer.apply_chat_template(messages,tokenize=False,add_generation_prompt=True)
    inputs = tokenizer(prompt,return_tensors="pt",add_special_tokens=False)
    with torch.no_grad():
        ids = model.generate(**inputs,max_new_tokens=40,do_sample=False,pad_token_id=tokenizer.eos_token_id)
    response = tokenizer.decode(ids[0,inputs["input_ids"].shape[1]:],skip_special_tokens=True)
    records.append({"id":sample["id"],"expected":sample["expected"],"response":response})
result = {"mode":"real_local_model_inference","model":model_id,"prompt_version":"sentiment-json-v1",
          "config":{"max_new_tokens":40,"do_sample":False},"records":records,"metrics":work.evaluate_records(records)}
(root / "outputs").mkdir(exist_ok=True)
(root / "outputs/real_model_result.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
print(result["metrics"])
# 保留原始响应，包括不合法 JSON；不要先“修好答案”再评价模型。
