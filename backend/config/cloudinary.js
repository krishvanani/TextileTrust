const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for profile photos
const profilePhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'textiletrust/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }],
  },
});

// Storage for business cards
const businessCardStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'textiletrust/business-cards',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

module.exports = { cloudinary, profilePhotoStorage, businessCardStorage };
