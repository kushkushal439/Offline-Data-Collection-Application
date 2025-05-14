import mongoose from 'mongoose';

// Schema for a single question in the form
const QuestionSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['text', 'mcq', 'integer', 'range', 'decimal', 'checkbox', 'phone', 'email', 'date', 'media'] // Available question types
    },
    section: {
        type: String,
        default: ""
    },
    required: {
        type: Boolean,
        default: false
    },
    options: {
        type: [String],
        default: []
    },
    GoTo: {
        type: Map,
        of: Number,
        default: {}
    },
    answer: {
        type: String,
        default: ""
    },
    minValue: {
        type: Number,
        default: undefined
    },
    maxValue: {
        type: Number,
        default: undefined
    }
});

// Main form schema
const FormSchema = new mongoose.Schema({
    FormID: {
        type: Number,
        required: true,
        unique: true,
        // Auto-generated in the controller/service layer
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    Questions: {
        type: [QuestionSchema],
        required: true
    },
    Creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    UsersWithAccess: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    }

}, {
    timestamps: true
});

export default mongoose.model('Form', FormSchema);