import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { calculateCQS } from '@/lib/cqs-engine'

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

    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_COMPLETED', message: 'Order must be completed before rating' } },
        { status: 400 }
      )
    }

    // Check 5-day rating window
    if (order.ratings_deadline_at && new Date(order.ratings_deadline_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: 'RATING_WINDOW_CLOSED', message: 'The 5-day rating window has expired' } },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { rating_type } = body

    if (!rating_type || !['CPR', 'CPR-C'].includes(rating_type)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'rating_type must be CPR or CPR-C' } },
        { status: 400 }
      )
    }

    // Check if already rated
    const existing = await queryOne(
      `SELECT id FROM ratings WHERE order_id = $1 AND rated_by_user = $2 AND rating_type = $3`,
      [id, user.id, rating_type]
    )
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_RATED', message: `You have already submitted a ${rating_type} rating for this order` } },
        { status: 409 }
      )
    }

    let overallScore: number

    if (rating_type === 'CPR') {
      // Commercial Performance Rating
      const { on_time_delivery, quantity_accuracy, communication, doc_speed, overall_commercial, comments } = body

      if (!on_time_delivery || !quantity_accuracy || !communication || !doc_speed || !overall_commercial) {
        return NextResponse.json(
          { success: false, error: { code: 'MISSING_FIELDS', message: 'All 5 CPR criteria are required (1-5 scale)' } },
          { status: 400 }
        )
      }

      overallScore = (on_time_delivery + quantity_accuracy + communication + doc_speed + overall_commercial) / 5

      await query(
        `INSERT INTO ratings (order_id, rated_by_user, rating_type,
          crit_on_time_delivery, crit_quantity_accuracy, crit_communication,
          crit_doc_speed, crit_overall_commercial, overall_score, comments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, user.id, 'CPR', on_time_delivery, quantity_accuracy, communication, doc_speed, overall_commercial, overallScore, comments || null]
      )
    } else {
      // Compliance Performance Rating (CPR-C)
      const { coa_quality, batch_record, deviation_handling, regulatory_docs, overall_compliance, comments } = body

      if (!coa_quality || !batch_record || !deviation_handling || !regulatory_docs || !overall_compliance) {
        return NextResponse.json(
          { success: false, error: { code: 'MISSING_FIELDS', message: 'All 5 CPR-C criteria are required (1-5 scale)' } },
          { status: 400 }
        )
      }

      overallScore = (coa_quality + batch_record + deviation_handling + regulatory_docs + overall_compliance) / 5

      await query(
        `INSERT INTO ratings (order_id, rated_by_user, rating_type,
          crit_coa_quality, crit_batch_record, crit_deviation_handling,
          crit_regulatory_docs, crit_overall_compliance, overall_score, comments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, user.id, 'CPR-C', coa_quality, batch_record, deviation_handling, regulatory_docs, overall_compliance, overallScore, comments || null]
      )
    }

    // Trigger CQS recalculation for the seller
    calculateCQS(order.seller_id).catch((err) =>
      console.error('CQS recalculation error after rating:', err)
    )

    return NextResponse.json({
      success: true,
      data: {
        order_id: id,
        rating_type,
        overall_score: Math.round(overallScore * 100) / 100,
        message: `${rating_type} rating submitted successfully`,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Rating error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
