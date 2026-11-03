def evaluate_records(records):
    """每条 response 是 JSON 字符串，要求 label 为 positive 或 negative。"""
    import json
    valid = correct = 0
    failures = []
    for row in records:
        try:
            parsed = json.loads(row["response"])
            label = parsed.get("label") if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            label = None
        is_valid = isinstance(label, str) and label in {"positive", "negative"}
        valid += is_valid
        hit = is_valid and label == row["expected"]
        correct += hit
        if not hit:
            failures.append(row["id"])
    total = len(records)
    return {"total": total, "valid": valid, "correct": correct,
            "accuracy": correct/total if total else 0, "failed_ids": failures}
