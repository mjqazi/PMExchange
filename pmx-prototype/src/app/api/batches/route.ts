import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    let sql = `SELECT b.id, b.batch_no, b.manufacture_date, b.expiry_date, b.batch_size,
                      b.status, b.created_at, b.yield_actual, b.yield_variance_pct,
                      p.inn_name as product_inn, p.brand_name, p.strength, p.dosage_form
               FROM batches b
               JOIN products p ON b.product_id = p.id
               WHERE 1=1`
    const params: any[] = []
    let paramIdx = 1

    // Filter by manufacturer for seller users; admins see all; buyers get empty
    if (user.manufacturer_id) {
      sql += ` AND b.manufacturer_id = $${paramIdx++}`
      params.push(user.manufacturer_id)
    } else if (user.role !== 'PMX_ADMIN') {
      // Buyers should not see batch records directly
      return NextResponse.json({
        success: true,
        data: [],
        next_cursor: null,
        has_more: false,
      })
    }

    if (status) {
      sql += ` AND b.status = $${paramIdx++}`
      params.push(status)
    }
    if (cursor) {
      sql += ` AND b.created_at < $${paramIdx++}`
      params.push(cursor)
    }

    sql += ` ORDER BY b.created_at DESC LIMIT $${paramIdx}`
    params.push(limit + 1)

    const result = await query(sql, params)
    const hasMore = result.rows.length > limit
    const data = hasMore ? result.rows.slice(0, limit) : result.rows

    return NextResponse.json({
      success: true,
      data,
      next_cursor: hasMore ? data[data.length - 1].created_at : null,
      has_more: hasMore,
    })
  } catch (error) {
    console.error('List batches error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    if (!user.manufacturer_id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only seller users can create batches' } },
        { status: 403 }
      )
    }

    // Only QA or Admin can create batches
    if (!['SELLER_ADMIN', 'SELLER_QA'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only QA or Admin can create batches' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { product_id, batch_no, manufacture_date, expiry_date, batch_size, shelf_life_months, materials, steps } = body

    if (!product_id || !batch_no || !manufacture_date || !expiry_date || !batch_size) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'product_id, batch_no, manufacture_date, expiry_date, and batch_size are required' } },
        { status: 400 }
      )
    }

    // Verify product belongs to this manufacturer
    const product = await query(
      `SELECT id FROM products WHERE id = $1 AND manufacturer_id = $2`,
      [product_id, user.manufacturer_id]
    )
    if (product.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found or does not belong to your company' } },
        { status: 404 }
      )
    }

    // Create batch
    const batch = await query(
      `INSERT INTO batches (manufacturer_id, product_id, batch_no, manufacture_date, expiry_date, batch_size, shelf_life_months)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user.manufacturer_id, product_id, batch_no, manufacture_date, expiry_date, batch_size, shelf_life_months || null]
    )

    const batchId = batch.rows[0].id

    // Insert materials if provided
    if (materials && Array.isArray(materials)) {
      for (const mat of materials) {
        await query(
          `INSERT INTO batch_materials (batch_id, material_type, material_name, supplier_name, lot_no, quantity_used, unit, supplier_coa_ref)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [batchId, mat.material_type, mat.material_name, mat.supplier_name || null, mat.lot_no || null, mat.quantity_used, mat.unit, mat.supplier_coa_ref || null]
        )
      }
    }

    // Insert steps if provided
    if (steps && Array.isArray(steps)) {
      for (const step of steps) {
        await query(
          `INSERT INTO batch_steps (batch_id, step_no, description, equipment_id, process_params)
           VALUES ($1, $2, $3, $4, $5)`,
          [batchId, step.step_no, step.description, step.equipment_id || null, step.process_params ? JSON.stringify(step.process_params) : null]
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: batch.rows[0],
    }, { status: 201 })
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_BATCH', message: 'A batch with this number already exists' } },
        { status: 409 }
      )
    }
    console.error('Create batch error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
