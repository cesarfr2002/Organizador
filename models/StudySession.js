import mongoose from 'mongoose';

const StudySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: false
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    duration: {
      type: Number, // Duración en minutos
      required: true,
      min: 1
    },
    notes: {
      type: String,
      default: ''
    },
    tags: [{
      type: String
    }],
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    isPomodoro: {
      type: Boolean,
      default: false
    },
    pomodoroCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.StudySession || mongoose.model('StudySession', StudySessionSchema);
