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

    const { id } = await params

    const order = await queryOne<any>(`SELECT * FROM orders WHERE id = $1`, [id])
    if (!order) {
      return NextResponse.json(
        { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } },
        { status: 404 }
      )
    }

    if (order.status !== 'NEGOTIATING') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_NEGOTIATING', message: 'Order is not in negotiation phase' } },
        { status: 400 }
      )
    }

    // Access control
    const isBuyer = user.buyer_id === order.buyer_id
    const isSeller = user.manufacturer_id === order.seller_id
    if (!isBuyer && !isSeller && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    // Accept both snake_case API names and camelCase/short frontend form names
    const price_per_unit_usd = body.price_per_unit_usd || body.price
    const quantity = body.quantity || body.qty
    const lead_time_days = body.lead_time_days || body.leadTime
    const incoterms = body.incoterms
    const content = body.content

    if (!price_per_unit_usd) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'price_per_unit_usd is required' } },
        { status: 400 }
      )
    }

    // Get current offer version
    const lastOffer = await queryOne<any>(
      `SELECT offer_version FROM messages WHERE order_id = $1 AND message_type IN ('OFFER', 'COUNTER_OFFER') ORDER BY offer_version DESC LIMIT 1`,
      [id]
    )
    const newVersion = (lastOffer?.offer_version || 0) + 1

    // Mark all previous offers as not current
    await query(
      `UPDATE messages SET is_current_offer = FALSE WHERE order_id = $1 AND is_current_offer = TRUE`,
      [id]
    )

    // Determine message type
    const messageType = newVersion === 1 ? 'OFFER' : 'COUNTER_OFFER'

    // Create the offer message
    const result = await query(
      `INSERT INTO messages (order_id, rfq_id, sender_id, sender_role, message_type, content,
        offer_price_usd, offer_qty, offer_lead_days, offer_incoterms, offer_version, is_current_offer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
       RETURNING *`,
      [
        id,
        order.rfq_id,
        user.id,
        user.role,
        messageType,
        content || `${messageType === 'OFFER' ? 'Initial offer' : 'Counter-offer'}: $${price_per_unit_usd}/unit`,
        price_per_unit_usd,
        quantity || order.quantity,
        lead_time_days || null,
        incoterms || null,
        newVersion,
      ]
    )

    // Update order with latest terms
    await query(
      `UPDATE orders SET agreed_price_usd = $1, quantity = COALESCE($2, quantity), updated_at = NOW() WHERE id = $3`,
      [price_per_unit_usd, quantity || null, id]
    )

    // Notify the other party
    const otherPartyUsers = isBuyer
      ? await query(`SELECT id FROM users WHERE manufacturer_id = $1 AND role IN ('SELLER_ADMIN', 'SELLER_QA')`, [order.seller_id])
      : await query(`SELECT id FROM users WHERE buyer_id = $1`, [order.buyer_id])

    for (const u of otherPartyUsers.rows) {
      await createNotification(u.id, 'NEGOTIATION_MESSAGE', {
        title: `New ${messageType === 'OFFER' ? 'offer' : 'counter-offer'} received`,
        body: `$${price_per_unit_usd}/unit, ${quantity || order.quantity} units${lead_time_days ? `, ${lead_time_days} day lead time` : ''}`,
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
    console.error('Offer error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
