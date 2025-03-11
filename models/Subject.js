const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  professor: { type: String },
  schedule: [{ 
    day: { type: Number }, // 0-6, donde 0 es domingo
    startTime: { type: String }, // formato "HH:MM" 
    endTime: { type: String },
    location: { type: String }
  }],
  color: { type: String, default: '#3f51b5' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

module.exports = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);
