import mongoose from 'mongoose'

const ReminderSchema = new mongoose.Schema(
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
        date: {
            type: String,
            required: true
        },
        time: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['deadline', 'study', 'exam', 'other'],
            default: 'study'
        },
        completed: {
            type: Boolean,
            default: false
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        description: String,
        sendWhatsApp: {
            type: Boolean,
            default: false
        },
        whatsappNumber: String
    },
    { timestamps: true }
)

export default mongoose.models.Reminder || mongoose.model('Reminder', ReminderSchema)
