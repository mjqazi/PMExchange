import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { generateContractPDF } from '@/lib/pdf-generator'
import { createNotification } from '@/lib/notifications'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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

    // Verify current offer exists
    const currentOffer = await queryOne<any>(
      `SELECT * FROM messages WHERE order_id = $1 AND is_current_offer = TRUE ORDER BY created_at DESC LIMIT 1`,
      [id]
    )

    if (!currentOffer) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_OFFER', message: 'No current offer to accept' } },
        { status: 400 }
      )
    }

    // Record acceptance message
    await query(
      `INSERT INTO messages (order_id, rfq_id, sender_id, sender_role, message_type, content,
        offer_price_usd, offer_qty, offer_lead_days, offer_incoterms, offer_version)
       VALUES ($1, $2, $3, $4, 'ACCEPT', $5, $6, $7, $8, $9, $10)`,
      [
        id,
        order.rfq_id,
        user.id,
        user.role,
        `Offer accepted: $${currentOffer.offer_price_usd}/unit, ${currentOffer.offer_qty} units`,
        currentOffer.offer_price_usd,
        currentOffer.offer_qty,
        currentOffer.offer_lead_days,
        currentOffer.offer_incoterms,
        currentOffer.offer_version,
      ]
    )

    // Generate contract PDF
    const buyer = await queryOne<any>(`SELECT * FROM buyers WHERE id = $1`, [order.buyer_id])
    const seller = await queryOne<any>(`SELECT * FROM manufacturers WHERE id = $1`, [order.seller_id])
    const product = order.product_id
      ? await queryOne<any>(`SELECT * FROM products WHERE id = $1`, [order.product_id])
      : null

    const contractRef = `PMX-CONTRACT-${id.substring(0, 8).toUpperCase()}`
    const contractOrder = {
      ...order,
      contract_ref: contractRef,
      agreed_price_usd: currentOffer.offer_price_usd,
      quantity: currentOffer.offer_qty || order.quantity,
      incoterms: currentOffer.offer_incoterms || 'FOB Karachi',
    }

    const { pdfBytes, sha256 } = await generateContractPDF(contractOrder, buyer, seller, product)

    // Save contract PDF
    const contractDir = path.join(process.cwd(), 'public', 'contracts')
    await mkdir(contractDir, { recursive: true })
    const pdfPath = `/contracts/${contractRef}.pdf`
    await writeFile(path.join(process.cwd(), 'public', pdfPath), pdfBytes)

    // Update order to CONTRACT_GENERATED
    await query(
      `UPDATE orders SET
        status = 'CONTRACT_GENERATED',
        agreed_price_usd = $1,
        quantity = $2,
        contract_ref = $3,
        contract_pdf_path = $4,
        contract_hash = $5,
        updated_at = NOW()
       WHERE id = $6`,
      [currentOffer.offer_price_usd, currentOffer.offer_qty || order.quantity, contractRef, pdfPath, sha256, id]
    )

    // Notify both parties
    const buyerUsers = await query(`SELECT id FROM users WHERE buyer_id = $1`, [order.buyer_id])
    const sellerUsers = await query(`SELECT id FROM users WHERE manufacturer_id = $1 AND role IN ('SELLER_ADMIN', 'SELLER_QA')`, [order.seller_id])
    const allUsers = [...buyerUsers.rows, ...sellerUsers.rows]

    for (const u of allUsers) {
      await createNotification(u.id, 'CONTRACT_GENERATED', {
        title: 'Contract generated',
        body: `PMX Supply Agreement (${contractRef}) generated. Both parties must sign.`,
        link: `/orders/${id}`,
        relatedEntityType: 'order',
        relatedEntityId: id,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        order_id: id,
        status: 'CONTRACT_GENERATED',
        contract_ref: contractRef,
        contract_pdf_path: pdfPath,
        contract_hash: sha256,
        agreed_price_usd: currentOffer.offer_price_usd,
        quantity: currentOffer.offer_qty || order.quantity,
      },
    })
  } catch (error) {
    console.error('Accept offer error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
