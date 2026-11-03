def clean_rows(rows):
    """按 id 保留第一条有效记录；分钟数须为非负整数，主题不能为空。"""
    clean, seen = [], set()
    for row in rows:
        try:
            minutes = int(row["minutes"])
        except (ValueError, TypeError):
            continue
        topic = row["topic"].strip().lower()
        if minutes < 0 or not topic or row["id"] in seen:
            continue
        seen.add(row["id"])
        clean.append({"id": row["id"], "topic": topic, "minutes": minutes})
    return clean

def summarize(rows):
    """按主题累加分钟数，不修改输入记录。"""
    totals = {}
    for row in rows:
        topic = row["topic"]
        totals[topic] = totals.get(topic, 0) + row["minutes"]
    return totals
