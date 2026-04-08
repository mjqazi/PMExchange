import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

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

    if (user.role !== 'PMX_ADMIN' && user.manufacturer_id !== id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    const manufacturer = await queryOne<any>(
      `SELECT id, product_count, bank_account_confirmed, tos_accepted_at FROM manufacturers WHERE id = $1`,
      [id]
    )

    if (!manufacturer) {
      return NextResponse.json(
        { success: false, error: { code: 'SELLER_NOT_FOUND', message: 'Seller not found' } },
        { status: 404 }
      )
    }

    const hasQaUser = await queryOne(
      `SELECT 1 FROM users WHERE manufacturer_id = $1 AND role = 'SELLER_QA' AND status = 'ACTIVE'`,
      [id]
    )

    const checklist = {
      has_products: manufacturer.product_count >= 1,
      has_qa_user: !!hasQaUser,
      bank_confirmed: manufacturer.bank_account_confirmed,
      tos_accepted: !!manufacturer.tos_accepted_at,
    }

    const allComplete = Object.values(checklist).every(Boolean)

    return NextResponse.json({
      success: true,
      data: { checklist, all_complete: allComplete },
    })
  } catch (error) {
    console.error('Gate 4 GET error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

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

    if (user.role !== 'PMX_ADMIN' && (user.role !== 'SELLER_ADMIN' || user.manufacturer_id !== id)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    const manufacturer = await queryOne<any>(
      `SELECT id, kyb_gate, product_count, bank_account_confirmed, tos_accepted_at
       FROM manufacturers WHERE id = $1`,
      [id]
    )

    if (!manufacturer) {
      return NextResponse.json(
        { success: false, error: { code: 'SELLER_NOT_FOUND', message: 'Seller not found' } },
        { status: 404 }
      )
    }

    // Optionally accept TOS acceptance in this request
    const body = await request.json().catch(() => ({}))
    if (body.accept_tos && !manufacturer.tos_accepted_at) {
      await query(`UPDATE manufacturers SET tos_accepted_at = NOW() WHERE id = $1`, [id])
      manufacturer.tos_accepted_at = new Date().toISOString()
    }

    // Check all gate 4 conditions
    const hasQaUser = await queryOne(
      `SELECT 1 FROM users WHERE manufacturer_id = $1 AND role = 'SELLER_QA' AND status = 'ACTIVE'`,
      [id]
    )

    const checklist = {
      has_products: manufacturer.product_count >= 1,
      has_qa_user: !!hasQaUser,
      bank_confirmed: manufacturer.bank_account_confirmed,
      tos_accepted: !!manufacturer.tos_accepted_at,
    }

    const allComplete = Object.values(checklist).every(Boolean)

    if (!allComplete) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'GATE4_INCOMPLETE',
          message: 'Not all Gate 4 requirements are met',
        },
        data: { checklist },
      }, { status: 400 })
    }

    // All conditions met: advance to APPROVED
    if (manufacturer.kyb_gate === 'GATE_4') {
      await query(
        `UPDATE manufacturers SET kyb_gate = 'APPROVED', pmx_certified = TRUE, status = 'ACTIVE', updated_at = NOW() WHERE id = $1`,
        [id]
      )

      // Notify seller admins
      const sellerAdmins = await query(
        `SELECT id FROM users WHERE manufacturer_id = $1 AND role = 'SELLER_ADMIN'`,
        [id]
      )
      for (const admin of sellerAdmins.rows) {
        await createNotification(admin.id, 'KYB_GATE_APPROVED', {
          title: 'PMX Certification Complete',
          body: 'Congratulations! Your company is now PMX-Certified and can participate in the marketplace.',
          link: '/seller/dashboard',
          relatedEntityType: 'manufacturer',
          relatedEntityId: id,
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        checklist,
        all_complete: allComplete,
        advanced_to_approved: manufacturer.kyb_gate === 'GATE_4',
      },
    })
  } catch (error) {
    console.error('Gate 4 POST error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
