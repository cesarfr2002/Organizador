import mongoose from 'mongoose';

const StudySessionSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  minutes: {
    type: Number,
    required: true
  },
  notes: String
});

const ExamTaskSchema = new mongoose.Schema({
  topics: [String],
  duration: {
    type: Number, // minutos
    default: 60
  },
  allowedMaterials: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  }
});

const ProjectTaskSchema = new mongoose.Schema({
  objectives: [String],
  deliverables: [String],
  guidelines: {
    type: String,
    trim: true
  },
  groupWork: {
    type: Boolean,
    default: false
  },
  groupMembers: [String]
});

const AssignmentTaskSchema = new mongoose.Schema({
  requirements: [String],
  resources: [String],
  format: {
    type: String,
    trim: true
  }
});

const ReadingTaskSchema = new mongoose.Schema({
  pages: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    trim: true
  }
});

const PresentationTaskSchema = new mongoose.Schema({
  duration: {
    type: Number, // minutos
    default: 15
  },
  audience: {
    type: String,
    trim: true
  },
  visualAids: {
    type: Boolean,
    default: true
  }
});

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor proporciona un título para la tarea'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['tarea', 'examen', 'proyecto', 'lectura', 'presentacion', 'laboratorio', 'otro'],
    default: 'tarea'
  },
  priority: {
    type: String,
    enum: ['Baja', 'Media', 'Alta'],
    default: 'Media'
  },
  status: {
    type: String,
    enum: ['pendiente', 'en_progreso', 'completada', 'cancelada'],
    default: 'pendiente'
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  dueDate: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  estimatedTime: {
    type: Number, // minutos
    min: 0
  },
  reminder: {
    type: Date
  },
  tags: [String],
  difficulty: {
    type: String,
    enum: ['fácil', 'media', 'difícil'],
    default: 'media'
  },
  weight: { // Peso en la nota final
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  studyTime: {
    type: Number,
    default: 0
  },
  studySessions: [StudySessionSchema],
  // Campos específicos según el tipo de tarea
  examDetails: ExamTaskSchema,
  projectDetails: ProjectTaskSchema,
  assignmentDetails: AssignmentTaskSchema,
  readingDetails: ReadingTaskSchema,
  presentationDetails: PresentationTaskSchema
}, {
  timestamps: true
});

// Middleware para establecer completedAt cuando se completa una tarea
TaskSchema.pre('save', function(next) {
  if (this.isModified('completed') && this.completed) {
    this.completedAt = new Date();
  }
  next();
});

export default mongoose.models.Task || mongoose.model('Task', TaskSchema);
