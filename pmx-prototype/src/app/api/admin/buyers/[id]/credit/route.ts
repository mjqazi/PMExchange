import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

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

    if (user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'PMX Admin access required' } },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { credit_limit_usd } = body

    if (credit_limit_usd === undefined || credit_limit_usd === null) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'credit_limit_usd is required (integer cents USD)' } },
        { status: 400 }
      )
    }

    const buyer = await queryOne<any>(`SELECT * FROM buyers WHERE id = $1`, [id])
    if (!buyer) {
      return NextResponse.json(
        { success: false, error: { code: 'BUYER_NOT_FOUND', message: 'Buyer not found' } },
        { status: 404 }
      )
    }

    await query(
      `UPDATE buyers SET credit_limit_usd = $1 WHERE id = $2`,
      [credit_limit_usd, id]
    )

    return NextResponse.json({
      success: true,
      data: {
        buyer_id: id,
        previous_credit_limit: buyer.credit_limit_usd,
        new_credit_limit: credit_limit_usd,
        updated_by: user.full_name,
      },
    })
  } catch (error) {
    console.error('Credit limit update error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
