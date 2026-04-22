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
        
        if (!user.userId || !mongoose.Types.ObjectId.isValid(user.userId)) {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
        }

        const userObjectId = new mongoose.Types.ObjectId(user.userId)

        // Fetch or create high-level stats
        let stats = await UserStats.findOne({ userId: userObjectId })
        if (!stats) {
            stats = await UserStats.create({ userId: userObjectId })
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
        const flashcardCount = await FlashCard.countDocuments({ userId: userObjectId })
        const masteredCards = await FlashCard.countDocuments({ userId: userObjectId, masteryLevel: { $gte: 4 } })

        // Question stats
        const questionCount = await Question.countDocuments({ userId: userObjectId })

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
        return NextResponse.json({ 
            error: 'Failed to fetch stats',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
