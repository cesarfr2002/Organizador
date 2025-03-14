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
  // Añadimos campo para almacenar las URLs de imágenes
  images: [{ type: String }],
  // Campos para estadísticas y metadatos
  contentStats: {
    words: { type: Number, default: 0 },
    chars: { type: Number, default: 0 },
    readingTime: { type: Number, default: 0 }
  },
  // Indicador para notas importantes o favoritas
  isImportant: { type: Boolean, default: false },
  // Propietario de la nota
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Campo para tareas relacionadas
  relatedTasks: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task' 
  }]
}, {
  timestamps: true
});

// Middleware para calcular estadísticas antes de guardar
NoteSchema.pre('save', function(next) {
  if (this.content) {
    // Contar palabras
    const words = this.content.trim().split(/\s+/).length;
    // Contar caracteres
    const chars = this.content.length;
    // Tiempo de lectura estimado (palabras / 200 palabras por minuto)
    const readingTime = Math.max(1, Math.ceil(words / 200));
    
    this.contentStats = {
      words,
      chars,
      readingTime
    };
  }
  next();
});

// Índices para mejorar la búsqueda
NoteSchema.index({ title: 'text', content: 'text' });
NoteSchema.index({ tags: 1 });
NoteSchema.index({ subject: 1 });
NoteSchema.index({ userId: 1 });
NoteSchema.index({ updatedAt: -1 });

module.exports = mongoose.models.Note || mongoose.model('Note', NoteSchema);
