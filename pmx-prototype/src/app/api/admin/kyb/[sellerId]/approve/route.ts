import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'

const GATE_ADVANCEMENT: Record<string, string> = {
  GATE_1: 'GATE_2',
  GATE_2: 'GATE_3',
  GATE_3: 'GATE_4',
  GATE_4: 'APPROVED',
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
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

    const { sellerId } = await params
    const body = await request.json().catch(() => ({}))
    const { notes } = body

    const manufacturer = await queryOne<any>(
      `SELECT id, company_name, kyb_gate FROM manufacturers WHERE id = $1`,
      [sellerId]
    )

    if (!manufacturer) {
      return NextResponse.json(
        { success: false, error: { code: 'SELLER_NOT_FOUND', message: 'Seller not found' } },
        { status: 404 }
      )
    }

    const nextGate = GATE_ADVANCEMENT[manufacturer.kyb_gate]
    if (!nextGate) {
      return NextResponse.json(
        { success: false, error: { code: 'CANNOT_ADVANCE', message: `Cannot advance from ${manufacturer.kyb_gate}` } },
        { status: 400 }
      )
    }

    // For Gate 2 approval, run mock KYB checks and store notes
    if (manufacturer.kyb_gate === 'GATE_2') {
      await query(
        `UPDATE manufacturers SET gate2_verification_notes = $1 WHERE id = $2`,
        [notes || '[MOCK] All KYB checks passed: DRAP, SECP, FBR, FATF/AML', sellerId]
      )
      // Mark all Gate 1 documents as verified
      await query(
        `UPDATE onboarding_documents SET verification_status = 'VERIFIED', verified_by = $1, verified_at = NOW()
         WHERE manufacturer_id = $2 AND gate = 'GATE_1' AND verification_status = 'UPLOADED'`,
        [user.id, sellerId]
      )
    }

    // Use parameterized query for kyb_gate to prevent SQL injection
    const updates: string[] = [`kyb_gate = $1`, `updated_at = NOW()`]
    const updateParams: any[] = [nextGate]
    if (nextGate === 'APPROVED') {
      updates.push(`pmx_certified = TRUE`, `status = 'ACTIVE'`)
    }

    updateParams.push(sellerId)
    await query(
      `UPDATE manufacturers SET ${updates.join(', ')} WHERE id = $${updateParams.length}`,
      updateParams
    )

    // Notify seller admins
    const sellerAdmins = await query(
      `SELECT id FROM users WHERE manufacturer_id = $1 AND role = 'SELLER_ADMIN'`,
      [sellerId]
    )
    for (const admin of sellerAdmins.rows) {
      await createNotification(admin.id, 'KYB_GATE_APPROVED', {
        title: `KYB Gate Approved`,
        body: nextGate === 'APPROVED'
          ? 'Congratulations! Your company is now PMX-Certified.'
          : `Advanced to ${nextGate}. Please complete the next requirements.`,
        link: '/seller/onboarding',
        relatedEntityType: 'manufacturer',
        relatedEntityId: sellerId,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        seller_id: sellerId,
        previous_gate: manufacturer.kyb_gate,
        new_gate: nextGate,
        pmx_certified: nextGate === 'APPROVED',
      },
    })
  } catch (error) {
    console.error('KYB approve error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
