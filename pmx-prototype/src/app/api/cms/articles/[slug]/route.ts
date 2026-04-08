import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const user = await getAuthUser(request)
    const isAdmin = user?.role === 'PMX_ADMIN'

    let sql = `SELECT * FROM cms_articles WHERE slug = $1`
    if (!isAdmin) {
      sql += ` AND status = 'PUBLISHED'`
    }

    const article = await queryOne(sql, [slug])
    if (!article) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } },
        { status: 404 }
      )
    }

    // Increment view count for published articles
    if (!isAdmin) {
      await query(`UPDATE cms_articles SET view_count = view_count + 1 WHERE slug = $1`, [slug])
    }

    return NextResponse.json({ success: true, data: article })
  } catch (error) {
    console.error('Get CMS article error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

    const { slug } = await params
    const body = await request.json()
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    const allowedFields = ['title', 'excerpt', 'content', 'cover_image', 'category', 'tags', 'author_name', 'status', 'featured']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = $${idx++}`)
        values.push(body[field])
      }
    }

    if (body.status === 'PUBLISHED') {
      fields.push(`published_at = COALESCE(published_at, NOW())`)
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_FIELDS', message: 'No fields to update' } },
        { status: 400 }
      )
    }

    fields.push('updated_at = NOW()')
    values.push(slug)

    const result = await query(
      `UPDATE cms_articles SET ${fields.join(', ')} WHERE slug = $${idx} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Update CMS article error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
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

    const { slug } = await params
    const result = await query(`DELETE FROM cms_articles WHERE slug = $1 RETURNING id`, [slug])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Article not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('Delete CMS article error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
