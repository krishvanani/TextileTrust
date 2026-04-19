"""
TF-IDF Analyzer — Rule-based fake review detection.
Uses weighted heuristics: extreme-rating + short text, generic phrases,
repeated patterns, character spam, and rating-sentiment mismatch.
Best at: structured fake patterns, spam, and templated reviews.
"""

import re
import logging

logger = logging.getLogger(__name__)

# ── Positive / Negative sentiment seeds ────────────────────────────────────────
POSITIVE_WORDS = {
    'good', 'great', 'excellent', 'amazing', 'perfect', 'love', 'best',
    'wonderful', 'fantastic', 'awesome', 'superb', 'outstanding', 'brilliant',
    'recommend', 'trustworthy', 'reliable', 'genuine', 'satisfied', 'happy'
}
NEGATIVE_WORDS = {
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'disgusting',
    'pathetic', 'useless', 'poor', 'disappointing', 'fraud', 'scam', 'cheat',
    'avoid', 'beware', 'fake', 'liar', 'dishonest', 'trash', 'garbage'
}

# ── Generic / templated phrases that indicate low-effort or fake reviews ───────
GENERIC_PHRASES = [
    'best company ever', 'worst company ever', 'highly recommend',
    'do not recommend', 'five stars', 'one star', 'zero stars',
    'waste of money', 'money back', 'total waste', 'best ever',
    'worst ever', 'must buy', 'must avoid', 'never again',
    'best in class', 'top notch', 'world class', 'number one',
    'good product', 'bad product', 'good service', 'bad service',
    'nice product', 'nice service', 'ok product', 'okay service',
]

# Scoring weights (must sum meaningfully; flagged when total >= THRESHOLD)
THRESHOLD = 0.50


class TFIDFAnalyzer:
    def __init__(self):
        logger.info("[TF-IDF] Analyzer initialized (rule-based heuristics).")

    def analyze(self, processed_text: str, rating: int, raw_text: str = '') -> dict:
        text   = processed_text or raw_text or ''
        raw    = raw_text or processed_text or ''
        if not text:
            return {'is_fake': False, 'confidence': 0.0, 'reason': '', 'reasons': []}

        words    = text.lower().split()
        raw_low  = raw.lower()
        score    = 0.0
        reasons  = []

        # ── 1. Very short + extreme rating ─────────────────────────────────
        if len(words) <= 4 and rating in (1, 5):
            score += 0.40
            reasons.append('Extremely short review with extreme rating (high fake signal)')

        elif len(words) <= 8 and rating in (1, 5):
            score += 0.20
            reasons.append('Short review with extreme rating')

        # ── 2. Generic / templated phrases ─────────────────────────────────
        matched_phrases = [p for p in GENERIC_PHRASES if p in raw_low]
        if len(matched_phrases) >= 2:
            score += 0.30
            reasons.append(f'Contains {len(matched_phrases)} generic/templated phrases')
        elif len(matched_phrases) == 1:
            score += 0.10

        # ── 3. Repeated characters (aaaa, !!!!, ????) ─────────────────────
        if re.search(r'(.)\1{4,}', raw):
            score += 0.20
            reasons.append('Repeated character spam detected')

        # ── 4. Excessive punctuation ───────────────────────────────────────
        punc_ratio = sum(1 for c in raw if c in '!?') / max(len(raw), 1)
        if punc_ratio > 0.15:
            score += 0.15
            reasons.append('Excessive punctuation (spam pattern)')

        # ── 5. Word repetition ──────────────────────────────────────────────
        freq = {}
        for w in words:
            freq[w] = freq.get(w, 0) + 1
        max_freq = max(freq.values(), default=0)
        if max_freq >= 4 and len(words) < 25:
            score += 0.20
            reasons.append('Same word repeated 4+ times in a short review')

        # ── 6. All-caps review ─────────────────────────────────────────────
        alpha_chars = [c for c in raw if c.isalpha()]
        if alpha_chars and sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars) > 0.80:
            score += 0.15
            reasons.append('Review written mostly in CAPS (spam/angry pattern)')

        # ── 7. Rating-sentiment mismatch ────────────────────────────────────
        pos_count = sum(1 for w in words if w in POSITIVE_WORDS)
        neg_count = sum(1 for w in words if w in NEGATIVE_WORDS)

        if rating >= 4 and neg_count >= 2 and neg_count > pos_count:
            score += 0.35
            reasons.append('Negative sentiment with high rating (clear mismatch)')
        elif rating <= 2 and pos_count >= 2 and pos_count > neg_count:
            score += 0.35
            reasons.append('Positive sentiment with low rating (clear mismatch)')

        # ── 8. Only emojis / symbols, no real words ─────────────────────────
        if len(words) < 3 and not any(c.isalpha() for c in raw):
            score += 0.40
            reasons.append('Review contains no real words (emoji/symbol spam)')

        is_fake = score >= THRESHOLD

        logger.debug(f"[TF-IDF] score={score:.2f} | fake={is_fake} | reasons={reasons}")

        return {
            'is_fake':    is_fake,
            'confidence': round(min(score, 1.0), 3),
            'reasons':    reasons,
            'reason':     reasons[0] if reasons else '',
        }
