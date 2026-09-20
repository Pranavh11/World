const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { signToken } = require('../utils/jwt');

const router = express.Router();
const publicUser = (user) => ({ id: user._id, username: user.username, displayName: user.displayName, email: user.email, profileImage: user.profileImage, bio: user.bio, isOnline: user.isOnline, lastSeen: user.lastSeen });

router.post('/register', async (req, res, next) => {
  try {
    const { username, displayName, email, password } = req.body;
    if (!username || !displayName || !email || !password || password.length < 8) return res.status(400).json({ message: 'Please provide a display name, username, email and an 8+ character password.' });
    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
    if (exists) return res.status(409).json({ message: 'That email or username is already in use.' });
    const user = await User.create({ username, displayName, email, password });
    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password || ''))) return res.status(401).json({ message: 'Email or password is incorrect.' });
    user.isOnline = true; await user.save();
    res.json({ token: signToken(user._id), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));
router.patch('/me', protect, async (req, res, next) => {
  try {
    const allowed = ['displayName', 'bio', 'profileImage'];
    allowed.forEach((key) => { if (typeof req.body[key] === 'string') req.user[key] = req.body[key].slice(0, key === 'bio' ? 160 : 80); });
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  } catch (error) { next(error); }
});

module.exports = router;
