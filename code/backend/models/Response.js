import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  FormID: {
    type: Number,
    required: true
  },
  answers: {
    type: Object,
    required: true
  },
  submissionDate: {
    type: String,
    required: true
  },
  submissionTime: {
    type: String,
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  localSubmissionId: {
    type: String
  }
}, {
  timestamps: true
});

const Response = mongoose.model('Response', responseSchema);

export default Response;