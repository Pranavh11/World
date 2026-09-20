const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.get('/search', protect, async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim().toLowerCase();
    if (query.length < 2) return res.json({ users: [] });
    const users = await User.find({ _id: { $ne: req.user._id }, username: { $regex: query, $options: 'i' } }).select('-password').limit(10);
    res.json({ users });
  } catch (error) { next(error); }
});
module.exports = router;
