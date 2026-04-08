import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const templates = await query(
      `SELECT id, product_id, test_name, method_reference, specification, result_unit, sort_order, required, created_at
       FROM product_qc_templates
       WHERE product_id = $1
       ORDER BY sort_order ASC`,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: templates.rows,
    })
  } catch (error) {
    console.error('QC templates GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
