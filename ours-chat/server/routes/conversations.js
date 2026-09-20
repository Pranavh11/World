const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);
router.get('/', async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ members: req.user._id }).populate('members', '-password').populate({ path: 'lastMessage', populate: { path: 'senderId', select: 'displayName username profileImage' } }).sort({ updatedAt: -1 });
    res.json({ conversations });
  } catch (error) { next(error); }
});
router.post('/', async (req, res, next) => {
  try {
    const { memberId, name, memberIds } = req.body;
    const ids = Array.from(new Set([String(req.user._id), ...(memberIds || []), ...(memberId ? [memberId] : [])]));
    if (ids.length < 2) return res.status(400).json({ message: 'Add at least one friend.' });
    const isGroup = Boolean(name) || ids.length > 2;
    if (!isGroup && ids.length === 2) {
      const existing = await Conversation.findOne({ isGroup: false, members: { $all: ids, $size: 2 } }).populate('members', '-password');
      if (existing) return res.json({ conversation: existing });
    }
    const conversation = await Conversation.create({ name: isGroup ? (name || 'New group') : undefined, isGroup, members: ids, createdBy: req.user._id });
    const populated = await conversation.populate('members', '-password');
    res.status(201).json({ conversation: populated });
  } catch (error) { next(error); }
});
router.get('/:id/messages', async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, members: req.user._id });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });
    const messages = await Message.find({ conversationId: conversation._id }).populate('senderId', 'displayName username profileImage').populate({ path: 'replyTo', populate: { path: 'senderId', select: 'displayName username' } }).sort({ createdAt: 1 }).limit(200);
    await Message.updateMany({ conversationId: conversation._id, readBy: { $ne: req.user._id } }, { $addToSet: { readBy: req.user._id } });
    res.json({ messages });
  } catch (error) { next(error); }
});
router.patch('/:id', async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, members: req.user._id, isGroup: true });
    if (!conversation) return res.status(404).json({ message: 'Group not found.' });
    if (conversation.createdBy.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the group creator can edit this group.' });
    if (typeof req.body.name === 'string' && req.body.name.trim()) conversation.name = req.body.name.trim().slice(0, 60);
    if (typeof req.body.groupImage === 'string') conversation.groupImage = req.body.groupImage;
    await conversation.save();
    res.json({ conversation: await conversation.populate('members', '-password') });
  } catch (error) { next(error); }
});
router.post('/:id/members', async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, members: req.user._id, isGroup: true });
    if (!conversation) return res.status(404).json({ message: 'Group not found.' });
    const member = await require('../models/User').findOne({ _id: req.body.userId }).select('_id');
    if (!member) return res.status(404).json({ message: 'User not found.' });
    if (!conversation.members.some((id) => id.toString() === member._id.toString())) conversation.members.push(member._id);
    await conversation.save();
    res.json({ conversation: await conversation.populate('members', '-password') });
  } catch (error) { next(error); }
});
router.delete('/:id/members/:memberId', async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, members: req.user._id, isGroup: true });
    if (!conversation) return res.status(404).json({ message: 'Group not found.' });
    const isSelf = req.params.memberId === req.user._id.toString();
    if (!isSelf && conversation.createdBy.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Only the group creator can remove members.' });
    conversation.members = conversation.members.filter((id) => id.toString() !== req.params.memberId);
    await conversation.save();
    res.json({ ok: true });
  } catch (error) { next(error); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await Message.deleteOne({ _id: req.params.id, senderId: req.user._id });
    if (!result.deletedCount) return res.status(403).json({ message: 'You can only delete your own messages.' });
    res.json({ messageId: req.params.id });
  } catch (error) { next(error); }
});
module.exports = router;
