import { NextRequest, NextResponse } from 'next/server'
import officeParser from 'officeparser'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import os from 'os'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        // officeparser typically requires a file path or buffer. 
        // Newer versions support buffer, but to receive best compatibility let's try buffer first.
        // If officeparser doesn't support buffer directly in the installed version, we might need to write to temp.

        // Write buffer to temp file as officeparser is more reliable with paths
        const tempDir = os.tmpdir()
        const tempFilePath = path.join(tempDir, `upload-${Date.now()}-${file.name}`)

        await writeFile(tempFilePath, buffer)

        try {
            // Use parseOffice with a Promise wrapper for compatibility
            const text = await new Promise<string>((resolve, reject) => {
                // @ts-ignore - officeparser types might be mismatched with the installed version
                officeParser.parseOffice(tempFilePath, (data: any, err: any) => {
                    if (err) return reject(err)
                    resolve(typeof data === 'string' ? data : JSON.stringify(data))
                })
            })

            // Cleanup
            await unlink(tempFilePath).catch(() => { })

            return NextResponse.json({ text: typeof text === 'string' ? text : '' })
        } catch (parseError: any) {
            console.error('OfficeParser Error:', parseError)
            await unlink(tempFilePath).catch(() => { }) // Cleanup on error

            return NextResponse.json(
                { error: 'Failed to parse presentation file', details: parseError.message },
                { status: 500 }
            )
        }
    } catch (error: any) {
        console.error('PPT Extraction Error:', error)
        return NextResponse.json(
            { error: 'Failed to extract text from presentation' },
            { status: 500 }
        )
    }
}
