const axios = require('axios');

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:5001';
const NLP_TIMEOUT_MS = 8000;

// Fail-open: if the NLP service is unreachable, we allow the review through
// rather than blocking the user. Moderation is a best-effort layer, not auth.
// Every fail-open event is logged so ops can notice.
async function moderateReview({ comment, rating }) {
  const text = (comment || '').trim();
  if (text.length < 3) {
    return { passed: true, isFake: false, isAbusive: false, reason: '', scores: {} };
  }

  try {
    const { data } = await axios.post(
      `${NLP_SERVICE_URL}/analyze`,
      { comment: text, rating: Number(rating) || 3 },
      { timeout: NLP_TIMEOUT_MS }
    );

    return {
      passed: data.passed !== false,
      isFake: Boolean(data.is_fake),
      isAbusive: Boolean(data.is_abusive),
      reason: data.reason || '',
      scores: data.scores || {},
    };
  } catch (err) {
    console.warn(
      `[NLP UNAVAILABLE] fail-open — review allowed without moderation. ` +
      `url=${NLP_SERVICE_URL} err=${err.code || err.message}`
    );
    return { passed: true, isFake: false, isAbusive: false, reason: '', scores: {}, failOpen: true };
  }
}

async function pingNlp() {
  try {
    const { data } = await axios.get(`${NLP_SERVICE_URL}/health`, { timeout: 3000 });
    return { ok: true, info: data };
  } catch (err) {
    return { ok: false, err: err.code || err.message };
  }
}

module.exports = { moderateReview, pingNlp, NLP_SERVICE_URL };
