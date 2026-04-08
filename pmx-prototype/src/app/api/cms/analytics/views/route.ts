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
    const days = parseInt(searchParams.get('days') || '30')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const productId = searchParams.get('product_id')
    const manufacturerId = searchParams.get('manufacturer_id')

    if (productId) {
      // Views for a specific product over time
      const result = await query(
        `SELECT DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT user_id) as unique_viewers
         FROM cms_product_views
         WHERE product_id = $1 AND created_at >= NOW() - INTERVAL '1 day' * $2
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [productId, days]
      )

      return NextResponse.json({ success: true, data: { daily_views: result.rows, product_id: productId, period_days: days } })
    }

    if (manufacturerId) {
      // Views for all products of a manufacturer
      const result = await query(
        `SELECT v.product_id, p.brand_name, COUNT(*) as views
         FROM cms_product_views v
         JOIN products p ON v.product_id = p.id
         WHERE v.manufacturer_id = $1 AND v.created_at >= NOW() - INTERVAL '1 day' * $2
         GROUP BY v.product_id, p.brand_name
         ORDER BY views DESC
         LIMIT $3`,
        [manufacturerId, days, limit]
      )

      return NextResponse.json({ success: true, data: { product_views: result.rows, manufacturer_id: manufacturerId, period_days: days } })
    }

    // Top viewed products overall
    const result = await query(
      `SELECT v.product_id, p.brand_name, p.inn, m.company_name as manufacturer,
              COUNT(*) as views, COUNT(DISTINCT v.user_id) as unique_viewers
       FROM cms_product_views v
       JOIN products p ON v.product_id = p.id
       JOIN manufacturers m ON p.manufacturer_id = m.id
       WHERE v.created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY v.product_id, p.brand_name, p.inn, m.company_name
       ORDER BY views DESC
       LIMIT $2`,
      [days, limit]
    )

    // Total views summary
    const totalResult = await query(
      `SELECT COUNT(*) as total_views, COUNT(DISTINCT product_id) as products_viewed, COUNT(DISTINCT user_id) as unique_viewers
       FROM cms_product_views
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1`,
      [days]
    )

    return NextResponse.json({
      success: true,
      data: {
        top_products: result.rows,
        summary: totalResult.rows[0],
        period_days: days,
      },
    })
  } catch (error) {
    console.error('View analytics error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, manufacturer_id, referrer } = body

    if (!product_id) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'product_id is required' } },
        { status: 400 }
      )
    }

    const user = await getAuthUser(request)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null

    await query(
      `INSERT INTO cms_product_views (product_id, manufacturer_id, user_id, ip_address, referrer)
       VALUES ($1, $2, $3, $4, $5)`,
      [product_id, manufacturer_id || null, user?.id || null, ip, referrer || null]
    )

    return NextResponse.json({ success: true, data: { logged: true } }, { status: 201 })
  } catch (error) {
    console.error('Log product view error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
