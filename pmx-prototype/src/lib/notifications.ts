import { query, queryOne } from './db'

export type NotificationType =
  | 'KYB_GATE_APPROVED' | 'KYB_GATE_REJECTED' | 'RFQ_MATCH_FOUND' | 'RFQ_RESPONSE_RECEIVED'
  | 'NEGOTIATION_MESSAGE' | 'CONTRACT_GENERATED' | 'CONTRACT_SIGNED' | 'ESCROW_FUNDED'
  | 'BATCH_LINKED' | 'BATCH_RELEASED' | 'ORDER_DISPATCHED' | 'ORDER_DELIVERED' | 'ORDER_COMPLETED'
  | 'DISPUTE_RAISED' | 'DISPUTE_RESOLVED' | 'CQS_WARNING' | 'ACCOUNT_SUSPENDED' | 'RATING_REQUESTED'
  | 'DEVIATION_FILED'

export async function createNotification(
  userId: string,
  type: NotificationType,
  params: {
    title: string
    body: string
    link?: string
    relatedEntityType?: string
    relatedEntityId?: string
  }
) {
  try {
    // Verify user exists before creating notification
    const user = await queryOne(`SELECT id FROM users WHERE id = $1`, [userId])
    if (!user) {
      console.warn(`[NOTIFICATION SKIPPED] User ${userId} not found for ${type}: ${params.title}`)
      return
    }

    await query(
      `INSERT INTO notifications (user_id, type, title, body, link, related_entity_type, related_entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId, type, params.title, params.body,
        params.link ?? null,
        params.relatedEntityType ?? null,
        params.relatedEntityId ?? null,
      ]
    )
    console.log(`[NOTIFICATION -> ${type}] ${params.title}: ${params.body}`)
  } catch (error) {
    // Log but don't throw -- notification failure should not break the calling operation
    console.error(`[NOTIFICATION ERROR] Failed to create ${type} for user ${userId}:`, error)
  }
}
