def retrieve(query, documents, top_k=2):
    """教学词项重合检索；按空白分词，不是语义 embedding。只返回有命中的资料。"""
    tokens = set(query.lower().split())
    ranked = []
    for doc in documents:
        score = len(tokens & set(doc["text"].lower().split()))
        if score:
            ranked.append({**doc, "score": score})
    return sorted(ranked, key=lambda d: (-d["score"], d["id"]))[:top_k]

def make_context(hits):
    """保留资料编号和来源，供下一步生成使用。"""
    return "\n\n".join(f"[{hit['id']}] {hit['text']}\n来源：{hit['source']}" for hit in hits)
