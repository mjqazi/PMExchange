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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

    // Top search queries in the given period
    const result = await query(
      `SELECT query, COUNT(*) as search_count, AVG(results_count)::INTEGER as avg_results,
              MAX(created_at) as last_searched
       FROM cms_search_log
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY query
       ORDER BY search_count DESC
       LIMIT $2`,
      [days, limit]
    )

    // Total searches in period
    const totalResult = await query(
      `SELECT COUNT(*) as total, COUNT(DISTINCT user_id) as unique_users
       FROM cms_search_log
       WHERE created_at >= NOW() - INTERVAL '1 day' * $1`,
      [days]
    )

    return NextResponse.json({
      success: true,
      data: {
        top_queries: result.rows,
        summary: totalResult.rows[0],
        period_days: days,
      },
    })
  } catch (error) {
    console.error('Search analytics error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query: searchQuery, results_count } = body

    if (!searchQuery) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'query is required' } },
        { status: 400 }
      )
    }

    const user = await getAuthUser(request)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null

    await query(
      `INSERT INTO cms_search_log (query, results_count, user_id, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [searchQuery.substring(0, 255), results_count || 0, user?.id || null, ip]
    )

    return NextResponse.json({ success: true, data: { logged: true } }, { status: 201 })
  } catch (error) {
    console.error('Log search error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
