import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
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

    let sql = `SELECT o.*,
                      b.company_name as buyer_name, b.country_code as buyer_country,
                      m.company_name as seller_name,
                      p.inn_name as product_inn, p.strength, p.dosage_form
               FROM orders o
               JOIN buyers b ON o.buyer_id = b.id
               JOIN manufacturers m ON o.seller_id = m.id
               LEFT JOIN products p ON o.product_id = p.id
               WHERE 1=1`
    const params: any[] = []
    let paramIdx = 1

    // Filter by role
    if (user.buyer_id) {
      sql += ` AND o.buyer_id = $${paramIdx++}`
      params.push(user.buyer_id)
    } else if (user.manufacturer_id) {
      sql += ` AND o.seller_id = $${paramIdx++}`
      params.push(user.manufacturer_id)
    }

    if (status) {
      sql += ` AND o.status = $${paramIdx++}`
      params.push(status)
    }
    if (cursor) {
      sql += ` AND o.created_at < $${paramIdx++}`
      params.push(cursor)
    }

    sql += ` ORDER BY o.created_at DESC LIMIT $${paramIdx}`
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
    console.error('List orders error:', error)
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

    // Only buyers or admins can create orders
    if (!user.buyer_id && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only buyers or admins can create orders' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { rfq_id, seller_id, product_id, quantity, agreed_price_usd } = body

    if (!seller_id || !quantity) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'seller_id and quantity are required' } },
        { status: 400 }
      )
    }

    // If buyer, use their buyer_id; admins must provide it
    let buyerId = body.buyer_id
    if (user.buyer_id) {
      buyerId = user.buyer_id
    }

    if (!buyerId) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_BUYER', message: 'buyer_id is required' } },
        { status: 400 }
      )
    }

    const order = await query(
      `INSERT INTO orders (rfq_id, buyer_id, seller_id, product_id, quantity, agreed_price_usd, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'NEGOTIATING')
       RETURNING *`,
      [rfq_id || null, buyerId, seller_id, product_id || null, quantity, agreed_price_usd || null]
    )

    return NextResponse.json({
      success: true,
      data: order.rows[0],
    }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
