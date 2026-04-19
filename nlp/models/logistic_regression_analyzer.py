"""
Logistic Regression Analyzer — LogReg over char n-gram TF-IDF + a small
set of hand-crafted numeric features (length, rating, abusive hit count,
repetition ratio).

Shares the same training data as NaiveBayesAnalyzer but combines sparse
text features with dense numeric features via FeatureUnion.

Trains in-memory at startup on nlp/data/training_data.json.
"""

import json
import os
import logging

import numpy as np
from utils.abusive_matcher import AbusiveMatcher

logger = logging.getLogger(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'training_data.json')

THRESHOLD = 0.55


def _numeric_features(text: str, rating: int, matcher: AbusiveMatcher) -> list:
    text = text or ''
    words = text.split()
    wlen  = max(len(words), 1)
    tlen  = max(len(text), 1)

    # Max repetition ratio: most frequent token / total tokens
    freq = {}
    for w in (w.lower() for w in words):
        freq[w] = freq.get(w, 0) + 1
    max_rep = (max(freq.values()) / wlen) if freq else 0.0

    # Caps ratio over alphabetic characters
    alpha = [c for c in text if c.isalpha()]
    caps_ratio = (sum(1 for c in alpha if c.isupper()) / len(alpha)) if alpha else 0.0

    # Punctuation density
    punc_ratio = sum(1 for c in text if c in '!?') / tlen

    return [
        len(words),
        int(rating),
        matcher.hit_count(text),
        round(max_rep, 3),
        round(caps_ratio, 3),
        round(punc_ratio, 3),
    ]


class LogisticRegressionAnalyzer:
    def __init__(self):
        self.pipeline = None
        self.matcher  = AbusiveMatcher()
        self.sample_count = 0
        self._train()

    def _load_data(self):
        with open(DATA_FILE, encoding='utf-8') as f:
            rows = json.load(f)
        texts = [r['comment'] for r in rows]
        ratings = [int(r['rating']) for r in rows]
        labels = [int(r['label']) for r in rows]
        return texts, ratings, labels

    def _train(self):
        try:
            from scipy.sparse import hstack, csr_matrix
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.linear_model import LogisticRegression
            from sklearn.preprocessing import StandardScaler

            texts, ratings, labels = self._load_data()
            self.sample_count = len(texts)

            self.vectorizer = TfidfVectorizer(
                analyzer='char_wb',
                ngram_range=(3, 5),
                min_df=1,
                max_df=0.95,
                sublinear_tf=True,
                lowercase=True,
            )
            X_text = self.vectorizer.fit_transform(texts)

            X_num  = np.array([_numeric_features(t, r, self.matcher) for t, r in zip(texts, ratings)])
            self.scaler = StandardScaler(with_mean=False)
            X_num_scaled = self.scaler.fit_transform(X_num)

            X = hstack([X_text, csr_matrix(X_num_scaled)])

            self.clf = LogisticRegression(
                C=1.5,
                class_weight='balanced',
                max_iter=500,
                solver='liblinear',
            )
            self.clf.fit(X, labels)
            self.pipeline = True   # sentinel — individual parts stored on self
            logger.info(f"[LogReg] Trained on {self.sample_count} samples.")
        except Exception as e:
            logger.warning(f"[LogReg] Training failed: {e}. Model disabled.")
            self.pipeline = None

    def analyze(self, processed_text: str, rating: int, raw_text: str = '') -> dict:
        src = raw_text or processed_text or ''
        if not self.pipeline or not src:
            return {'is_fake': False, 'confidence': 0.0, 'reason': ''}

        try:
            from scipy.sparse import hstack, csr_matrix
            X_text = self.vectorizer.transform([src])
            X_num  = np.array([_numeric_features(src, rating, self.matcher)])
            X_num  = self.scaler.transform(X_num)
            X = hstack([X_text, csr_matrix(X_num)])
            proba = float(self.clf.predict_proba(X)[0][1])
        except Exception as e:
            logger.error(f"[LogReg] Inference error: {e}")
            return {'is_fake': False, 'confidence': 0.0, 'reason': ''}

        is_fake = proba >= THRESHOLD
        return {
            'is_fake':    is_fake,
            'confidence': round(proba, 4),
            'reason':     'Classifier flagged this as fake or abusive (text + numeric features).' if is_fake else '',
            'threshold':  THRESHOLD,
        }
