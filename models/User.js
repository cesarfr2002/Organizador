const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Por favor ingrese su nombre'] 
  },
  email: { 
    type: String, 
    required: [true, 'Por favor ingrese su correo electrónico'], 
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingrese un correo electrónico válido'] 
  },
  password: { 
    type: String, 
    required: [true, 'Por favor ingrese su contraseña'] 
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  settings: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    notificationsEnabled: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: false },
    language: { type: String, enum: ['es', 'en'], default: 'es' },
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
