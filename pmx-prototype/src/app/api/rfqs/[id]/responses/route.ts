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

    if (!user.manufacturer_id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only sellers can submit quotes' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    // Accept both snake_case API names and camelCase/short frontend form names
    const product_id = body.product_id || null
    const price_per_unit_usd = body.price_per_unit_usd || body.price
    const lead_time_days = body.lead_time_days || body.lead_time
    const min_order_qty = body.min_order_qty
    const notes = body.notes

    if (!price_per_unit_usd || !lead_time_days) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'price_per_unit_usd and lead_time_days are required' } },
        { status: 400 }
      )
    }

    // Verify RFQ exists and is published
    const rfq = await queryOne<any>(`SELECT * FROM rfqs WHERE id = $1`, [id])
    if (!rfq) {
      return NextResponse.json(
        { success: false, error: { code: 'RFQ_NOT_FOUND', message: 'RFQ not found' } },
        { status: 404 }
      )
    }

    if (rfq.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: { code: 'RFQ_NOT_OPEN', message: 'This RFQ is not accepting responses' } },
        { status: 400 }
      )
    }

    // Check if already responded
    const existing = await queryOne(
      `SELECT id FROM rfq_responses WHERE rfq_id = $1 AND manufacturer_id = $2`,
      [id, user.manufacturer_id]
    )
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_RESPONDED', message: 'You have already submitted a response to this RFQ' } },
        { status: 409 }
      )
    }

    // Get manufacturer CQS score
    const mfr = await queryOne<any>(
      `SELECT cqs_score FROM manufacturers WHERE id = $1`,
      [user.manufacturer_id]
    )

    const result = await query(
      `INSERT INTO rfq_responses (rfq_id, manufacturer_id, product_id, price_per_unit_usd, lead_time_days, min_order_qty, notes, l1_eligible, cqs_score_at_response, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8, 'PENDING')
       RETURNING *`,
      [
        id,
        user.manufacturer_id,
        product_id || null,
        price_per_unit_usd,
        lead_time_days,
        min_order_qty || null,
        notes || null,
        mfr?.cqs_score || 0,
      ]
    )

    // Update RFQ status to RESPONSES_RECEIVED if first response
    await query(
      `UPDATE rfqs SET status = CASE WHEN status = 'PUBLISHED' THEN 'PUBLISHED' ELSE status END, updated_at = NOW() WHERE id = $1`,
      [id]
    )

    // Notify buyer
    const buyerUsers = await query(
      `SELECT u.id FROM users u WHERE u.buyer_id = $1`,
      [rfq.buyer_id]
    )
    for (const bu of buyerUsers.rows) {
      await createNotification(bu.id, 'RFQ_RESPONSE_RECEIVED', {
        title: 'New quote received',
        body: `A seller has submitted a quote for your RFQ (${rfq.product_inn} ${rfq.product_strength}).`,
        link: `/buyer/rfqs/${id}`,
        relatedEntityType: 'rfq',
        relatedEntityId: id,
      })
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    }, { status: 201 })
  } catch (error) {
    console.error('RFQ response error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
