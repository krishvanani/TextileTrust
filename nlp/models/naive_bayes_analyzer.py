"""
Naive Bayes Analyzer — Multinomial NB on character n-gram TF-IDF features.

Predicts a single label `should_reject` (fake OR abusive) so the same
classifier covers both tasks. Character n-grams keep it language-agnostic,
so Roman-transliterated Hindi/Gujarati/Marathi/Tamil/Telugu tokens are
handled the same way as English.

Trains in-memory at startup on nlp/data/training_data.json.
"""

import json
import os
import logging

logger = logging.getLogger(__name__)

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'training_data.json')

THRESHOLD = 0.55  # predicted probability above which a review is rejected


class NaiveBayesAnalyzer:
    def __init__(self):
        self.pipeline = None
        self.sample_count = 0
        self._train()

    def _load_data(self):
        with open(DATA_FILE, encoding='utf-8') as f:
            rows = json.load(f)
        # Concatenate rating as a pseudo-token so the model can learn
        # "5-star + extremely short" as a fake signal.
        texts  = [f"r{r['rating']} {r['comment']}" for r in rows]
        labels = [int(r['label']) for r in rows]
        return texts, labels

    def _train(self):
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.naive_bayes import MultinomialNB
            from sklearn.pipeline import Pipeline

            texts, labels = self._load_data()
            self.sample_count = len(texts)

            self.pipeline = Pipeline([
                ('tfidf', TfidfVectorizer(
                    analyzer='char_wb',
                    ngram_range=(3, 5),
                    min_df=1,
                    max_df=0.95,
                    sublinear_tf=True,
                    lowercase=True,
                )),
                ('clf', MultinomialNB(alpha=0.3)),
            ])
            self.pipeline.fit(texts, labels)
            logger.info(f"[NaiveBayes] Trained on {self.sample_count} samples.")
        except Exception as e:
            logger.warning(f"[NaiveBayes] Training failed: {e}. Model disabled.")
            self.pipeline = None

    def analyze(self, processed_text: str, rating: int, raw_text: str = '') -> dict:
        src = raw_text or processed_text or ''
        if not self.pipeline or not src:
            return {'is_fake': False, 'confidence': 0.0, 'reason': ''}

        feature = f"r{int(rating)} {src}"
        try:
            proba = float(self.pipeline.predict_proba([feature])[0][1])
        except Exception as e:
            logger.error(f"[NaiveBayes] Inference error: {e}")
            return {'is_fake': False, 'confidence': 0.0, 'reason': ''}

        is_fake = proba >= THRESHOLD
        return {
            'is_fake':    is_fake,
            'confidence': round(proba, 4),
            'reason':     'Classifier flagged this as matching fake or abusive review patterns.' if is_fake else '',
            'threshold':  THRESHOLD,
        }
