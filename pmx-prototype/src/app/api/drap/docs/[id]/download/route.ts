import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { id } = await params

    const doc = await queryOne<any>(
      `SELECT * FROM drap_documents WHERE id = $1`,
      [id]
    )

    if (!doc) {
      return NextResponse.json(
        { success: false, error: { code: 'DOCUMENT_NOT_FOUND', message: 'DRAP document not found' } },
        { status: 404 }
      )
    }

    // Access control: only the owning manufacturer or PMX admin
    if (user.manufacturer_id && user.manufacturer_id !== doc.manufacturer_id && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    if (!doc.pdf_path) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_PDF', message: 'PDF has not been generated' } },
        { status: 404 }
      )
    }

    try {
      const filePath = path.join(process.cwd(), 'public', doc.pdf_path)
      const pdfBytes = await readFile(filePath)

      return new NextResponse(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${doc.doc_ref || doc.doc_type}.pdf"`,
          'Content-Length': String(pdfBytes.length),
        },
      })
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'FILE_NOT_FOUND', message: 'PDF file not found on disk' } },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('DRAP doc download error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
