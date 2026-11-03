def count_words(text, ignored=None):
    """按空白切词、忽略大小写；ignored 是要忽略的小写词集合。"""
    ignored = set() if ignored is None else set(ignored)
    counts = {}
    for word in text.lower().split():
        if word not in ignored:
            counts[word] = counts.get(word, 0) + 1
    return counts

def top_words(counts, limit=3):
    """次数降序；次数相同按单词升序。"""
    return sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:limit]
