import mongoose from 'mongoose';
const { Schema } = mongoose;

const indicatorResultSchema = new Schema({
      dictionaryId: { 
   type: Schema.Types.ObjectId,
   ref: 'Indicator',
  required: true,
  },
  name: { type: String, required: true }, 
  value: { type: Number, required: true }, 
  units: { type: String, required: true }, 
    referenceMin: { type: Number, default: null },
  referenceMax: { type: Number, default: null },
});

const analysisSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, 
  },
  analysisDate: { 
    type: Date,
    default: Date.now, 
  },
  originalFilePath: { 
    type: String,
    required: false, 
  },
  rawOcrText: { 
    type: String,
    required: true,
  },
  isVerified: { 
    type: Boolean,
    default: false, 
  },
  indicators: [indicatorResultSchema], 

}, {
  timestamps: true, 
});

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis;