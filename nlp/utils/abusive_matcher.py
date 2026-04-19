"""
Multilingual abusive-word matcher.

Fixes the previous .split()-based approach in BertAnalyzer which could not
handle punctuation-attached tokens ("madarchod,"), multi-word phrases
("son of a bitch", "tere baap ka"), or Unicode-neighboring tokens.

Uses one compiled regex over the full ABUSIVE_WORDS list with
(?<!\\w)...(?!\\w) boundaries — language-agnostic, works for English,
Roman-Hindi, Roman-Gujarati, Roman-Tamil, etc.
"""

import re
from utils.abusive_words import ABUSIVE_WORDS


class AbusiveMatcher:
    def __init__(self):
        # Deduplicate, lowercase, drop empties. Sort longest-first so
        # multi-word phrases win over their shorter substrings.
        words = sorted(
            {w.strip().lower() for w in ABUSIVE_WORDS if w and w.strip()},
            key=len,
            reverse=True,
        )
        pattern = r'(?<!\w)(?:' + '|'.join(re.escape(w) for w in words) + r')(?!\w)'
        self.regex = re.compile(pattern, re.IGNORECASE | re.UNICODE)
        self.vocab_size = len(words)

    def find_matches(self, text: str) -> list:
        if not text:
            return []
        return sorted({m.group(0).lower() for m in self.regex.finditer(text)})

    def is_abusive(self, text: str) -> bool:
        return bool(self.find_matches(text))

    def hit_count(self, text: str) -> int:
        if not text:
            return 0
        return sum(1 for _ in self.regex.finditer(text))
