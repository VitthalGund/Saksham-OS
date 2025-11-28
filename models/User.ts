import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
    },
    role: {
        type: String,
        enum: ['freelancer', 'client'],
        required: [true, 'Please specify a role'],
    },
    // Custom IDs to match CSV/JSON format
    userId: {
        type: String,
        unique: true,
    },
    companyId: {
        type: String,
        // unique: true, // Not unique globally, only for clients? Or maybe unique if sparse?
        sparse: true, // Allows null/undefined to not conflict
    },
    isBankConnected: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    location: { type: String },
    bio: { type: String },
    preferences: {
        emailNotifications: { type: Boolean, default: true },
        publicProfile: { type: Boolean, default: false }
    },
    // Resume & Credibility Fields
    skills: {
        type: [String],
        default: []
    },
    experienceYears: {
        type: Number,
        default: 0
    },
    credibilityScore: {
        type: Number,
        default: 0
    },
    resumeUploadedAt: {
        type: Date
    }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
