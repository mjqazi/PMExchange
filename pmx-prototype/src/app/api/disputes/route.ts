import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { order_id, description, evidence_notes } = body

    if (!order_id || !description) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'order_id and description are required' } },
        { status: 400 }
      )
    }

    const order = await queryOne<any>(`SELECT * FROM orders WHERE id = $1`, [order_id])
    if (!order) {
      return NextResponse.json(
        { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } },
        { status: 404 }
      )
    }

    // Verify user is party to the order
    const isBuyer = user.buyer_id === order.buyer_id
    const isSeller = user.manufacturer_id === order.seller_id
    if (!isBuyer && !isSeller && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only order parties can raise disputes' } },
        { status: 403 }
      )
    }

    // Check if open dispute already exists
    const existing = await queryOne(
      `SELECT id FROM disputes WHERE order_id = $1 AND status = 'OPEN'`,
      [order_id]
    )
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DISPUTE_EXISTS', message: 'An open dispute already exists for this order' } },
        { status: 409 }
      )
    }

    const raisedByRole = isBuyer ? 'BUYER' : 'SELLER'

    const result = await query(
      `INSERT INTO disputes (order_id, raised_by_user, raised_by_role, description, evidence_notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [order_id, user.id, raisedByRole, description, evidence_notes || null]
    )

    // Pause escrow auto-release by marking escrow as DISPUTED
    if (order.escrow_status === 'FUNDED') {
      await query(
        `UPDATE orders SET escrow_status = 'DISPUTED', updated_at = NOW() WHERE id = $1`,
        [order_id]
      )
      await query(
        `UPDATE escrow_accounts SET status = 'DISPUTED' WHERE order_id = $1`,
        [order_id]
      )
    }

    // Notify PMX admins and the other party
    const admins = await query(`SELECT id FROM users WHERE role = 'PMX_ADMIN' AND status = 'ACTIVE'`)
    const otherPartyUsers = isBuyer
      ? await query(`SELECT id FROM users WHERE manufacturer_id = $1`, [order.seller_id])
      : await query(`SELECT id FROM users WHERE buyer_id = $1`, [order.buyer_id])

    const allNotify = [...admins.rows, ...otherPartyUsers.rows]
    for (const u of allNotify) {
      await createNotification(u.id, 'DISPUTE_RAISED', {
        title: 'Dispute raised',
        body: `A dispute has been raised on order ${order_id.substring(0, 8)} by ${raisedByRole.toLowerCase()}: ${description.substring(0, 100)}`,
        link: `/admin/disputes`,
        relatedEntityType: 'dispute',
        relatedEntityId: result.rows[0].id,
      })
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    }, { status: 201 })
  } catch (error) {
    console.error('Dispute creation error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
