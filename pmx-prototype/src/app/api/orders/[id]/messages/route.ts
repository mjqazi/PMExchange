import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { id } = await params

    const order = await queryOne<any>(`SELECT buyer_id, seller_id FROM orders WHERE id = $1`, [id])
    if (!order) {
      return NextResponse.json(
        { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } },
        { status: 404 }
      )
    }

    // Access control
    if (user.buyer_id && user.buyer_id !== order.buyer_id && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }
    if (user.manufacturer_id && user.manufacturer_id !== order.seller_id && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    let sql = `SELECT m.*, u.full_name as sender_name
               FROM messages m
               JOIN users u ON m.sender_id = u.id
               WHERE m.order_id = $1`
    const queryParams: any[] = [id]
    let paramIdx = 2

    if (cursor) {
      sql += ` AND m.created_at > $${paramIdx++}`
      queryParams.push(cursor)
    }

    sql += ` ORDER BY m.created_at ASC LIMIT $${paramIdx}`
    queryParams.push(limit + 1)

    const result = await query(sql, queryParams)
    const hasMore = result.rows.length > limit
    const data = hasMore ? result.rows.slice(0, limit) : result.rows

    // Mark messages as read by current user
    await query(
      `UPDATE messages SET read_by_recipient = TRUE, read_at = NOW()
       WHERE order_id = $1 AND sender_id != $2 AND read_by_recipient = FALSE`,
      [id, user.id]
    )

    return NextResponse.json({
      success: true,
      data,
      next_cursor: hasMore ? data[data.length - 1].created_at : null,
      has_more: hasMore,
    })
  } catch (error) {
    console.error('Messages GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { id } = await params

    const order = await queryOne<any>(`SELECT * FROM orders WHERE id = $1`, [id])
    if (!order) {
      return NextResponse.json(
        { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } },
        { status: 404 }
      )
    }

    // Access control
    if (user.buyer_id && user.buyer_id !== order.buyer_id && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }
    if (user.manufacturer_id && user.manufacturer_id !== order.seller_id && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    // Accept both 'content' (API standard) and 'text' (frontend form field)
    const content = body.content || body.text
    const message_type = body.message_type
    const doc_path = body.doc_path
    const doc_name = body.doc_name

    if (!content) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_CONTENT', message: 'Message content is required' } },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO messages (order_id, rfq_id, sender_id, sender_role, message_type, content, doc_path, doc_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        order.rfq_id,
        user.id,
        user.role,
        message_type || 'MESSAGE',
        content,
        doc_path || null,
        doc_name || null,
      ]
    )

    // Update order timestamp
    await query(`UPDATE orders SET updated_at = NOW() WHERE id = $1`, [id])

    // Notify the other party
    const isBuyer = user.buyer_id === order.buyer_id
    const otherPartyUsers = isBuyer
      ? await query(`SELECT id FROM users WHERE manufacturer_id = $1 AND role IN ('SELLER_ADMIN', 'SELLER_QA')`, [order.seller_id])
      : await query(`SELECT id FROM users WHERE buyer_id = $1`, [order.buyer_id])

    for (const u of otherPartyUsers.rows) {
      await createNotification(u.id, 'NEGOTIATION_MESSAGE', {
        title: 'New message',
        body: `${user.full_name} sent a message in order thread.`,
        link: `/orders/${id}`,
        relatedEntityType: 'order',
        relatedEntityId: id,
      })
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    }, { status: 201 })
  } catch (error) {
    console.error('Message create error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
