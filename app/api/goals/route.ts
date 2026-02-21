import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import UserStats from '@/lib/models/UserStats'
import { verifyToken } from '@/lib/auth/verifyToken'

export async function GET(request: NextRequest) {
    try {
        const user = await verifyToken(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const stats = await UserStats.findOne({ userId: user.userId })
        return NextResponse.json({ goals: stats?.goals || [] })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await verifyToken(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const goal = await request.json()
        await connectDB()

        const stats = await UserStats.findOneAndUpdate(
            { userId: user.userId },
            { $push: { goals: goal } },
            { upsert: true, new: true }
        )

        return NextResponse.json({ goals: stats.goals })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await verifyToken(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const goalId = searchParams.get('id')

        await connectDB()
        const stats = await UserStats.findOneAndUpdate(
            { userId: user.userId },
            { $pull: { goals: { _id: goalId } } },
            { new: true }
        )

        return NextResponse.json({ goals: stats?.goals || [] })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
    }
}
