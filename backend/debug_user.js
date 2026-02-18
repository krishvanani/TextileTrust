try {
  const User = require('./models/User');
  console.log('User model loaded successfully');
} catch (err) {
  console.error('User model failed to load:', err);
}
