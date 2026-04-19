"""
TextileTrust NLP Service
========================
Detects fake and abusive reviews across multiple languages.
Runs on port 5001.

Endpoints:
  GET  /health         - service status and loaded models
  GET  /best-model     - returns the model selected by evaluate.py
  POST /analyze        - ensemble check (abusive matcher OR fake classifier)
  POST /detect-fake    - uses the best fake-detection model from best_model.json
  POST /detect-abusive - multilingual abusive-word check
  POST /compare        - runs every loaded analyzer and returns their verdicts
"""

import json
import os
import logging

from flask import Flask, request, jsonify
from flask_cors import CORS

from models.tfidf_analyzer               import TFIDFAnalyzer
from models.naive_bayes_analyzer         import NaiveBayesAnalyzer
from models.logistic_regression_analyzer import LogisticRegressionAnalyzer
from utils.preprocessor                  import preprocess_text
from utils.abusive_matcher               import AbusiveMatcher

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

CONFIG_FILE = os.path.join(os.path.dirname(__file__), 'data', 'best_model.json')

# ── Load everything once at startup ──────────────────────────────────────────
logger.info("=== Loading NLP Models ===")
tfidf   = TFIDFAnalyzer()
nb      = NaiveBayesAnalyzer()
logreg  = LogisticRegressionAnalyzer()
matcher = AbusiveMatcher()
logger.info("=== All Models Ready ===")

FAKE_REGISTRY = {
    'TFIDFRules':  lambda processed, rating, raw: tfidf.analyze(processed, rating, raw),
    'NaiveBayes':  lambda processed, rating, raw: nb.analyze(processed, rating, raw),
    'LogisticReg': lambda processed, rating, raw: logreg.analyze(processed, rating, raw),
}

ABUSIVE_REGISTRY = {
    'AbusiveMatcher': lambda raw: {
        'is_toxic': matcher.is_abusive(raw),
        'confidence': 0.99 if matcher.is_abusive(raw) else 0.0,
        'matched_words': matcher.find_matches(raw),
        'reason': 'Review contains explicitly inappropriate language.' if matcher.is_abusive(raw) else '',
    },
}


def load_best_model():
    """Read the winners picked by evaluate.py. Fall back to sensible defaults."""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, encoding='utf-8') as f:
                cfg = json.load(f)
            best_abusive = cfg.get('best_abusive', 'AbusiveMatcher')
            best_fake    = cfg.get('best_fake', 'LogisticReg')
            if best_abusive not in ABUSIVE_REGISTRY: best_abusive = 'AbusiveMatcher'
            if best_fake    not in FAKE_REGISTRY:    best_fake    = 'LogisticReg'
            logger.info(f"Best abusive model: {best_abusive} | Best fake model: {best_fake}")
            return best_abusive, best_fake, cfg
        except Exception as e:
            logger.warning(f"Failed to read {CONFIG_FILE}: {e}. Using defaults.")
    logger.info("No best_model.json found. Using defaults (AbusiveMatcher / LogisticReg). "
                "Run `python evaluate.py` to pick winners from data.")
    return 'AbusiveMatcher', 'LogisticReg', {}


BEST_ABUSIVE, BEST_FAKE, BEST_CONFIG = load_best_model()


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':         'ok',
        'service':        'TextileTrust NLP',
        'best_abusive':   BEST_ABUSIVE,
        'best_fake':      BEST_FAKE,
        'abusive_vocab':  matcher.vocab_size,
        'fake_models':    list(FAKE_REGISTRY.keys()),
        'abusive_models': list(ABUSIVE_REGISTRY.keys()),
    })


@app.route('/best-model', methods=['GET'])
def best_model_info():
    return jsonify({
        'best_abusive': BEST_ABUSIVE,
        'best_fake':    BEST_FAKE,
        'config':       BEST_CONFIG,
    })


@app.route('/detect-abusive', methods=['POST'])
def detect_abusive():
    data = request.get_json(force=True)
    text = (data.get('comment') or '').strip()
    if not text:
        return jsonify({'is_abusive': False, 'reason': '', 'model': BEST_ABUSIVE, 'details': {}})

    res = ABUSIVE_REGISTRY[BEST_ABUSIVE](text)
    is_abusive = bool(res.get('is_toxic') or res.get('is_abusive'))
    return jsonify({
        'is_abusive':   is_abusive,
        'reason':       res.get('reason', '') if is_abusive else '',
        'model':        BEST_ABUSIVE,
        'details':      res,
    })


@app.route('/detect-fake', methods=['POST'])
def detect_fake():
    """Uses the best fake-detection model on its own, plus the abusive matcher
    as a hard gate (abusive content is rejected even if the fake model clears it)."""
    data   = request.get_json(force=True)
    text   = (data.get('comment') or '').strip()
    rating = int(data.get('rating', 3))

    if len(text) < 3:
        return jsonify({
            'passed': True, 'is_fake': False, 'is_abusive': False,
            'reason': '', 'model': BEST_FAKE,
        })

    # Abusive hard-gate
    abusive_hits = matcher.find_matches(text)
    if abusive_hits:
        return jsonify({
            'passed':        False,
            'is_fake':       False,
            'is_abusive':    True,
            'reason':        'Review contains explicitly inappropriate language.',
            'model':         BEST_FAKE,
            'matched_words': abusive_hits,
        })

    processed = preprocess_text(text)
    fake_res  = FAKE_REGISTRY[BEST_FAKE](processed, rating, text)
    is_fake   = bool(fake_res.get('is_fake'))

    return jsonify({
        'passed':     not is_fake,
        'is_fake':    is_fake,
        'is_abusive': False,
        'reason':     fake_res.get('reason', '') if is_fake else '',
        'model':      BEST_FAKE,
        'details':    fake_res,
    })


@app.route('/analyze', methods=['POST'])
def analyze():
    """Ensemble endpoint: reject if ANY model flags the review."""
    data   = request.get_json(force=True)
    text   = (data.get('comment') or '').strip()
    rating = int(data.get('rating', 3))

    if len(text) < 3:
        return jsonify({'passed': True, 'is_fake': False, 'is_abusive': False, 'reason': '', 'scores': {}})

    processed = preprocess_text(text)

    abusive_hits = matcher.find_matches(text)
    is_abusive   = bool(abusive_hits)

    tfidf_res = tfidf.analyze(processed, rating, text)
    nb_res    = nb.analyze(processed, rating, text)
    lr_res    = logreg.analyze(processed, rating, text)

    # Majority vote: only flag as fake if at least 2 of 3 detectors agree.
    # OR-ensemble was too aggressive because each classifier has its own false
    # positives on short genuine reviews; requiring agreement cancels them out.
    fake_votes = sum(1 for r in (tfidf_res, nb_res, lr_res) if r.get('is_fake'))
    is_fake = fake_votes >= 2

    reason = ''
    if is_abusive:
        reason = 'Review contains explicitly inappropriate language.'
    elif is_fake:
        reason = (
            tfidf_res.get('reason') or
            nb_res.get('reason')    or
            lr_res.get('reason')    or
            'Review appears to be fake or spam.'
        )

    logger.info(f"[ANALYZE] rating={rating} | abusive={is_abusive} | fake={is_fake} | text={text[:60]!r}")

    return jsonify({
        'passed':     not (is_abusive or is_fake),
        'is_fake':    is_fake,
        'is_abusive': is_abusive,
        'reason':     reason,
        'scores': {
            'abusive_matcher': {'is_toxic': is_abusive, 'matched_words': abusive_hits},
            'tfidf':           tfidf_res,
            'naive_bayes':     nb_res,
            'logreg':          lr_res,
        },
    })


@app.route('/compare', methods=['POST'])
def compare():
    """Developer endpoint: runs every loaded analyzer and returns each verdict."""
    data   = request.get_json(force=True)
    text   = (data.get('comment') or '').strip()
    rating = int(data.get('rating', 3))

    if not text:
        return jsonify({'error': 'No comment provided'}), 400

    processed = preprocess_text(text)

    return jsonify({
        'text':   text,
        'rating': rating,
        'abusive': {
            'AbusiveMatcher': {
                'is_toxic':      matcher.is_abusive(text),
                'matched_words': matcher.find_matches(text),
            },
        },
        'fake': {
            'TFIDFRules':  tfidf.analyze(processed, rating, text),
            'NaiveBayes':  nb.analyze(processed, rating, text),
            'LogisticReg': logreg.analyze(processed, rating, text),
        },
        'selected': {
            'best_abusive': BEST_ABUSIVE,
            'best_fake':    BEST_FAKE,
        },
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
