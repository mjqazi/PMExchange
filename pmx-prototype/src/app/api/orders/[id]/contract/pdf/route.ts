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

    const order = await queryOne<any>(`SELECT * FROM orders WHERE id = $1`, [id])
    if (!order) {
      return NextResponse.json(
        { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } },
        { status: 404 }
      )
    }

    // Access control
    if (user.buyer_id && user.buyer_id !== order.buyer_id && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }
    if (user.manufacturer_id && user.manufacturer_id !== order.seller_id && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    if (!order.contract_pdf_path) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_CONTRACT', message: 'Contract PDF has not been generated yet' } },
        { status: 404 }
      )
    }

    try {
      const filePath = path.join(process.cwd(), 'public', order.contract_pdf_path)
      const pdfBytes = await readFile(filePath)

      return new NextResponse(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${order.contract_ref || 'contract'}.pdf"`,
          'Content-Length': String(pdfBytes.length),
        },
      })
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'FILE_NOT_FOUND', message: 'Contract PDF file not found on disk' } },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Contract PDF download error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
