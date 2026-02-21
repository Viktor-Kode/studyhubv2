import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import Reminder from '@/lib/models/Reminder'
import { verifyToken } from '@/lib/auth/verifyToken'

export async function GET(request: NextRequest) {
    try {
        const user = await verifyToken(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        await connectDB()
        const reminders = await Reminder.find({ userId: user.userId }).sort({ date: 1, time: 1 })
        return NextResponse.json({ reminders })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await verifyToken(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        await connectDB()

        const reminder = await Reminder.create({
            ...body,
            userId: user.userId
        })

        return NextResponse.json({ reminder })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await verifyToken(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { _id, ...updateData } = body
        await connectDB()

        const reminder = await Reminder.findOneAndUpdate(
            { _id, userId: user.userId },
            updateData,
            { new: true }
        )

        if (!reminder) return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
        return NextResponse.json({ reminder })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await verifyToken(request)
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        await connectDB()
        const result = await Reminder.deleteOne({ _id: id, userId: user.userId })

        if (result.deletedCount === 0) return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 })
    }
}
