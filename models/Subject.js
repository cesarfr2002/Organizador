import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
  campus: { 
    type: String,
    trim: true
  },
  building: { 
    type: String,
    trim: true
  },
  floor: { 
    type: String,
    trim: true
  },
  room: { 
    type: String,
    trim: true,
    required: true
  },
  additionalInfo: { 
    type: String,
    trim: true
  }
});

const ScheduleSlotSchema = new mongoose.Schema({
  day: { 
    type: Number, 
    required: true,
    min: 1,
    max: 7
  }, // 1-7 (lunes-domingo)
  startTime: { 
    type: String, 
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // formato HH:MM
  },
  endTime: { 
    type: String, 
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // formato HH:MM
  },
  location: LocationSchema
});

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#3182CE', // Color azul por defecto
    trim: true
  },
  professor: {
    type: String,
    trim: true
  },
  professorContact: {
    type: String,
    trim: true
  },
  credits: {
    type: Number,
    default: 0,
    min: 0
  },
  schedule: [ScheduleSlotSchema],
  notes: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
