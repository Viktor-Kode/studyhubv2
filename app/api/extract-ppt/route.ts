import { NextRequest, NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import os from 'os'

export async function POST(req: NextRequest) {
    try {
        let officeParser: any
        try {
            const mod = await import('officeparser')
            officeParser = mod?.default ?? mod
        } catch (e: any) {
            console.error('Failed to import officeparser:', e)
            return NextResponse.json(
                { error: 'PPT extraction module is not available' },
                { status: 501 }
            )
        }

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
            // Modern officeparser (v6+) uses parseOffice as an async function returning an AST object
            const ast = await officeParser.parseOffice(tempFilePath)

            // Extract text from the AST
            const text = typeof ast.toText === 'function' ? ast.toText() : JSON.stringify(ast)

            // Cleanup
            await unlink(tempFilePath).catch(() => { })

            return NextResponse.json({ text: text || '' })
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
