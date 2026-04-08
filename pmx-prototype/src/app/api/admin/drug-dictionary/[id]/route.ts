import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// PUT: Update drug entry (PMX_ADMIN only)
export async function PUT(
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

    if (user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'PMX Admin access required' } },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verify drug exists
    const existing = await queryOne(
      `SELECT id FROM drug_dictionary WHERE id = $1`,
      [id]
    )
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Drug not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      inn_name,
      category_id,
      description,
      common_strengths,
      common_dosage_forms,
      pharmacopoeia,
      common_storage,
      active,
    } = body

    // If inn_name changed, check for duplicate
    if (inn_name) {
      const duplicate = await queryOne(
        `SELECT id FROM drug_dictionary WHERE LOWER(inn_name) = LOWER($1) AND id != $2`,
        [inn_name.trim(), id]
      )
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE', message: 'A drug with this INN name already exists' } },
          { status: 409 }
        )
      }
    }

    // Look up category name if category_id provided
    let category_name: string | null | undefined = undefined
    if (category_id !== undefined) {
      if (category_id) {
        const cat = await queryOne<{ name: string }>(
          `SELECT name FROM cms_product_categories WHERE id = $1`,
          [category_id]
        )
        if (!cat) {
          return NextResponse.json(
            { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid category_id' } },
            { status: 400 }
          )
        }
        category_name = cat.name
      } else {
        category_name = null
      }
    }

    // Build dynamic UPDATE
    const setClauses: string[] = []
    const values: unknown[] = []
    let paramIdx = 1

    if (inn_name !== undefined) {
      setClauses.push(`inn_name = $${paramIdx++}`)
      values.push(inn_name.trim())
    }
    if (category_id !== undefined) {
      setClauses.push(`category_id = $${paramIdx++}`)
      values.push(category_id || null)
    }
    if (category_name !== undefined) {
      setClauses.push(`category_name = $${paramIdx++}`)
      values.push(category_name)
    }
    if (description !== undefined) {
      setClauses.push(`description = $${paramIdx++}`)
      values.push(description)
    }
    if (common_strengths !== undefined) {
      setClauses.push(`common_strengths = $${paramIdx++}`)
      values.push(common_strengths)
    }
    if (common_dosage_forms !== undefined) {
      setClauses.push(`common_dosage_forms = $${paramIdx++}`)
      values.push(common_dosage_forms)
    }
    if (pharmacopoeia !== undefined) {
      setClauses.push(`pharmacopoeia = $${paramIdx++}`)
      values.push(pharmacopoeia)
    }
    if (common_storage !== undefined) {
      setClauses.push(`common_storage = $${paramIdx++}`)
      values.push(common_storage)
    }
    if (active !== undefined) {
      setClauses.push(`active = $${paramIdx++}`)
      values.push(active)
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } },
        { status: 400 }
      )
    }

    setClauses.push(`updated_at = NOW()`)
    values.push(id)

    const result = await queryOne(
      `UPDATE drug_dictionary SET ${setClauses.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      values
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Drug dictionary update error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

// DELETE: Deactivate drug (PMX_ADMIN only, soft-delete)
export async function DELETE(
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

    if (user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'PMX Admin access required' } },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verify drug exists
    const existing = await queryOne<{ id: string; inn_name: string }>(
      `SELECT id, inn_name FROM drug_dictionary WHERE id = $1`,
      [id]
    )
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Drug not found' } },
        { status: 404 }
      )
    }

    // Check if any products reference this drug's INN
    const productRef = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM products WHERE LOWER(inn_name) = LOWER($1) AND status = 'ACTIVE'`,
      [existing.inn_name]
    )
    const refCount = parseInt(productRef?.count || '0', 10)

    if (refCount > 0) {
      // Soft-delete: deactivate instead of deleting
      await query(
        `UPDATE drug_dictionary SET active = FALSE, updated_at = NOW() WHERE id = $1`,
        [id]
      )
      return NextResponse.json({
        success: true,
        data: {
          deactivated: true,
          message: `Drug deactivated (${refCount} active product(s) reference this INN)`,
        },
      })
    }

    // No references - still soft-delete for safety
    await query(
      `UPDATE drug_dictionary SET active = FALSE, updated_at = NOW() WHERE id = $1`,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: { deactivated: true, message: 'Drug deactivated successfully' },
    })
  } catch (error) {
    console.error('Drug dictionary delete error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
