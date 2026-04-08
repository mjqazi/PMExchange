import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

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

    const order = await queryOne<any>(
      `SELECT o.*,
              b.company_name as buyer_name, b.country_code as buyer_country,
              m.company_name as seller_name, m.drap_licence_no,
              p.inn_name as product_inn, p.brand_name, p.strength, p.dosage_form,
              ba.batch_no, ba.status as batch_status
       FROM orders o
       JOIN buyers b ON o.buyer_id = b.id
       JOIN manufacturers m ON o.seller_id = m.id
       LEFT JOIN products p ON o.product_id = p.id
       LEFT JOIN batches ba ON o.batch_id = ba.id
       WHERE o.id = $1`,
      [id]
    )

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

    // Get escrow info
    const escrow = await queryOne(
      `SELECT * FROM escrow_accounts WHERE order_id = $1`,
      [id]
    )

    // Get current offer
    const currentOffer = await queryOne(
      `SELECT * FROM messages WHERE order_id = $1 AND is_current_offer = TRUE ORDER BY created_at DESC LIMIT 1`,
      [id]
    )

    // Get dispute info
    const dispute = await queryOne(
      `SELECT * FROM disputes WHERE order_id = $1 AND status = 'OPEN' LIMIT 1`,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        escrow: escrow || null,
        current_offer: currentOffer || null,
        active_dispute: dispute || null,
      },
    })
  } catch (error) {
    console.error('Order detail error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
