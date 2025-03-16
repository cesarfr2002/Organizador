import mongoose from 'mongoose';

const NoteRevisionSchema = new mongoose.Schema({
  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  changes: [{
    type: String
  }]
});

export default mongoose.models.NoteRevision || mongoose.model('NoteRevision', NoteRevisionSchema);
