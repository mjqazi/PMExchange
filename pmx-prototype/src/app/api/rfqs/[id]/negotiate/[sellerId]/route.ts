import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sellerId: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { id, sellerId } = await params

    // Verify RFQ exists
    const rfq = await queryOne<any>(`SELECT * FROM rfqs WHERE id = $1`, [id])
    if (!rfq) {
      return NextResponse.json(
        { success: false, error: { code: 'RFQ_NOT_FOUND', message: 'RFQ not found' } },
        { status: 404 }
      )
    }

    // Only the RFQ buyer can open negotiations
    if (user.buyer_id !== rfq.buyer_id && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only the RFQ buyer can open negotiations' } },
        { status: 403 }
      )
    }

    // Verify seller response exists
    const response = await queryOne<any>(
      `SELECT * FROM rfq_responses WHERE rfq_id = $1 AND manufacturer_id = $2`,
      [id, sellerId]
    )
    if (!response) {
      return NextResponse.json(
        { success: false, error: { code: 'RESPONSE_NOT_FOUND', message: 'No response found from this seller' } },
        { status: 404 }
      )
    }

    // Check if order already exists for this rfq+seller combo
    const existingOrder = await queryOne(
      `SELECT id FROM orders WHERE rfq_id = $1 AND seller_id = $2`,
      [id, sellerId]
    )
    if (existingOrder) {
      return NextResponse.json(
        { success: false, error: { code: 'NEGOTIATION_EXISTS', message: 'A negotiation already exists with this seller' } },
        { status: 409 }
      )
    }

    // Get the body for initial message
    const body = await request.json().catch(() => ({}))

    // Create order in NEGOTIATING status
    const order = await query(
      `INSERT INTO orders (rfq_id, buyer_id, seller_id, product_id, quantity, agreed_price_usd, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'NEGOTIATING')
       RETURNING *`,
      [id, rfq.buyer_id, sellerId, response.product_id, rfq.volume_qty, response.price_per_unit_usd]
    )

    const orderId = order.rows[0].id

    // Update response status to SHORTLISTED
    await query(
      `UPDATE rfq_responses SET status = 'SHORTLISTED' WHERE rfq_id = $1 AND manufacturer_id = $2`,
      [id, sellerId]
    )

    // Create initial system message in the thread
    await query(
      `INSERT INTO messages (order_id, rfq_id, sender_id, sender_role, message_type, content)
       VALUES ($1, $2, $3, $4, 'SYSTEM', $5)`,
      [orderId, id, user.id, user.role, `Negotiation opened by buyer. Initial quote: $${response.price_per_unit_usd}/unit, ${response.lead_time_days} days lead time.`]
    )

    // If buyer included an initial message
    if (body.message) {
      await query(
        `INSERT INTO messages (order_id, rfq_id, sender_id, sender_role, message_type, content)
         VALUES ($1, $2, $3, $4, 'MESSAGE', $5)`,
        [orderId, id, user.id, user.role, body.message]
      )
    }

    // Notify seller
    const sellerUsers = await query(
      `SELECT id FROM users WHERE manufacturer_id = $1 AND role IN ('SELLER_ADMIN', 'SELLER_QA')`,
      [sellerId]
    )
    for (const su of sellerUsers.rows) {
      await createNotification(su.id, 'NEGOTIATION_MESSAGE', {
        title: 'New negotiation started',
        body: `A buyer has opened negotiations for ${rfq.product_inn} ${rfq.product_strength}.`,
        link: `/seller/orders/${orderId}`,
        relatedEntityType: 'order',
        relatedEntityId: orderId,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        order: order.rows[0],
        message: 'Negotiation opened successfully',
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Negotiate error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
