import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import LibraryDocument from '@/lib/models/LibraryDocument';
import SharedLibraryItem from '@/lib/models/SharedLibraryItem'; // Assuming it exists or I can just dynamically access it
import { verifyToken } from '@/lib/auth/verifyToken';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse(JSON.stringify({ error: 'Missing document ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await verifyToken(req);
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await connectDB();

    console.log(`[Frontend PDF Proxy] Requesting document ${id} for user ${user.userId}`);

    let fileUrl: string | null = null;

    // 1. Try LibraryDocument (Own)
    const doc = await LibraryDocument.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(id) ? id : new mongoose.Types.ObjectId() },
        { publicId: id }
      ],
      userId: user.userId
    }).lean();

    if (doc) {
      fileUrl = doc.fileUrl;
    } else {
      // 2. Try SharedLibraryItem (Approved)
      // Note: We might need to handle cases where SharedLibraryItem model isn't pre-loaded
      // For now we assume typical Mongoose connection handles shared models if imported
      const shared = await mongoose.model('SharedLibraryItem').findOne({
        $or: [
          { _id: mongoose.isValidObjectId(id) ? id : new mongoose.Types.ObjectId() },
          { publicId: id }
        ],
        moderationStatus: 'approved'
      }).lean();

      if (shared) {
        fileUrl = shared.fileUrl;
      }
    }

    if (!fileUrl) {
      console.warn(`[Frontend PDF Proxy] Document ${id} not found or access denied`);
      return new NextResponse(JSON.stringify({ error: 'Document not found or access denied' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Fetch from storage
    const storageResponse = await fetch(fileUrl, {
      headers: { Accept: 'application/pdf' },
    });

    if (!storageResponse.ok) {
      console.error(`[Frontend PDF Proxy] Storage fetch failed: ${storageResponse.status}`, fileUrl);
      return new NextResponse(JSON.stringify({ error: 'Failed to fetch from storage provider' }), { 
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Stream directly back
    return new NextResponse(storageResponse.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': 'inline',
      },
    });

  } catch (err: any) {
    console.error('[Frontend PDF Proxy] Internal error:', err?.message, err?.stack);
    return new NextResponse(
      JSON.stringify({ error: err?.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
