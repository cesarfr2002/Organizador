import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  type: {
    type: String,
    required: [true, 'El tipo de recurso es obligatorio'],
    enum: ['pdf', 'link', 'slides', 'video', 'image', 'document', 'other'],
    default: 'link'
  },
  url: {
    type: String,
    required: [true, 'La URL es obligatoria'],
    trim: true
  },
  // Campos nuevos para manejar archivos subidos
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number, // En bytes
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  important: {
    type: Boolean,
    default: false
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: null
  }
}, { timestamps: true });

export default mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);
