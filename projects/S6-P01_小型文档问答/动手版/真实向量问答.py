"""需 sentence-transformers、torch、transformers；会加载实际编码器与语言模型。"""
import json
import os
import sys
from pathlib import Path
import torch
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer,AutoModelForCausalLM
import 我的项目 as work

root = Path(__file__).resolve().parent
docs = json.loads((root / "data/documents.json").read_text(encoding="utf-8"))
query = " ".join(sys.argv[1:]) or "What does a Python function return?"
encoder_id = os.environ["EMBEDDING_MODEL_ID"]
model_id = os.environ["MODEL_ID"]
encoder = SentenceTransformer(encoder_id,device="cpu")
vectors = encoder.encode_document([d["text"] for d in docs],normalize_embeddings=True)
q = encoder.encode_query([query],normalize_embeddings=True)[0]
scores = vectors @ q
indices = scores.argsort()[::-1][:2]
hits = [{**docs[int(i)],"score":float(scores[i])} for i in indices]
context = work.make_context(hits)
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id).float().cpu()
model.eval()
messages = [{"role":"user","content":"Answer only from the evidence and cite [id]. If evidence is insufficient, say so.\nQuestion: "+query+"\nEvidence:\n"+context}]
prompt = tokenizer.apply_chat_template(messages,tokenize=False,add_generation_prompt=True)
inputs = tokenizer(prompt,return_tensors="pt",add_special_tokens=False)
with torch.no_grad():
    generated = model.generate(**inputs,max_new_tokens=100,do_sample=False,pad_token_id=tokenizer.eos_token_id)
answer = tokenizer.decode(generated[0,inputs["input_ids"].shape[1]:],skip_special_tokens=True)
result = {"mode":"real_embedding_and_generation","query":query,"encoder":encoder_id,"model":model_id,"hits":hits,"answer":answer}
(root / "outputs").mkdir(exist_ok=True)
(root / "outputs/real_rag_result.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
print(answer)
print("请核对原文和引用；top-k 命中不保证证据充分，也不保证生成正确。")
