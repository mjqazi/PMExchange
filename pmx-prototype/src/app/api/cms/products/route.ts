import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
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
    const search = searchParams.get('search')
    const manufacturerId = searchParams.get('manufacturer_id')
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const cursor = searchParams.get('cursor')

    let sql = `SELECT p.*, m.company_name as manufacturer_name
               FROM products p
               JOIN manufacturers m ON p.manufacturer_id = m.id
               WHERE 1=1`
    const params: unknown[] = []
    let paramIdx = 1

    if (search) {
      sql += ` AND (p.brand_name ILIKE $${paramIdx} OR p.inn ILIKE $${paramIdx})`
      params.push(`%${search}%`)
      paramIdx++
    }

    if (manufacturerId) {
      sql += ` AND p.manufacturer_id = $${paramIdx++}`
      params.push(manufacturerId)
    }

    if (status) {
      sql += ` AND p.status = $${paramIdx++}`
      params.push(status)
    }

    if (cursor) {
      sql += ` AND p.created_at < $${paramIdx++}`
      params.push(cursor)
    }

    sql += ` ORDER BY p.created_at DESC LIMIT $${paramIdx}`
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
    console.error('List CMS products error:', error)
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
    const {
      manufacturer_id, brand_name, inn, strength, dosage_form, pack_size,
      shelf_life_months, storage_conditions, who_gmp_certified, drap_registered,
      status, price_per_unit_usd,
    } = body

    if (!manufacturer_id || !brand_name || !inn || !strength || !dosage_form) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'manufacturer_id, brand_name, inn, strength, and dosage_form are required' } },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO products (manufacturer_id, brand_name, inn, strength, dosage_form, pack_size,
        shelf_life_months, storage_conditions, who_gmp_certified, drap_registered, status, price_per_unit_usd)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        manufacturer_id, brand_name, inn, strength, dosage_form, pack_size || null,
        shelf_life_months || null, storage_conditions || null,
        who_gmp_certified || false, drap_registered || false,
        status || 'ACTIVE', price_per_unit_usd || null,
      ]
    )

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Create CMS product error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
