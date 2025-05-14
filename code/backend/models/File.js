import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  formId: {
    type: Number,
    required: true,
    ref: 'Form'
  },
  responseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Response'
  },
  questionId: {
    type: String,
    required: true
  },
  localSubmissionId: {
    type: String
  },
  usersWithAccess: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const File = mongoose.model('File', fileSchema);

export default File;