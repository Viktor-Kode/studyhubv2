import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import StudySession from '@/lib/models/StudySession'
import UserStats from '@/lib/models/UserStats'
import { verifyToken } from '@/lib/auth/verifyToken'

export async function GET(request: NextRequest) {
    try {
        const user = await verifyToken(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const sessions = await StudySession.find({ userId: user.userId })
            .sort({ startTime: -1 })
            .limit(50)

        return NextResponse.json({ sessions })
    } catch (error) {
        console.error('Error fetching study sessions:', error)
        return NextResponse.json({ error: 'Failed to fetch study sessions' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await verifyToken(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        await connectDB()

        const session = await StudySession.create({
            ...body,
            userId: user.userId
        })

        // Update UserStats
        if (body.type === 'study') {
            const today = new Date().setHours(0, 0, 0, 0)
            const userStats = await UserStats.findOneAndUpdate(
                { userId: user.userId },
                {
                    $inc: {
                        totalStudyMinutes: body.duration || 0,
                        sessionsCompleted: 1,
                        xp: (body.duration || 0) * 10
                    }
                },
                { upsert: true, new: true }
            )

            // Update streak logic
            if (userStats.lastStudyDate) {
                const lastDate = new Date(userStats.lastStudyDate).setHours(0, 0, 0, 0)
                const diffDays = (today - lastDate) / (1000 * 60 * 60 * 24)

                if (diffDays === 1) {
                    userStats.studyStreak += 1
                } else if (diffDays > 1) {
                    userStats.studyStreak = 1
                }
            } else {
                userStats.studyStreak = 1
            }
            userStats.lastStudyDate = new Date()
            await userStats.save()
        }

        return NextResponse.json({ session }, { status: 201 })
    } catch (error) {
        console.error('Error creating study session:', error)
        return NextResponse.json({ error: 'Failed to create study session' }, { status: 500 })
    }
}
