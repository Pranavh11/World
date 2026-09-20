const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).populate('actorId', 'displayName username profileImage').sort({ createdAt: -1 }).limit(30);
    res.json({ notifications, unread: notifications.filter((item) => !item.read).length });
  } catch (error) { next(error); }
});
router.patch('/read', async (req, res, next) => {
  try { await Notification.updateMany({ userId: req.user._id, read: false }, { read: true }); res.json({ ok: true }); } catch (error) { next(error); }
});
module.exports = router;
