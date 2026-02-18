try {
  const dotenv = require('dotenv');
  console.log('Dotenv loaded successfully');
  dotenv.config();
  console.log('Dotenv config ran');
} catch (err) {
  console.error('Dotenv failed:', err);
}
