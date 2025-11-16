// src/models/indicator.model.js

import mongoose from 'mongoose';

const indicatorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  aliases: {
    type: [String],
    default: [],
  },
  units: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

indicatorSchema.index({ name: 1 }, { unique: true });

const Indicator = mongoose.model('Indicator', indicatorSchema);

export default Indicator;