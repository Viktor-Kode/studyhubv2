import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongodb'
import FlashCard from '@/lib/models/FlashCard'
import { verifyToken } from '@/lib/auth/verifyToken'

export async function GET(request: NextRequest) {
    try {
        const user = await verifyToken(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()

        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const deckId = searchParams.get('deckId')

        const query: any = { userId: user.userId }
        if (category) query.category = category
        if (deckId) query.deckId = deckId

        const flashCards = await FlashCard.find(query).sort({ createdAt: -1 })

        return NextResponse.json({ flashCards })
    } catch (error) {
        console.error('Error fetching flashcards:', error)
        return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 })
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

        const flashCard = await FlashCard.create({
            ...body,
            userId: user.userId
        })

        return NextResponse.json({ flashCard }, { status: 201 })
    } catch (error) {
        console.error('Error creating flashcard:', error)
        return NextResponse.json({ error: 'Failed to create flashcard' }, { status: 500 })
    }
}
