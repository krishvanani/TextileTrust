"""
BERT Analyzer — Uses 'unitary/toxic-bert' (HuggingFace) for toxic/abusive content detection.
Best at: understanding context, sarcasm, and nuanced offensive language.
"""

import logging
from utils.abusive_matcher import AbusiveMatcher

logger = logging.getLogger(__name__)


class BertAnalyzer:
    def __init__(self):
        self.classifier = None
        self.matcher = AbusiveMatcher()
        logger.info(f"[BERT] Abusive matcher loaded with {self.matcher.vocab_size} entries.")
        self._load_model()

    def _load_model(self):
        try:
            from transformers import pipeline
            logger.info("[BERT] Loading 'unitary/toxic-bert' model...")
            self.classifier = pipeline(
                "text-classification",
                model="unitary/toxic-bert",
                truncation=True,
                max_length=512,
                top_k=None          # return all labels with scores
            )
            logger.info("[BERT] Model loaded successfully.")
        except Exception as e:
            logger.warning(f"[BERT] Could not load transformer model: {e}. Falling back to keyword matching.")
            self.classifier = None

    def analyze(self, text: str) -> dict:
        if not text:
            return {'is_toxic': False, 'confidence': 0.0, 'label': 'CLEAN', 'reason': ''}

        # ── Fast multilingual keyword pre-check (regex with word boundaries) ─
        matched = self.matcher.find_matches(text)
        if matched:
            return {
                'is_toxic':   True,
                'confidence': 0.99,
                'label':      'TOXIC',
                'reason':     'Review contains explicitly inappropriate language.',
                'matched_words': matched,
            }

        # ── BERT model ──────────────────────────────────────────────────────
        if self.classifier:
            try:
                results = self.classifier(text[:512])
                # results is a list of lists when top_k=None
                scores = results[0] if isinstance(results[0], list) else results

                toxic_score = 0.0
                for item in scores:
                    if item['label'].upper() == 'TOXIC':
                        toxic_score = item['score']
                        break

                THRESHOLD   = 0.72
                is_toxic    = toxic_score >= THRESHOLD

                return {
                    'is_toxic':   is_toxic,
                    'confidence': round(toxic_score, 4),
                    'label':      'TOXIC' if is_toxic else 'CLEAN',
                    'reason':     'Review contains toxic or abusive language.' if is_toxic else '',
                    'all_scores': {item['label']: round(item['score'], 4) for item in scores},
                }
            except Exception as e:
                logger.error(f"[BERT] Inference error: {e}")

        # ── Fallback: no model, no keyword hit ──────────────────────────────
        return {'is_toxic': False, 'confidence': 0.0, 'label': 'CLEAN', 'reason': ''}
