def evaluate_binary(truth, predicted):
    """正类为 1；无正预测时 precision 约定为 0，并报告这个约定。"""
    if len(truth) != len(predicted) or not truth:
        raise ValueError("两组标签应等长且非空")
    tp = sum(y == 1 and p == 1 for y, p in zip(truth, predicted))
    fp = sum(y == 0 and p == 1 for y, p in zip(truth, predicted))
    fn = sum(y == 1 and p == 0 for y, p in zip(truth, predicted))
    tn = sum(y == 0 and p == 0 for y, p in zip(truth, predicted))
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn,
            "precision": tp / (tp + fp) if tp + fp else 0,
            "recall": tp / (tp + fn) if tp + fn else 0,
            "accuracy": (tp + tn) / len(truth)}
