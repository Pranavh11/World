const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

function registerSockets(io) {
  const onlineUsers = new Map();
  io.use((socket, next) => {
    try { const token = socket.handshake.auth?.token; socket.userId = jwt.verify(token, process.env.JWT_SECRET).userId; next(); } catch { next(new Error('Unauthorized')); }
  });
  io.on('connection', async (socket) => {
    const userId = String(socket.userId); onlineUsers.set(userId, socket.id); socket.join(`user:${userId}`);
    await User.findByIdAndUpdate(userId, { isOnline: true }); io.emit('user-online', { userId });
    socket.on('join-conversation', async (id) => { const conversation = await Conversation.findOne({ _id: id, members: userId }).select('_id'); if (conversation) socket.join(`conversation:${id}`); });
    socket.on('typing', async ({ conversationId }) => { if (await Conversation.exists({ _id: conversationId, members: userId })) socket.to(`conversation:${conversationId}`).emit('typing', { conversationId, userId }); });
    socket.on('stop-typing', async ({ conversationId }) => { if (await Conversation.exists({ _id: conversationId, members: userId })) socket.to(`conversation:${conversationId}`).emit('stop-typing', { conversationId, userId }); });
    socket.on('send-message', async ({ conversationId, text = '', imageUrl = '', replyTo = null }, callback) => {
      try {
        const conversation = await Conversation.findOne({ _id: conversationId, members: userId });
        if (!conversation || (!text.trim() && !imageUrl)) return callback?.({ error: 'Message is empty.' });
        const reply = replyTo ? await Message.findOne({ _id: replyTo, conversationId }) : null;
        const message = await Message.create({ conversationId, senderId: userId, text: text.trim(), imageUrl, replyTo: reply?._id || null, readBy: [userId] });
        await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id, updatedAt: new Date() });
        const full = await Message.findById(message._id).populate('senderId', 'displayName username profileImage').populate({ path: 'replyTo', populate: { path: 'senderId', select: 'displayName username' } });
        io.to(`conversation:${conversationId}`).emit('receive-message', full);
        conversation.members.filter((member) => String(member) !== userId).forEach(async (member) => { await Notification.create({ userId: member, actorId: userId, type: conversation.isGroup ? 'group' : 'message', conversationId, message: text.trim() || 'Sent an image' }); io.to(`user:${member}`).emit('notification', { type: conversation.isGroup ? 'group' : 'message', conversationId }); });
        callback?.({ message: full });
      } catch (error) { callback?.({ error: 'Unable to send message.' }); }
    });
    socket.on('message-read', async ({ conversationId }) => { if (!await Conversation.exists({ _id: conversationId, members: userId })) return; await Message.updateMany({ conversationId, readBy: { $ne: userId } }, { $addToSet: { readBy: userId } }); io.to(`conversation:${conversationId}`).emit('message-read', { conversationId, userId }); });
    socket.on('message-reaction', async ({ messageId, emoji, conversationId }) => { if (!await Conversation.exists({ _id: conversationId, members: userId })) return; const message = await Message.findOne({ _id: messageId, conversationId }); if (!message || !['❤️', '😂', '😭', '😮', '👍'].includes(emoji)) return; message.reactions = message.reactions.filter((reaction) => String(reaction.userId) !== userId); if (emoji) message.reactions.push({ userId, emoji }); await message.save(); io.to(`conversation:${conversationId}`).emit('message-reaction', message); });
    socket.on('message-deleted', async ({ messageId, conversationId }) => { if (!await Conversation.exists({ _id: conversationId, members: userId })) return; const result = await Message.updateOne({ _id: messageId, conversationId, senderId: userId }, { $set: { isDeleted: true, text: '', imageUrl: '', replyTo: null, reactions: [] } }); if (result.modifiedCount) io.to(`conversation:${conversationId}`).emit('message-deleted', { messageId }); });
    socket.on('disconnect', async () => { if (onlineUsers.get(userId) === socket.id) { onlineUsers.delete(userId); await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() }); io.emit('user-offline', { userId }); } });
  });
}
module.exports = registerSockets;
