import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const cursor = searchParams.get('cursor')

    // Check if admin wants to see all statuses
    const user = await getAuthUser(request)
    const isAdmin = user?.role === 'PMX_ADMIN'

    let sql = `SELECT id, slug, title, meta_title, meta_description, status, author_id, published_at, created_at, updated_at FROM cms_pages WHERE 1=1`
    const params: unknown[] = []
    let paramIdx = 1

    if (!isAdmin) {
      sql += ` AND status = 'PUBLISHED'`
    } else if (status) {
      sql += ` AND status = $${paramIdx++}`
      params.push(status)
    }

    if (cursor) {
      sql += ` AND created_at < $${paramIdx++}`
      params.push(cursor)
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIdx}`
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
    console.error('List CMS pages error:', error)
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
    const { slug, title, content, meta_title, meta_description, og_image, status } = body

    if (!slug || !title) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'slug and title are required' } },
        { status: 400 }
      )
    }

    const publishedAt = status === 'PUBLISHED' ? 'NOW()' : 'NULL'

    const result = await query(
      `INSERT INTO cms_pages (slug, title, content, meta_title, meta_description, og_image, status, author_id, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ${publishedAt})
       RETURNING *`,
      [slug, title, content || '', meta_title || null, meta_description || null, og_image || null, status || 'DRAFT', user.id]
    )

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Create CMS page error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
