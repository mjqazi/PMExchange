import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser, comparePassword } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import crypto from 'crypto'

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
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_PASSWORD', message: 'Password re-entry is required for contract signing' } },
        { status: 400 }
      )
    }

    // Verify password
    const userRecord = await queryOne<any>(`SELECT password_hash FROM users WHERE id = $1`, [user.id])
    const validPassword = await comparePassword(password, userRecord.password_hash)
    if (!validPassword) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: 'Password verification failed' } },
        { status: 401 }
      )
    }

    const order = await queryOne<any>(`SELECT * FROM orders WHERE id = $1`, [id])
    if (!order) {
      return NextResponse.json(
        { success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } },
        { status: 404 }
      )
    }

    if (order.status !== 'CONTRACT_GENERATED') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: 'Contract has not been generated yet' } },
        { status: 400 }
      )
    }

    const isBuyer = user.buyer_id === order.buyer_id
    const isSeller = user.manufacturer_id === order.seller_id

    if (!isBuyer && !isSeller && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    // Check if already signed by this party
    if (isBuyer && order.contract_signed_buyer_at) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_SIGNED', message: 'Buyer has already signed this contract' } },
        { status: 409 }
      )
    }
    if (isSeller && order.contract_signed_seller_at) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_SIGNED', message: 'Seller has already signed this contract' } },
        { status: 409 }
      )
    }

    // Create signature hash
    const signatureData = `${user.id}|${user.full_name}|${order.contract_ref}|${order.contract_hash}|${new Date().toISOString()}`
    const signatureHash = crypto.createHash('sha256').update(signatureData).digest('hex')

    // Update the appropriate signature field
    if (isBuyer) {
      await query(
        `UPDATE orders SET contract_signed_buyer_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [id]
      )
    } else if (isSeller) {
      await query(
        `UPDATE orders SET contract_signed_seller_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [id]
      )
    }

    // Check if both parties have now signed
    const updatedOrder = await queryOne<any>(`SELECT * FROM orders WHERE id = $1`, [id])
    const bothSigned = !!updatedOrder.contract_signed_buyer_at && !!updatedOrder.contract_signed_seller_at

    if (bothSigned) {
      // Create PSO escrow sub-account (mock)
      const escrowRef = `PSO-ESC-${id.substring(0, 8).toUpperCase()}`
      const totalAmount = parseFloat(updatedOrder.agreed_price_usd || 0) * updatedOrder.quantity

      await query(
        `INSERT INTO escrow_accounts (order_id, pso_account_ref, amount_usd, status)
         VALUES ($1, $2, $3, 'PENDING')
         ON CONFLICT (pso_account_ref) DO NOTHING`,
        [id, escrowRef, totalAmount]
      )

      await query(
        `UPDATE orders SET escrow_account_ref = $1 WHERE id = $2`,
        [escrowRef, id]
      )
    }

    // Notify the other party
    const notifyUsers = isBuyer
      ? await query(`SELECT id FROM users WHERE manufacturer_id = $1 AND role IN ('SELLER_ADMIN', 'SELLER_QA')`, [order.seller_id])
      : await query(`SELECT id FROM users WHERE buyer_id = $1`, [order.buyer_id])

    for (const u of notifyUsers.rows) {
      await createNotification(u.id, 'CONTRACT_SIGNED', {
        title: `Contract signed by ${isBuyer ? 'buyer' : 'seller'}`,
        body: bothSigned
          ? 'Both parties have signed. PSO escrow sub-account created. Please fund escrow.'
          : `${isBuyer ? 'Buyer' : 'Seller'} has signed the contract. Awaiting ${isBuyer ? 'seller' : 'buyer'} signature.`,
        link: `/orders/${id}`,
        relatedEntityType: 'order',
        relatedEntityId: id,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        order_id: id,
        signed_by: isBuyer ? 'buyer' : 'seller',
        signature_hash: signatureHash,
        both_signed: bothSigned,
        escrow_created: bothSigned,
      },
    })
  } catch (error) {
    console.error('Contract sign error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
