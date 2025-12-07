// src/models/indicator.model.js
import mongoose from 'mongoose';
const indicatorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
      unique: true 
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
  referenceMin: {
    type: Number,
    default: null, 
  },
  referenceMax: {
    type: Number,
    default: null, 
  }
}, {
  timestamps: true, 
});

indicatorSchema.index({ name: 1 });

const Indicator = mongoose.model('Indicator', indicatorSchema);

    export default Indicator;