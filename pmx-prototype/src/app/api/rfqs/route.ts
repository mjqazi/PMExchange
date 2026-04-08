import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    let sql = `SELECT r.*, b.company_name as buyer_name, b.country_code as buyer_country
               FROM rfqs r
               JOIN buyers b ON r.buyer_id = b.id
               WHERE 1=1`
    const params: any[] = []
    let paramIdx = 1

    // Buyers see only their own RFQs; sellers see published RFQs; admins see all
    if (user.buyer_id) {
      sql += ` AND r.buyer_id = $${paramIdx++}`
      params.push(user.buyer_id)
    } else if (user.manufacturer_id) {
      // Sellers only see published or awarded RFQs
      sql += ` AND r.status IN ('PUBLISHED', 'AWARDED')`
    }

    if (status) {
      sql += ` AND r.status = $${paramIdx++}`
      params.push(status)
    }

    if (cursor) {
      sql += ` AND r.created_at < $${paramIdx++}`
      params.push(cursor)
    }

    sql += ` ORDER BY r.created_at DESC LIMIT $${paramIdx}`
    params.push(limit + 1)

    const result = await query(sql, params)
    const hasMore = result.rows.length > limit
    const data = hasMore ? result.rows.slice(0, limit) : result.rows

    return NextResponse.json({
      success: true,
      data,
      next_cursor: hasMore ? data[data.length - 1].created_at : null,
      has_more: hasMore,
    })
  } catch (error) {
    console.error('List RFQs error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    if (!user.buyer_id && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only buyers can create RFQs' } },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Accept both snake_case API names and camelCase frontend form names
    const product_inn = body.product_inn || body.inn
    const product_strength = body.product_strength || body.strength
    const product_form = body.product_form || body.dosageForm
    const volume_qty = body.volume_qty || body.volume
    const destination_country = body.destination_country || body.destination
    const volume_unit = body.volume_unit || body.unit
    const order_frequency = body.order_frequency || body.frequency
    const incoterms = body.incoterms
    const lead_time_days = body.lead_time_days || body.leadTime
    const price_min_usd = body.price_min_usd || body.priceMin
    const price_max_usd = body.price_max_usd || body.priceMax
    const payment_terms = body.payment_terms || body.paymentTerms
    const rfqStatus = body.status

    // Convert certs object/array to string array for DB
    let required_certs: string[] | null = body.required_certs || null
    if (body.certs && typeof body.certs === 'object' && !Array.isArray(body.certs)) {
      // Frontend sends { whoGmp: true, sfda: false, ... }
      const certMap: Record<string, string> = {
        whoGmp: 'WHO-GMP',
        sfda: 'SFDA',
        drapGmp: 'DRAP-GMP',
        nmpa: 'NMPA',
      }
      required_certs = Object.entries(body.certs)
        .filter(([, v]) => v === true)
        .map(([k]) => certMap[k] || k)
      if (required_certs.length === 0) required_certs = null
    }

    // 5 mandatory fields
    if (!product_inn || !product_strength || !product_form || !volume_qty || !destination_country) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'product_inn, product_strength, product_form, volume_qty, and destination_country are required' } },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO rfqs (buyer_id, product_inn, product_strength, product_form, volume_qty,
        volume_unit, order_frequency, required_certs, destination_country, incoterms,
        lead_time_days, price_min_usd, price_max_usd, payment_terms, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        user.buyer_id,
        product_inn,
        product_strength,
        product_form,
        volume_qty,
        volume_unit || 'tablets',
        order_frequency || null,
        required_certs || null,
        destination_country,
        incoterms || null,
        lead_time_days ? parseInt(String(lead_time_days)) : null,
        price_min_usd ? parseFloat(String(price_min_usd)) : null,
        price_max_usd ? parseFloat(String(price_max_usd)) : null,
        payment_terms || 'PSO Escrow',
        rfqStatus || 'PUBLISHED',
      ]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    }, { status: 201 })
  } catch (error) {
    console.error('Create RFQ error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
