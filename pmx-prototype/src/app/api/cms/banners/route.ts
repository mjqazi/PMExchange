import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const placement = searchParams.get('placement')

    const user = await getAuthUser(request)
    const isAdmin = user?.role === 'PMX_ADMIN'

    let sql = `SELECT * FROM cms_banners WHERE 1=1`
    const params: unknown[] = []
    let paramIdx = 1

    if (!isAdmin) {
      sql += ` AND active = TRUE AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW())`
    }

    if (placement) {
      sql += ` AND placement = $${paramIdx++}`
      params.push(placement)
    }

    sql += ` ORDER BY sort_order ASC, created_at DESC`

    const result = await query(sql, params)

    return NextResponse.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('List CMS banners error:', error)
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
    const { placement, title, subtitle, cta_text, cta_link, bg_image, bg_color, text_color, sort_order, active, starts_at, ends_at } = body

    if (!placement || !title) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'placement and title are required' } },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO cms_banners (placement, title, subtitle, cta_text, cta_link, bg_image, bg_color, text_color, sort_order, active, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        placement, title, subtitle || null, cta_text || null, cta_link || null,
        bg_image || null, bg_color || null, text_color || '#FFFFFF',
        sort_order || 0, active !== false, starts_at || null, ends_at || null,
      ]
    )

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Create CMS banner error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
