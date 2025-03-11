const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  priority: { type: Number, default: 2 }, // 1:alta, 2:media, 3:baja
  completed: { type: Boolean, default: false },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.models.Task || mongoose.model('Task', TaskSchema);
