// src/models/user.model.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true, // пошта має бути унікальною [cite: 81]
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true, // хеш пароля
  },
}, {
  //  додає поля createdAt та updatedAt [cite: 83]
  timestamps: true,
});

const User = mongoose.model('User', userSchema);

module.exports = User;