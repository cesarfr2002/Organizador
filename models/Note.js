const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String },
  tags: [{ type: String }],
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  attachments: [{ 
    name: String,
    path: String,
    type: String
  }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.models.Note || mongoose.model('Note', NoteSchema);
