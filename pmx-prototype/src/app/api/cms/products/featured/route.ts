import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive')

    let sql = `SELECT fp.*, p.brand_name, p.inn, p.strength, p.dosage_form, p.price_per_unit_usd,
                      m.company_name as manufacturer_name
               FROM cms_featured_products fp
               JOIN products p ON fp.product_id = p.id
               JOIN manufacturers m ON p.manufacturer_id = m.id
               WHERE 1=1`

    if (includeInactive !== 'true') {
      sql += ` AND fp.active = TRUE AND (fp.starts_at IS NULL OR fp.starts_at <= NOW()) AND (fp.ends_at IS NULL OR fp.ends_at >= NOW())`
    }

    sql += ` ORDER BY fp.sort_order ASC, fp.created_at DESC`

    const result = await query(sql)

    return NextResponse.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('List featured products error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { product_id, sort_order, active, starts_at, ends_at } = body

    if (!product_id) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'product_id is required' } },
        { status: 400 }
      )
    }

    // Check product exists
    const productCheck = await query(`SELECT id FROM products WHERE id = $1`, [product_id])
    if (productCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      )
    }

    // Check not already featured
    const existing = await query(`SELECT id FROM cms_featured_products WHERE product_id = $1`, [product_id])
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'Product is already featured' } },
        { status: 409 }
      )
    }

    const result = await query(
      `INSERT INTO cms_featured_products (product_id, sort_order, active, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [product_id, sort_order || 0, active !== false, starts_at || null, ends_at || null]
    )

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Create featured product error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const productId = searchParams.get('product_id')

    if (!id && !productId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'id or product_id query param is required' } },
        { status: 400 }
      )
    }

    let result
    if (id) {
      result = await query(`DELETE FROM cms_featured_products WHERE id = $1 RETURNING id`, [id])
    } else {
      result = await query(`DELETE FROM cms_featured_products WHERE product_id = $1 RETURNING id`, [productId])
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Featured product not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('Remove featured product error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
