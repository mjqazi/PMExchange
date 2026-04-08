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

    const manufacturer = await queryOne(
      `SELECT m.*,
              (SELECT COUNT(*) FROM products WHERE manufacturer_id = m.id AND status = 'ACTIVE') as active_products,
              (SELECT COUNT(*) FROM batches WHERE manufacturer_id = m.id AND status = 'RELEASED') as released_batches,
              (SELECT COUNT(*) FROM orders WHERE seller_id = m.id AND status = 'COMPLETED') as completed_orders
       FROM manufacturers m WHERE m.id = $1`,
      [id]
    )

    if (!manufacturer) {
      return NextResponse.json(
        { success: false, error: { code: 'SELLER_NOT_FOUND', message: 'Seller not found' } },
        { status: 404 }
      )
    }

    // Get products
    const products = await query(
      `SELECT id, inn_name, brand_name, strength, dosage_form, drap_reg_no, marketed_status
       FROM products WHERE manufacturer_id = $1 AND status = 'ACTIVE' ORDER BY inn_name`,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: {
        ...manufacturer,
        products: products.rows,
      },
    })
  } catch (error) {
    console.error('Seller profile error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
