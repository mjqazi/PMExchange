import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parent_id')
    const includeInactive = searchParams.get('include_inactive')

    const user = await getAuthUser(request)
    const isAdmin = user?.role === 'PMX_ADMIN'

    let sql = `SELECT * FROM cms_product_categories WHERE 1=1`
    const params: unknown[] = []
    let paramIdx = 1

    if (!isAdmin && includeInactive !== 'true') {
      sql += ` AND active = TRUE`
    }

    if (parentId) {
      sql += ` AND parent_id = $${paramIdx++}`
      params.push(parentId)
    } else if (!searchParams.has('parent_id')) {
      // By default, return top-level categories (no parent)
      sql += ` AND parent_id IS NULL`
    }

    sql += ` ORDER BY sort_order ASC, name ASC`

    const result = await query(sql, params)

    return NextResponse.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('List CMS categories error:', error)
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
    const { slug, name, description, icon, image, parent_id, sort_order, active } = body

    if (!slug || !name) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'slug and name are required' } },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO cms_product_categories (slug, name, description, icon, image, parent_id, sort_order, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [slug, name, description || null, icon || null, image || null, parent_id || null, sort_order || 0, active !== false]
    )

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Create CMS category error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
