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

    // Extract token for declaration safety and downstream forwarding
    const authHeader = req.headers.get('authorization');
    let token = '';
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = req.cookies.get('auth-token')?.value || '';
    }

    const user = await verifyToken(req);
    if (!user) {
      const hasToken = !!token;
      
      console.warn(`[PDF Proxy] Auth failed. Token present: ${hasToken}`);
      
      return new NextResponse(JSON.stringify({ 
        error: 'Unauthorized', 
        message: hasToken ? 'Your session token is invalid or expired.' : 'No authentication token provided.'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[Frontend PDF Proxy] Initializing DB connection...');
    try {
      await connectDB();
    } catch (dbErr: any) {
      console.error('[Frontend PDF Proxy] DB Connection Failed:', dbErr.message);
      return new NextResponse(JSON.stringify({ error: 'Database connection failed', details: dbErr.message }), { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Ensure models are registered
    const LibraryDoc = LibraryDocument;
    const SharedDoc = SharedLibraryItem;

    console.log(`[Frontend PDF Proxy] Requesting: ${id} | User: ${user.userId}`);

    let fileUrl: string | null = null;
    let foundSource = '';

    // 1. Try LibraryDocument (New system, own)
    try {
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
          // 3. Fallback for legacy items
          console.log('[Frontend PDF Proxy] checking legacy collection...');
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
        }
      }
    } catch (lookupErr: any) {
      console.error('[Frontend PDF Proxy] Document lookup error:', lookupErr.message);
      return new NextResponse(JSON.stringify({ error: 'Error during document lookup', details: lookupErr.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
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
    try {
      const storageResponse = await fetch(fileUrl, {
        headers: { 
          Accept: 'application/pdf',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      });

      if (!storageResponse.ok) {
        console.error(`[Frontend PDF Proxy] Storage fetch failed: ${storageResponse.status}`, fileUrl);
        return new NextResponse(JSON.stringify({ error: 'Failed to fetch from storage provider', status: storageResponse.status }), { 
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Convert to ArrayBuffer for reliable output in serverless environments
      const buffer = await storageResponse.arrayBuffer();

      // 4. Return the binary data
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'private, max-age=3600',
          'Content-Disposition': 'inline',
        },
      });

    } catch (fetchErr: any) {
      console.error('[Frontend PDF Proxy] Upstream fetch error:', fetchErr.message);
      return new NextResponse(JSON.stringify({ error: 'Network error fetching document', details: fetchErr.message }), { 
        status: 504,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (err: any) {
    console.error('[Frontend PDF Proxy] Critical Unhandled error:', err?.message, err?.stack);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error', details: err?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
