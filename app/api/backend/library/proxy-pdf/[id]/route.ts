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
  context: any // Use any to support both Next.js 14 (object) and 15/16 (Promise)
) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[PDF Proxy][${requestId}] Request start`);

  try {
    // 1. Resolve Params safely
    let id = '';
    try {
      // In Next.js 15, context.params is a Promise. In 14, it's an object.
      // We resolve it safely here.
      const resolvedParams = await context.params;
      id = resolvedParams?.id || context.params?.id || '';
    } catch (e) {
      console.warn(`[PDF Proxy][${requestId}] Params resolve notice:`, e);
      id = context.params?.id || '';
    }

    if (!id || id === 'undefined' || id === 'null') {
      console.error(`[PDF Proxy][${requestId}] Invalid ID received:`, id);
      return NextResponse.json({ error: 'Invalid or missing document ID' }, { status: 400 });
    }

    // 2. Extract Token
    const authHeader = req.headers.get('authorization');
    let token = '';
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = req.cookies.get('auth-token')?.value || '';
    }

    // 3. Verify User
    const user = await verifyToken(req);
    if (!user) {
      console.warn(`[PDF Proxy][${requestId}] Unauthorized access attempt for document: ${id}`);
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: token ? 'Session expired' : 'No token provided' 
      }, { status: 401 });
    }

    // 4. DB Connection
    try {
      await connectDB();
    } catch (dbErr: any) {
      console.error(`[PDF Proxy][${requestId}] DB Connection Failed:`, dbErr.message);
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
    }

    // 5. Document Lookup
    let fileUrl: string | null = null;
    let foundSource = '';

    try {
      // Priority 1: User's own document
      // Use mongoose.Types.ObjectId.isValid for better compatibility
      const isValidId = mongoose.Types.ObjectId.isValid(id);
      
      const libraryQuery: any = {
        $or: [
          ...(isValidId ? [{ _id: id }] : []),
          { publicId: id }
        ],
        userId: user.userId
      };

      const doc = await LibraryDocument.findOne(libraryQuery).lean();

      if (doc) {
        fileUrl = doc.fileUrl;
        foundSource = 'LibraryDocument';
      } else {
        // Priority 2: Shared/Community document
        const sharedQuery: any = {
          $or: [
            ...(isValidId ? [{ _id: id }] : []),
            { publicId: id }
          ],
          moderationStatus: 'approved'
        };

        const shared = await SharedLibraryItem.findOne(sharedQuery).lean();

        if (shared) {
          fileUrl = shared.fileUrl;
          foundSource = 'SharedLibraryItem';
        } else {
          // Priority 3: Legacy collection (librarymaterials)
          // Safely access the raw collection
          const db = mongoose.connection.db;
          if (db) {
            const legacyQuery: any = {
              $or: [
                ...(isValidId ? [{ _id: new mongoose.Types.ObjectId(id) }] : []),
                { publicId: id }
              ]
            };
            const legacy = await db.collection('librarymaterials').findOne(legacyQuery);
            if (legacy) {
              fileUrl = legacy.fileUrl as string;
              foundSource = 'LibraryMaterial (legacy)';
            }
          }
        }
      }
    } catch (lookupErr: any) {
      console.error(`[PDF Proxy][${requestId}] Lookup Error:`, lookupErr.message, lookupErr.stack);
      return NextResponse.json({ 
        error: 'Document lookup failed', 
        details: lookupErr.message,
        path: id
      }, { status: 500 });
    }

    if (!fileUrl) {
      console.warn(`[PDF Proxy][${requestId}] Document NOT FOUND: ${id}`);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Validate if URL is absolute
    if (!fileUrl.startsWith('http')) {
      console.error(`[PDF Proxy][${requestId}] Invalid fileUrl: ${fileUrl}`);
      return NextResponse.json({ error: 'Invalid document storage URL' }, { status: 500 });
    }

    console.log(`[PDF Proxy][${requestId}] Fetching from storage (${foundSource}): ${fileUrl.substring(0, 50)}...`);

    // 6. Fetch from Storage
    try {
      const storageResponse = await fetch(fileUrl, {
        headers: { 
          'Accept': 'application/pdf',
          // Only forward auth if it looks like a proxy request to another internal backend
          ...(fileUrl.includes('studyhelp') ? { 'Authorization': `Bearer ${token}` } : {})
        },
      });

      if (!storageResponse.ok) {
        console.error(`[PDF Proxy][${requestId}] Upstream error: ${storageResponse.status}`);
        return NextResponse.json({ 
          error: 'Storage provider error', 
          status: storageResponse.status 
        }, { status: 502 });
      }

      const buffer = await storageResponse.arrayBuffer();

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
      console.error(`[PDF Proxy][${requestId}] Network Error:`, fetchErr.message);
      return NextResponse.json({ error: 'Fetch failed', details: fetchErr.message }, { status: 504 });
    }

  } catch (err: any) {
    console.error(`[PDF Proxy][${requestId}] FATAL:`, err?.message, err?.stack);
    return NextResponse.json({ error: 'Internal server error', details: err?.message }, { status: 500 });
  }
}
