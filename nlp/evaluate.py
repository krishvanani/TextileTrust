"""
Model Comparison & Selection
=============================
Benchmarks every analyzer on the held-out test set in
`nlp/data/test_cases.json` and writes the winners to
`nlp/data/best_model.json`, which the Flask service loads at startup.

Two separate selections are made:
  - best-abusive  : regex-only AbusiveMatcher (single candidate, kept for parity
                    with the registry in app.py so future models can be added
                    without changing the selection contract)
  - best-fake     : TF-IDF rules, NaiveBayes, LogisticRegression

Run:
    python evaluate.py
"""

import json
import os
import logging

from models.tfidf_analyzer               import TFIDFAnalyzer
from models.naive_bayes_analyzer         import NaiveBayesAnalyzer
from models.logistic_regression_analyzer import LogisticRegressionAnalyzer
from utils.preprocessor                  import preprocess_text
from utils.abusive_matcher               import AbusiveMatcher

logging.basicConfig(level=logging.WARNING, format='%(asctime)s [%(levelname)s] %(message)s')

TEST_FILE   = os.path.join(os.path.dirname(__file__), 'data', 'test_cases.json')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'data', 'best_model.json')


def load_cases():
    with open(TEST_FILE, encoding='utf-8') as f:
        return json.load(f)


def metrics(preds, labels):
    tp = fp = tn = fn = 0
    for p, l in zip(preds, labels):
        if p and l:       tp += 1
        elif p and not l: fp += 1
        elif l:           fn += 1
        else:             tn += 1
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall    = tp / (tp + fn) if (tp + fn) else 0.0
    f1        = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    accuracy  = (tp + tn) / len(labels) if labels else 0.0
    return {
        'accuracy':  accuracy,
        'precision': precision,
        'recall':    recall,
        'f1':        f1,
        'tp': tp, 'fp': fp, 'tn': tn, 'fn': fn,
    }


def print_row(name, m, task):
    print(f"  {name:<22}  acc={m['accuracy']*100:5.1f}%  "
          f"prec={m['precision']*100:5.1f}%  rec={m['recall']*100:5.1f}%  "
          f"F1={m['f1']*100:5.1f}%   ({task}, tp={m['tp']} fp={m['fp']} fn={m['fn']})")


def pick_best(results: dict) -> str:
    """Highest F1, tie-break on accuracy, then on precision."""
    return max(results.keys(),
               key=lambda k: (results[k]['f1'], results[k]['accuracy'], results[k]['precision']))


def main():
    print("\nTextileTrust Model Comparison")
    print("=" * 78)

    cases = load_cases()
    print(f"Loaded {len(cases)} test cases from {TEST_FILE}\n")

    # ── Load all models ──────────────────────────────────────────────────────
    print("Loading models ...")
    tfidf   = TFIDFAnalyzer()
    nb      = NaiveBayesAnalyzer()
    logreg  = LogisticRegressionAnalyzer()
    matcher = AbusiveMatcher()
    print("All models ready.\n")

    # The unified "should reject" label: any positive in the test set is a
    # reject (fake or abusive). The held-out set uses a single `label` field.
    labels_reject = [int(c['label']) for c in cases]

    # For the abusive sub-task we carve out only abusive-category positives
    # vs. everything else (fake templates are NOT abusive).
    labels_abusive = [1 if c.get('category', '').startswith('abusive') else 0 for c in cases]

    # ── Collect predictions ──────────────────────────────────────────────────
    preds = {
        'AbusiveMatcher':  [],
        'TFIDFRules':      [],
        'NaiveBayes':      [],
        'LogisticReg':     [],
    }

    header = f"{'#':>3}  {'category':<18} {'Match':^5} {'TFID':^5} {'NB':^5} {'LR':^5} {'truth':^6}"
    print(header)
    print("-" * len(header))

    for i, c in enumerate(cases, 1):
        txt       = c['comment']
        rating    = c['rating']
        processed = preprocess_text(txt)

        t_res = tfidf.analyze(processed, rating, txt)
        n_res = nb.analyze(processed, rating, txt)
        l_res = logreg.analyze(processed, rating, txt)
        m_hit = matcher.is_abusive(txt)

        preds['AbusiveMatcher'].append(m_hit)
        preds['TFIDFRules'].append(bool(t_res['is_fake']))
        preds['NaiveBayes'].append(bool(n_res['is_fake']))
        preds['LogisticReg'].append(bool(l_res['is_fake']))

        truth = 'REJECT' if c['label'] else 'OK'
        print(f"{i:>3}  {c.get('category','?'):<18} "
              f"{'X' if m_hit else '.':^5} "
              f"{'X' if t_res['is_fake'] else '.':^5} "
              f"{'X' if n_res['is_fake'] else '.':^5} "
              f"{'X' if l_res['is_fake'] else '.':^5} "
              f"{truth:^6}")

    # ── Score abusive-detection task ─────────────────────────────────────────
    print("\n" + "=" * 78)
    print("Task A : Abusive detection")
    print("=" * 78)
    abusive_results = {
        'AbusiveMatcher': metrics(preds['AbusiveMatcher'], labels_abusive),
    }
    for name, m in abusive_results.items():
        print_row(name, m, 'abusive')

    best_abusive = pick_best(abusive_results)
    print(f"\n  WINNER (abusive): {best_abusive}  (F1 = {abusive_results[best_abusive]['f1']*100:.1f}%)")

    # ── Score fake / should-reject task ──────────────────────────────────────
    print("\n" + "=" * 78)
    print("Task B : Fake / should-reject detection (fake OR abusive)")
    print("=" * 78)
    fake_results = {
        'TFIDFRules':  metrics(preds['TFIDFRules'],  labels_reject),
        'NaiveBayes':  metrics(preds['NaiveBayes'],  labels_reject),
        'LogisticReg': metrics(preds['LogisticReg'], labels_reject),
    }
    for name, m in fake_results.items():
        print_row(name, m, 'reject')

    best_fake = pick_best(fake_results)
    print(f"\n  WINNER (fake/reject): {best_fake}  (F1 = {fake_results[best_fake]['f1']*100:.1f}%)")

    # ── Ensemble: best-abusive OR best-fake ──────────────────────────────────
    ensemble_preds = [
        bool(a or f)
        for a, f in zip(preds[best_abusive], preds[best_fake])
    ]
    ensemble_metrics = metrics(ensemble_preds, labels_reject)
    print("\n" + "=" * 78)
    print("Ensemble (best_abusive OR best_fake) on combined reject label")
    print("=" * 78)
    print_row(f"{best_abusive}+{best_fake}", ensemble_metrics, 'reject')

    # ── Persist selection ────────────────────────────────────────────────────
    config = {
        'best_abusive': best_abusive,
        'best_fake':    best_fake,
        'metrics': {
            'abusive': {k: {m: round(v, 4) for m, v in vals.items() if m not in ('tp','fp','tn','fn')}
                        for k, vals in abusive_results.items()},
            'fake':    {k: {m: round(v, 4) for m, v in vals.items() if m not in ('tp','fp','tn','fn')}
                        for k, vals in fake_results.items()},
            'ensemble': {m: round(v, 4) for m, v in ensemble_metrics.items() if m not in ('tp','fp','tn','fn')},
        },
        'test_cases':  len(cases),
    }
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)
    print(f"\nSaved selection to {OUTPUT_FILE}\n")

    print("Recommendation:")
    print(f"  /analyze       -> ensemble of {best_abusive} + {best_fake}")
    print(f"  /detect-fake   -> uses {best_fake} on its own")
    print(f"  /detect-abusive -> uses {best_abusive} on its own")


if __name__ == '__main__':
    main()
