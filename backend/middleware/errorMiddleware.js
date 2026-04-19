const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;

  res.status(statusCode);

  const body = {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  };

  // Allow controllers to attach structured details to an error for the client
  // (e.g. `err.details = { isFake, isAbusive }` for NLP moderation rejections).
  if (err.details && typeof err.details === 'object') {
    body.details = err.details;
  }

  res.json(body);
};

module.exports = {
  errorHandler,
};
