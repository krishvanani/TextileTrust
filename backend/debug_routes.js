try {
  const authRoutes = require('./routes/authRoutes');
  console.log('Auth Routes loaded successfully');
} catch (err) {
  console.error('Auth Routes failed to load:', err);
}
