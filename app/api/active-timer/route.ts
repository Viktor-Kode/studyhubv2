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

        return NextResponse.json({ timer: stats?.activeTimer || null })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch timer' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await verifyToken(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { timer } = await request.json()
        await connectDB()

        await UserStats.findOneAndUpdate(
            { userId: user.userId },
            { $set: { activeTimer: timer } },
            { upsert: true }
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save timer' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await verifyToken(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        await UserStats.findOneAndUpdate(
            { userId: user.userId },
            { $unset: { activeTimer: "" } }
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to clear timer' }, { status: 500 })
    }
}
