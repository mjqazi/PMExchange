import { query } from './db'
import { createNotification } from './notifications'

export async function checkOrderTimeouts() {
  const results = { archived: [] as string[], cancelled: [] as string[], autoReleased: [] as string[] }

  // NEGOTIATING -> auto-archive after 14 days inactivity
  const staleNeg = await query(
    `UPDATE orders SET status = 'RFQ_POSTED', updated_at = NOW()
     WHERE status = 'NEGOTIATING' AND updated_at < NOW() - INTERVAL '14 days'
     RETURNING id`
  )
  results.archived.push(...staleNeg.rows.map((r) => r.id))

  // CONTRACT_GENERATED -> revert to NEGOTIATING after 5 days if not both signed
  const unsignedContracts = await query(
    `UPDATE orders SET status = 'NEGOTIATING', updated_at = NOW()
     WHERE status = 'CONTRACT_GENERATED'
     AND (contract_signed_buyer_at IS NULL OR contract_signed_seller_at IS NULL)
     AND updated_at < NOW() - INTERVAL '5 days'
     RETURNING id`
  )
  results.cancelled.push(...unsignedContracts.rows.map((r) => r.id))

  // ESCROW: cancel if contract signed but escrow not funded within 7 days
  const unfundedEscrow = await query(
    `UPDATE orders SET status = 'NEGOTIATING', escrow_status = 'PENDING', updated_at = NOW()
     WHERE status = 'CONTRACT_GENERATED'
     AND contract_signed_buyer_at IS NOT NULL AND contract_signed_seller_at IS NOT NULL
     AND escrow_status = 'PENDING'
     AND contract_signed_seller_at < NOW() - INTERVAL '7 days'
     RETURNING id`
  )
  results.cancelled.push(...unfundedEscrow.rows.map((r) => r.id))

  // DELIVERED -> auto-release escrow after 3 days if no open dispute
  const autoRelease = await query(
    `SELECT o.id, o.buyer_id, o.seller_id FROM orders o
     WHERE o.status = 'DELIVERED' AND o.escrow_status = 'FUNDED'
     AND o.delivered_at < NOW() - INTERVAL '3 days'
     AND NOT EXISTS (SELECT 1 FROM disputes d WHERE d.order_id = o.id AND d.status = 'OPEN')`
  )

  for (const order of autoRelease.rows) {
    await query(
      `UPDATE orders SET status = 'COMPLETED', escrow_status = 'RELEASED',
        completed_at = NOW(), ratings_deadline_at = NOW() + INTERVAL '5 days', updated_at = NOW()
       WHERE id = $1`,
      [order.id]
    )

    // Update escrow account
    await query(
      `UPDATE escrow_accounts SET status = 'RELEASED', released_at = NOW(), release_trigger = 'AUTO_3DAY'
       WHERE order_id = $1`,
      [order.id]
    )

    // Notify both parties
    const buyerUsers = await query(`SELECT id FROM users WHERE buyer_id = $1`, [order.buyer_id])
    const sellerUsers = await query(`SELECT id FROM users WHERE manufacturer_id = $1`, [order.seller_id])
    const allUsers = [...buyerUsers.rows, ...sellerUsers.rows]
    for (const u of allUsers) {
      await createNotification(u.id, 'ORDER_COMPLETED', {
        title: 'Order completed - escrow released',
        body: `Order auto-completed after 3-day delivery window. Please submit ratings within 5 days.`,
        link: `/orders/${order.id}`,
        relatedEntityType: 'order',
        relatedEntityId: order.id,
      })
    }

    results.autoReleased.push(order.id)
  }

  return results
}
