"""
Text preprocessor — normalises raw review text before passing to TF-IDF and Word2Vec.
BERT receives raw text (handles its own tokenisation).
"""

import re


def preprocess_text(text: str) -> str:
    if not text:
        return ''

    # Lowercase
    text = text.lower()

    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)

    # Remove email addresses
    text = re.sub(r'\S+@\S+\.\S+', ' ', text)

    # Expand common contractions
    contractions = {
        "won't": "will not", "can't": "cannot", "n't": " not",
        "'re": " are", "'s": " is", "'d": " would",
        "'ll": " will", "'t": " not", "'ve": " have", "'m": " am"
    }
    for k, v in contractions.items():
        text = text.replace(k, v)

    # Keep only alphabetic characters and spaces (remove punctuation, numbers)
    text = re.sub(r'[^a-z\s]', ' ', text)

    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    return text
