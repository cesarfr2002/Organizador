import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Por favor ingresa un título'],
    trim: true
  },
  startTime: {
    type: Date,
    required: [true, 'La hora de inicio es requerida']
  },
  endTime: {
    type: Date,
    required: [true, 'La hora de finalización es requerida']
  },
  type: {
    type: String,
    enum: ['class', 'study', 'exam', 'assignment', 'meeting', 'other'],
    default: 'other'
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  alert: {
    type: Number, // Minutes before event to alert
    default: 30
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  color: {
    type: String,
    default: '#3788d8'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrenceRule: {
    type: String // iCalendar RRULE format (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR")
  },
  isAutoScheduled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
