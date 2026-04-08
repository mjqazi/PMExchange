import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import { VALID_TRANSITIONS } from '@/lib/types'
import type { OrderStatus } from '@/lib/types'

export async function PUT(
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
    const body = await request.json()
    const { new_status, tracking_ref, batch_id } = body

    if (!new_status) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_STATUS', message: 'new_status is required' } },
        { status: 400 }
      )
    }

    // Whitelist validation to prevent SQL injection via status value
    const ALL_STATUSES: OrderStatus[] = [
      'RFQ_POSTED', 'RESPONSES_RECEIVED', 'NEGOTIATING', 'CONTRACT_GENERATED',
      'ESCROW_FUNDED', 'IN_PRODUCTION', 'DISPATCHED', 'DELIVERED', 'COMPLETED',
    ]
    if (!ALL_STATUSES.includes(new_status as OrderStatus)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: `Invalid status value: ${new_status}` } },
        { status: 400 }
      )
    }

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

    // Validate transition
    const currentStatus = order.status as OrderStatus
    const allowedNext = VALID_TRANSITIONS[currentStatus] || []

    if (!allowedNext.includes(new_status as OrderStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TRANSITION',
            message: `Cannot transition from ${currentStatus} to ${new_status}. Allowed: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'none'}`,
          },
        },
        { status: 400 }
      )
    }

    // Execute transition-specific actions
    // Use parameterized query for status to prevent SQL injection
    const updates: string[] = [`status = $1`, `updated_at = NOW()`]
    const updateParams: any[] = [new_status]
    let paramIdx = 2

    switch (new_status) {
      case 'CONTRACT_GENERATED':
        updates.push(`contract_ref = 'PMX-CONTRACT-' || LEFT(id::text, 8)`)
        break

      case 'ESCROW_FUNDED':
        updates.push(`escrow_status = 'FUNDED'`, `escrow_funded_at = NOW()`)
        // Create escrow account
        const commission = parseFloat(order.agreed_price_usd || 0) * order.quantity * 0.02
        const totalAmount = parseFloat(order.agreed_price_usd || 0) * order.quantity
        await query(
          `INSERT INTO escrow_accounts (order_id, pso_account_ref, amount_usd, funded_at, status)
           VALUES ($1, $2, $3, NOW(), 'FUNDED')
           ON CONFLICT (pso_account_ref) DO NOTHING`,
          [id, `PSO-ESC-${id.substring(0, 8)}`, totalAmount]
        )
        updates.push(`pmx_commission_usd = $${paramIdx++}`)
        updateParams.push(commission)
        break

      case 'IN_PRODUCTION':
        if (batch_id) {
          updates.push(`batch_id = $${paramIdx++}`)
          updateParams.push(batch_id)
          // Link batch to order
          await query(`UPDATE batches SET order_id = $1 WHERE id = $2`, [id, batch_id])
        }
        break

      case 'DISPATCHED':
        updates.push(`dispatched_at = NOW()`)
        if (tracking_ref) {
          updates.push(`tracking_ref = $${paramIdx++}`)
          updateParams.push(tracking_ref)
        }
        break

      case 'DELIVERED':
        updates.push(`delivered_at = NOW()`)
        break

      case 'COMPLETED':
        updates.push(`completed_at = NOW()`, `escrow_status = 'RELEASED'`, `ratings_deadline_at = NOW() + INTERVAL '5 days'`)
        // Release escrow
        await query(
          `UPDATE escrow_accounts SET status = 'RELEASED', released_at = NOW(), release_trigger = 'BUYER_CONFIRM' WHERE order_id = $1`,
          [id]
        )
        break
    }

    updateParams.push(id)
    await query(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
      updateParams
    )

    // Notify parties
    const buyerUsers = await query(`SELECT id FROM users WHERE buyer_id = $1`, [order.buyer_id])
    const sellerUsers = await query(`SELECT id FROM users WHERE manufacturer_id = $1`, [order.seller_id])

    const notificationMap: Record<string, { type: any; title: string; body: string }> = {
      CONTRACT_GENERATED: { type: 'CONTRACT_GENERATED', title: 'Contract generated', body: 'PMX Supply Agreement has been generated. Please review and sign.' },
      ESCROW_FUNDED: { type: 'ESCROW_FUNDED', title: 'Escrow funded', body: 'PSO escrow has been funded. Production can begin.' },
      DISPATCHED: { type: 'ORDER_DISPATCHED', title: 'Order dispatched', body: `Order has been dispatched.${tracking_ref ? ` Tracking: ${tracking_ref}` : ''}` },
      DELIVERED: { type: 'ORDER_DELIVERED', title: 'Order delivered', body: 'Order has been confirmed as delivered.' },
      COMPLETED: { type: 'ORDER_COMPLETED', title: 'Order completed', body: 'Order completed. Escrow released. Please submit ratings within 5 days.' },
    }

    const notif = notificationMap[new_status]
    if (notif) {
      const allUsers = [...buyerUsers.rows, ...sellerUsers.rows]
      for (const u of allUsers) {
        await createNotification(u.id, notif.type, {
          title: notif.title,
          body: notif.body,
          link: `/orders/${id}`,
          relatedEntityType: 'order',
          relatedEntityId: id,
        })
      }
    }

    // Fetch updated order
    const updated = await queryOne(`SELECT * FROM orders WHERE id = $1`, [id])

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Order status update error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
