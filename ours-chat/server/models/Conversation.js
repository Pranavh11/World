const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  groupImage: { type: String, default: '' },
  isGroup: { type: Boolean, default: false },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
