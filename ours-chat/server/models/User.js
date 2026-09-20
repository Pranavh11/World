const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 24 },
  displayName: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  profileImage: { type: String, default: '' },
  bio: { type: String, default: 'Making memories, one message at a time.' },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function save() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(value) {
  return bcrypt.compare(value, this.password);
};

module.exports = mongoose.model('User', userSchema);
