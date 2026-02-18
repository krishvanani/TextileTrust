try {
  const authController = require('./controllers/authController');
  console.log('Auth Controller loaded successfully');
} catch (err) {
  console.error('Auth Controller failed to load:', err);
}
