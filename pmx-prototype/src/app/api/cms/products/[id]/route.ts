import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    if (user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'PMX Admin access required' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    const allowedFields = [
      'brand_name', 'inn', 'strength', 'dosage_form', 'pack_size',
      'shelf_life_months', 'storage_conditions', 'who_gmp_certified',
      'drap_registered', 'status', 'price_per_unit_usd',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = $${idx++}`)
        values.push(body[field])
      }
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_FIELDS', message: 'No fields to update' } },
        { status: 400 }
      )
    }

    fields.push('updated_at = NOW()')
    values.push(id)

    const result = await query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Update CMS product error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    if (user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'PMX Admin access required' } },
        { status: 403 }
      )
    }

    const { id } = await params

    // Soft-delete by setting status to INACTIVE, or hard-delete if no orders reference it
    const orderCheck = await query(`SELECT id FROM orders WHERE product_id = $1 LIMIT 1`, [id])

    if (orderCheck.rows.length > 0) {
      // Soft delete - set inactive
      const result = await query(
        `UPDATE products SET status = 'INACTIVE', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      )
      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, data: { deleted: false, deactivated: true, product: result.rows[0] } })
    }

    // Hard delete
    const result = await query(`DELETE FROM products WHERE id = $1 RETURNING id`, [id])
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('Delete CMS product error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
