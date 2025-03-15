import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'task', 'event', 'achievement'],
    default: 'info',
  },
  read: {
    type: Boolean,
    default: false,
  },
  isSystemNotification: {
    type: Boolean,
    default: false,
  },
  relatedItemId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedItemModel',
  },
  relatedItemModel: {
    type: String,
    enum: ['Task', 'Subject', 'Event', 'Note', null],
    default: null,
  },
  link: {
    type: String,
    default: null,
  },
  icon: {
    type: String,
    default: 'bell',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Índices para mejorar rendimiento de consultas
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
