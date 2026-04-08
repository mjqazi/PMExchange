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

    let sql = `SELECT * FROM cms_pages WHERE slug = $1`
    if (!isAdmin) {
      sql += ` AND status = 'PUBLISHED'`
    }

    const page = await queryOne(sql, [slug])
    if (!page) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: page })
  } catch (error) {
    console.error('Get CMS page error:', error)
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
    const { title, content, meta_title, meta_description, og_image, status } = body

    // Build dynamic update
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title) }
    if (content !== undefined) { fields.push(`content = $${idx++}`); values.push(content) }
    if (meta_title !== undefined) { fields.push(`meta_title = $${idx++}`); values.push(meta_title) }
    if (meta_description !== undefined) { fields.push(`meta_description = $${idx++}`); values.push(meta_description) }
    if (og_image !== undefined) { fields.push(`og_image = $${idx++}`); values.push(og_image) }
    if (status !== undefined) {
      fields.push(`status = $${idx++}`)
      values.push(status)
      if (status === 'PUBLISHED') {
        fields.push(`published_at = COALESCE(published_at, NOW())`)
      }
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
      `UPDATE cms_pages SET ${fields.join(', ')} WHERE slug = $${idx} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Update CMS page error:', error)
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
    const result = await query(`DELETE FROM cms_pages WHERE slug = $1 RETURNING id`, [slug])

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Page not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('Delete CMS page error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
