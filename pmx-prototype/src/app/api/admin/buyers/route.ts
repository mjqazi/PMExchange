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

    if (user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'PMX Admin access required' } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    let sql = `SELECT b.*,
                      (SELECT COUNT(*) FROM orders WHERE buyer_id = b.id) as total_orders,
                      (SELECT COUNT(*) FROM rfqs WHERE buyer_id = b.id) as total_rfqs
               FROM buyers b WHERE 1=1`
    const params: any[] = []
    let paramIdx = 1

    if (status) {
      sql += ` AND b.verification_status = $${paramIdx++}`
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
    console.error('List buyers error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
