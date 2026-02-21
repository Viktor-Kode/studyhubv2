import mongoose from 'mongoose'

const StudySessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['study', 'quiz', 'flashcard', 'break'],
            default: 'study'
        },
        duration: {
            type: Number, // In minutes
            required: true
        },
        startTime: {
            type: Date,
            default: Date.now
        },
        endTime: Date,
        notes: String
    },
    { timestamps: true }
)

StudySessionSchema.index({ userId: 1, startTime: -1 })

export default mongoose.models.StudySession || mongoose.model('StudySession', StudySessionSchema)
