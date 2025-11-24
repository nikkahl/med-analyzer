import mongoose from 'mongoose';
const { Schema } = mongoose;

const indicatorResultSchema = new Schema({
  dictionaryId: { // [cite: 97]
    type: Schema.Types.ObjectId,
    ref: 'Indicator',
    required: true,
  },
  name: { type: String, required: true }, // [cite: 98]
  value: { type: Number, required: true }, // [cite: 99]
  units: { type: String, required: true }, // [cite: 100]
});

const analysisSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, 
  },
  analysisDate: { // [cite: 92]
    type: Date,
    default: Date.now, 
  },
  originalFilePath: { // [cite: 93]
    type: String,
    required: false, 
  },
  rawOcrText: { // [cite: 94]
    type: String,
    required: true,
  },
  isVerified: { // [cite: 95]
    type: Boolean,
    default: false, 
  },
  indicators: [indicatorResultSchema], // [cite: 96]

}, {
  timestamps: true, // Додає createdAt [cite: 101]
});

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis;