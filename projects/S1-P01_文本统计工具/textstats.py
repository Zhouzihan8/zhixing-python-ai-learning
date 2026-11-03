"""统计规则：统一小写，按空白切词；不执行中文分词或通用标点清理。"""


def count_words(text, ignore=None):
    if ignore is None:
        ignore = set()
    counts = {}
    for word in text.lower().split():
        if word in ignore:
            continue
        counts[word] = counts.get(word, 0) + 1
    return counts


def sorted_counts(counts):
    return sorted(counts.items(), key=lambda item: (-item[1], item[0]))


if __name__ == "__main__":
    print(count_words("Python AI Python"))
