import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

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

    if (user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'PMX Admin access required' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { resolution_notes, escrow_action } = body

    if (!resolution_notes) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'resolution_notes is required' } },
        { status: 400 }
      )
    }

    const dispute = await queryOne<any>(`SELECT * FROM disputes WHERE id = $1`, [id])
    if (!dispute) {
      return NextResponse.json(
        { success: false, error: { code: 'DISPUTE_NOT_FOUND', message: 'Dispute not found' } },
        { status: 404 }
      )
    }

    if (dispute.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_RESOLVED', message: 'Dispute has already been resolved' } },
        { status: 400 }
      )
    }

    // Resolve the dispute
    await query(
      `UPDATE disputes SET status = 'RESOLVED', resolution_notes = $1, resolved_by = $2, resolved_at = NOW()
       WHERE id = $3`,
      [resolution_notes, user.id, id]
    )

    // Handle escrow based on admin decision
    const order = await queryOne<any>(`SELECT * FROM orders WHERE id = $1`, [dispute.order_id])

    if (escrow_action === 'release_to_seller') {
      await query(
        `UPDATE orders SET escrow_status = 'RELEASED', status = 'COMPLETED', completed_at = NOW(),
          ratings_deadline_at = NOW() + INTERVAL '5 days', updated_at = NOW()
         WHERE id = $1`,
        [dispute.order_id]
      )
      await query(
        `UPDATE escrow_accounts SET status = 'RELEASED', released_at = NOW(), release_trigger = 'ADMIN_DECISION' WHERE order_id = $1`,
        [dispute.order_id]
      )
    } else if (escrow_action === 'refund_to_buyer') {
      await query(
        `UPDATE orders SET escrow_status = 'REFUNDED', updated_at = NOW() WHERE id = $1`,
        [dispute.order_id]
      )
      await query(
        `UPDATE escrow_accounts SET status = 'REFUNDED', released_at = NOW(), release_trigger = 'ADMIN_DECISION' WHERE order_id = $1`,
        [dispute.order_id]
      )
    } else {
      // No escrow action - just resolve dispute and restore funded status
      await query(
        `UPDATE orders SET escrow_status = 'FUNDED', updated_at = NOW() WHERE id = $1`,
        [dispute.order_id]
      )
      await query(
        `UPDATE escrow_accounts SET status = 'FUNDED' WHERE order_id = $1`,
        [dispute.order_id]
      )
    }

    // Notify both parties
    if (order) {
      const buyerUsers = await query(`SELECT id FROM users WHERE buyer_id = $1`, [order.buyer_id])
      const sellerUsers = await query(`SELECT id FROM users WHERE manufacturer_id = $1`, [order.seller_id])
      const allUsers = [...buyerUsers.rows, ...sellerUsers.rows]

      for (const u of allUsers) {
        await createNotification(u.id, 'DISPUTE_RESOLVED', {
          title: 'Dispute resolved',
          body: `Dispute has been resolved by PMX Admin. ${escrow_action === 'release_to_seller' ? 'Escrow released to seller.' : escrow_action === 'refund_to_buyer' ? 'Escrow refunded to buyer.' : ''}`,
          link: `/orders/${dispute.order_id}`,
          relatedEntityType: 'dispute',
          relatedEntityId: id,
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        dispute_id: id,
        status: 'RESOLVED',
        resolution_notes,
        escrow_action: escrow_action || 'none',
        resolved_by: user.full_name,
      },
    })
  } catch (error) {
    console.error('Dispute resolve error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
