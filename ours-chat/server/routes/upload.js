const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { protect } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (_, file, callback) => callback(null, file.mimetype.startsWith('image/')) });
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });

router.post('/', protect, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please choose an image.' });
    if (!process.env.CLOUDINARY_CLOUD_NAME) return res.status(503).json({ message: 'Image uploads are not configured yet.' });
    const result = await new Promise((resolve, reject) => { const stream = cloudinary.uploader.upload_stream({ folder: 'ours-chat' }, (error, data) => error ? reject(error) : resolve(data)); stream.end(req.file.buffer); });
    res.json({ url: result.secure_url });
  } catch (error) { next(error); }
});
module.exports = router;
