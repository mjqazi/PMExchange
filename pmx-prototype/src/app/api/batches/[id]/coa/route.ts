import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

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

    const batch = await queryOne<any>(`SELECT manufacturer_id FROM batches WHERE id = $1`, [id])
    if (!batch) {
      return NextResponse.json(
        { success: false, error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      )
    }

    if (user.manufacturer_id && user.manufacturer_id !== batch.manufacturer_id) {
      // Allow buyers to view CoA for their orders
      if (user.buyer_id) {
        const hasOrder = await queryOne(
          `SELECT 1 FROM orders WHERE batch_id = $1 AND buyer_id = $2`,
          [id, user.buyer_id]
        )
        if (!hasOrder && user.role !== 'PMX_ADMIN') {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
            { status: 403 }
          )
        }
      } else if (user.role !== 'PMX_ADMIN') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        )
      }
    }

    const coa = await queryOne<any>(
      `SELECT c.*, u.full_name as generated_by_name
       FROM coas c
       LEFT JOIN users u ON c.generated_by = u.id
       WHERE c.batch_id = $1 AND c.status = 'ISSUED'
       ORDER BY c.generated_at DESC
       LIMIT 1`,
      [id]
    )

    if (!coa) {
      return NextResponse.json(
        { success: false, error: { code: 'COA_NOT_FOUND', message: 'No issued CoA found for this batch' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: coa.id,
        coa_ref_no: coa.coa_ref_no,
        batch_id: id,
        generated_at: coa.generated_at,
        generated_by: coa.generated_by_name,
        pdf_path: coa.pdf_path,
        qr_code_payload: coa.qr_code_payload,
        sha256_hash: coa.sha256_hash,
        status: coa.status,
      },
    })
  } catch (error) {
    console.error('CoA GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
