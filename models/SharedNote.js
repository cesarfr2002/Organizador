import mongoose from 'mongoose';

const SharedNoteSchema = new mongoose.Schema({
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
  shareCode: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para búsquedas rápidas
SharedNoteSchema.index({ shareCode: 1 });
SharedNoteSchema.index({ noteId: 1 });
SharedNoteSchema.index({ expiresAt: 1 });

export default mongoose.models.SharedNote || mongoose.model('SharedNote', SharedNoteSchema);
