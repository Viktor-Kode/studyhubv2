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

    // Ensure models are registered (especially if this is the first time they are accessed in this instance)
    const LibraryDoc = LibraryDocument;
    const SharedDoc = SharedLibraryItem;

    console.log(`[Frontend PDF Proxy] Requesting: ${id} | User: ${user.userId}`);

    let fileUrl: string | null = null;
    let foundSource = '';

    // 1. Try LibraryDocument (New system, own)
    const doc = await LibraryDoc.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(id) ? id : new mongoose.Types.ObjectId() },
        { publicId: id }
      ],
      userId: user.userId
    }).lean();

    if (doc) {
      fileUrl = doc.fileUrl;
      foundSource = 'LibraryDocument';
    } else {
      // 2. Try SharedLibraryItem (Approved community items)
      const shared = await SharedDoc.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(id) ? id : new mongoose.Types.ObjectId() },
          { publicId: id }
        ],
        moderationStatus: 'approved'
      }).lean();

      if (shared) {
        fileUrl = shared.fileUrl;
        foundSource = 'SharedLibraryItem';
      } else {
        // 3. Fallback for legacy items (if stored in a generic 'librarymaterials' collection)
        try {
           const legacy = await mongoose.connection.db?.collection('librarymaterials').findOne({
             $or: [
               { _id: mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null },
               { publicId: id }
             ]
           });
           if (legacy) {
             fileUrl = legacy.fileUrl;
             foundSource = 'LibraryMaterial (legacy)';
           }
        } catch (e) {
           console.warn('[Frontend PDF Proxy] Legacy check failed:', (e as Error).message);
        }
      }
    }

    if (!fileUrl) {
      console.warn(`[Frontend PDF Proxy] NOT FOUND: ${id} | User: ${user.userId}`);
      return new NextResponse(JSON.stringify({ error: 'Document not found or access denied' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[Frontend PDF Proxy] FOUND in ${foundSource}: ${fileUrl}`);

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
