def attention(q, k, v, causal=True):
    """教学形状 [序列长, 维度]；Q/K 维度相同，K/V 序列长度相同。"""
    import math
    outputs, weights = [], []
    scale = math.sqrt(len(q[0]))
    for i, query in enumerate(q):
        scores = [sum(a*b for a,b in zip(query, key))/scale for key in k]
        scores = [score if not causal or j <= i else -math.inf for j,score in enumerate(scores)]
        largest = max(scores)
        values = [math.exp(score-largest) for score in scores]
        row = [value/sum(values) for value in values]
        weights.append(row)
        outputs.append([sum(row[j]*v[j][d] for j in range(len(v))) for d in range(len(v[0]))])
    return {"weights": weights, "output": outputs}
