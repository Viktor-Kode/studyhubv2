import mongoose from 'mongoose'

const CBTResultSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        subject: {
            type: String,
            required: true
        },
        examType: {
            type: String,
            required: true
        },
        year: String,
        totalQuestions: {
            type: Number,
            required: true
        },
        correctAnswers: {
            type: Number,
            required: true
        },
        wrongAnswers: {
            type: Number,
            required: true
        },
        skipped: {
            type: Number,
            default: 0
        },
        accuracy: {
            type: Number, // Percentage
            required: true
        },
        timeTaken: Number,
        takenAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
)

export default mongoose.models.CBTResult || mongoose.model('CBTResult', CBTResultSchema)
