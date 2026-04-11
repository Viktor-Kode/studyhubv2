import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Server-side PDF extraction API route.
 * Replaced pdfjs-dist with officeparser for better Node.js compatibility and reliability.
 */
export async function POST(req: NextRequest) {
    let tempFilePath: string | null = null;
    try {
        let officeParser: any;
        try {
            const mod = await import('officeparser');
            officeParser = mod?.default ?? mod;
        } catch (e: any) {
            console.error('Failed to import officeparser:', e);
            return NextResponse.json(
                { error: 'PDF extraction module is not available on server' },
                { status: 501 }
            );
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Write buffer to temp file as officeparser is more reliable with paths
        const tempDir = os.tmpdir();
        tempFilePath = path.join(tempDir, `pdf-upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);

        await writeFile(tempFilePath, buffer);

        try {
            // Match the proven pattern from extract-ppt/route.ts
            const result = await officeParser.parseOffice(tempFilePath);
            
            // Extract text from the result (which might be an AST object or string)
            const extractedText = typeof result?.toText === 'function' 
                ? result.toText() 
                : (typeof result === 'string' ? result : JSON.stringify(result));

            // Cleanup
            if (tempFilePath) await unlink(tempFilePath).catch(() => { });

            if (!extractedText || extractedText.trim().length < 50) {
                return NextResponse.json(
                    {
                        error: 'PDF appears to be empty or scanned. No readable text found via server-side extraction.'
                    },
                    { status: 400 }
                );
            }

            return NextResponse.json({
                success: true,
                text: extractedText.trim(),
            });
        } catch (parseError: any) {
            console.error('OfficeParser PDF Error:', parseError);
            if (tempFilePath) await unlink(tempFilePath).catch(() => { });

            return NextResponse.json(
                { error: 'Failed to parse PDF file on server', details: parseError.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('PDF Extraction API Error:', error);
        if (tempFilePath) await unlink(tempFilePath).catch(() => { });
        return NextResponse.json(
            { error: 'Unable to read this PDF on server. Try converting to .txt or .docx format.' },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
