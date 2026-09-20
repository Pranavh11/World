const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  emoji: String
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, trim: true, maxlength: 4000, default: '' },
  imageUrl: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  reactions: [reactionSchema],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
