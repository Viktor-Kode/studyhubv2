import mongoose from 'mongoose'

const FlashCardSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        front: {
            type: String,
            required: true
        },
        back: {
            type: String,
            required: true
        },
        category: String,
        deckId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FlashCardDeck'
        },
        masteryLevel: {
            type: Number,
            default: 0
        },
        nextReviewDate: Date,
        isFavorite: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
)

FlashCardSchema.index({ userId: 1, category: 1 })

export default mongoose.models.FlashCard || mongoose.model('FlashCard', FlashCardSchema)
