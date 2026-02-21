import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import Question from '@/lib/models/Question'
import { verifyToken } from '@/lib/auth/verifyToken'

export async function GET(request: NextRequest) {
    try {
        // CRITICAL: Verify token and get userId
        const user = await verifyToken(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        // CRITICAL: Filter by userId
        const questions = await Question.find({ userId: user.userId })
            .sort({ createdAt: -1 })
            .limit(100)

        return NextResponse.json({ questions })
    } catch (error) {
        console.error('Error fetching questions:', error)
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        // CRITICAL: Verify token and get userId
        const user = await verifyToken(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        await connectDB()

        // CRITICAL: Add userId to new question
        const question = await Question.create({
            ...body,
            userId: user.userId // THIS IS CRITICAL!
        })

        return NextResponse.json({ question }, { status: 201 })
    } catch (error) {
        console.error('Error creating question:', error)
        return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    }
}
