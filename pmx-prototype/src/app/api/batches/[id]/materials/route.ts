import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function POST(
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

    // Get batch and validate access
    const batch = await queryOne<any>(
      `SELECT manufacturer_id, status FROM batches WHERE id = $1`,
      [id]
    )

    if (!batch) {
      return NextResponse.json(
        { success: false, error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      )
    }

    if (user.manufacturer_id && user.manufacturer_id !== batch.manufacturer_id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    // Only allow material additions when batch is IN_PROGRESS or QA_REVIEW
    if (!['IN_PROGRESS', 'QA_REVIEW'].includes(batch.status)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: `Cannot add materials when batch is ${batch.status}` } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { material_type, material_name, supplier_name, lot_no, quantity_used, unit, supplier_coa_ref } = body

    if (!material_type || !material_name || !quantity_used || !unit) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'material_type, material_name, quantity_used, and unit are required' } },
        { status: 400 }
      )
    }

    if (!['API', 'EXCIPIENT'].includes(material_type.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'material_type must be API or EXCIPIENT' } },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO batch_materials (batch_id, material_type, material_name, supplier_name, lot_no, quantity_used, unit, supplier_coa_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        material_type.toUpperCase(),
        material_name,
        supplier_name || null,
        lot_no || null,
        quantity_used,
        unit,
        supplier_coa_ref || null,
      ]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    }, { status: 201 })
  } catch (error) {
    console.error('Material create error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
