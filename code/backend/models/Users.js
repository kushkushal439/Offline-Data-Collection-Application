import mongoose from 'mongoose';

// Schema for individual form responses/submissions
const UserSchema = new mongoose.Schema({
    Username: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        unique: true,
        required: true
    },
    Password: {
        type: String,
        required: true
    },
},{
  timestamps: true
});

const User = mongoose.model('User', UserSchema);
export default User;