import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import UserStats from '@/lib/models/UserStats'
import StudySession from '@/lib/models/StudySession'
import FlashCard from '@/lib/models/FlashCard'
import Question from '@/lib/models/Question'
import { verifyToken } from '@/lib/auth/verifyToken'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
    try {
        const user = await verifyToken(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()
        const userObjectId = new mongoose.Types.ObjectId(user.userId)

        // Fetch or create high-level stats
        let stats = await UserStats.findOne({ userId: user.userId })
        if (!stats) {
            stats = await UserStats.create({ userId: user.userId })
        }

        // Aggregate session totals
        const sessionStats = await StudySession.aggregate([
            { $match: { userId: userObjectId } },
            {
                $group: {
                    _id: null,
                    totalDuration: { $sum: '$duration' },
                    totalSessions: { $sum: 1 }
                }
            }
        ])

        // Flashcard stats
        const flashcardCount = await FlashCard.countDocuments({ userId: user.userId })
        const masteredCards = await FlashCard.countDocuments({ userId: user.userId, masteryLevel: { $gte: 4 } })

        // Question stats
        const questionCount = await Question.countDocuments({ userId: user.userId })

        return NextResponse.json({
            stats: {
                ...stats.toObject(),
                totalDuration: sessionStats[0]?.totalDuration || 0,
                totalSessions: sessionStats[0]?.totalSessions || 0,
                flashcardCount,
                masteredCards,
                questionCount
            }
        })
    } catch (error) {
        console.error('Error fetching stats:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
