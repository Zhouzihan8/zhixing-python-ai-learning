import json
from pathlib import Path

from textstats import count_words, sorted_counts


def main():
    # 相对脚本定位输入，避免从不同终端目录启动时找不到样例。
    directory = Path(__file__).resolve().parent
    text = (directory / "sample.txt").read_text(encoding="utf-8")
    counts = count_words(text)
    for rank, (word, count) in enumerate(sorted_counts(counts), start=1):
        print(f"{rank}. {word}: {count}")
    (directory / "counts.json").write_text(
        json.dumps(counts, ensure_ascii=False, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
