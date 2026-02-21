import mongoose from 'mongoose'

const QuestionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true // IMPORTANT: Index for faster queries
        },
        content: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'answered'],
            default: 'pending'
        },
        answer: String,
        subject: String,
        difficulty: String
    },
    { timestamps: true }
)

// Compound index for user-specific queries
QuestionSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema)
