import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// PUT: Update product details
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    if (user.role !== 'SELLER_ADMIN' && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'SELLER_ADMIN role required' } },
        { status: 403 }
      )
    }

    const { id, productId } = await params

    // Sellers can only update their own products
    if (user.role === 'SELLER_ADMIN' && user.manufacturer_id !== id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only update your own products' } },
        { status: 403 }
      )
    }

    // Verify product belongs to this manufacturer
    const existing = await queryOne<{ id: string; manufacturer_id: string }>(
      `SELECT id, manufacturer_id FROM products WHERE id = $1 AND manufacturer_id = $2`,
      [productId, id]
    )
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found for this manufacturer' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      brand_name,
      strength,
      dosage_form,
      drap_reg_no,
      annual_production_capacity,
      export_eligible_countries,
      labelling_reference,
      pharmacopoeia,
      marketed_status,
    } = body

    // Build dynamic UPDATE
    const setClauses: string[] = []
    const values: unknown[] = []
    let paramIdx = 1

    if (brand_name !== undefined) {
      setClauses.push(`brand_name = $${paramIdx++}`)
      values.push(brand_name)
    }
    if (strength !== undefined) {
      setClauses.push(`strength = $${paramIdx++}`)
      values.push(strength)
    }
    if (dosage_form !== undefined) {
      setClauses.push(`dosage_form = $${paramIdx++}`)
      values.push(dosage_form)
    }
    if (drap_reg_no !== undefined) {
      setClauses.push(`drap_reg_no = $${paramIdx++}`)
      values.push(drap_reg_no)
    }
    if (annual_production_capacity !== undefined) {
      setClauses.push(`annual_production_capacity = $${paramIdx++}`)
      values.push(annual_production_capacity)
    }
    if (export_eligible_countries !== undefined) {
      setClauses.push(`export_eligible_countries = $${paramIdx++}`)
      values.push(export_eligible_countries)
    }
    if (labelling_reference !== undefined) {
      setClauses.push(`labelling_reference = $${paramIdx++}`)
      values.push(labelling_reference)
    }
    if (pharmacopoeia !== undefined) {
      setClauses.push(`pharmacopoeia = $${paramIdx++}`)
      values.push(pharmacopoeia)
    }
    if (marketed_status !== undefined) {
      setClauses.push(`marketed_status = $${paramIdx++}`)
      values.push(marketed_status)
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } },
        { status: 400 }
      )
    }

    values.push(productId)
    values.push(id)

    const result = await queryOne(
      `UPDATE products SET ${setClauses.join(', ')}
       WHERE id = $${paramIdx} AND manufacturer_id = $${paramIdx + 1}
       RETURNING *`,
      values
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

// DELETE: Deactivate product (soft-delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    if (user.role !== 'SELLER_ADMIN' && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'SELLER_ADMIN role required' } },
        { status: 403 }
      )
    }

    const { id, productId } = await params

    // Sellers can only deactivate their own products
    if (user.role === 'SELLER_ADMIN' && user.manufacturer_id !== id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only manage your own products' } },
        { status: 403 }
      )
    }

    // Verify product belongs to this manufacturer
    const existing = await queryOne<{ id: string; inn_name: string }>(
      `SELECT id, inn_name FROM products WHERE id = $1 AND manufacturer_id = $2`,
      [productId, id]
    )
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found for this manufacturer' } },
        { status: 404 }
      )
    }

    // Check if batches reference this product
    const batchRef = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM batches WHERE product_id = $1`,
      [productId]
    )
    const batchCount = parseInt(batchRef?.count || '0', 10)

    // Soft-delete: set status to INACTIVE
    await query(
      `UPDATE products SET status = 'INACTIVE' WHERE id = $1 AND manufacturer_id = $2`,
      [productId, id]
    )

    // Note: the product_count trigger fires on DELETE, not UPDATE.
    // Since we're soft-deleting, we manually decrement.
    await query(
      `UPDATE manufacturers SET product_count = GREATEST(product_count - 1, 0) WHERE id = $1`,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: {
        deactivated: true,
        message: batchCount > 0
          ? `Product deactivated (${batchCount} batch(es) linked - preserved for audit trail)`
          : 'Product deactivated successfully',
      },
    })
  } catch (error) {
    console.error('Deactivate product error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
