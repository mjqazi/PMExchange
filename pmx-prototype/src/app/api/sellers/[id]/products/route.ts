import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET: List manufacturer's registered products
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

    // Sellers can only view their own products; admins can view any
    if (user.role !== 'PMX_ADMIN' && user.manufacturer_id !== id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only view your own products' } },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'ACTIVE'
    const q = searchParams.get('q')

    let sql = `SELECT p.*,
                      (SELECT COUNT(*) FROM batches WHERE product_id = p.id) as batch_count
               FROM products p
               WHERE p.manufacturer_id = $1`
    const sqlParams: unknown[] = [id]
    let paramIdx = 2

    if (statusFilter !== 'ALL') {
      sql += ` AND p.status = $${paramIdx++}`
      sqlParams.push(statusFilter)
    }

    if (q) {
      sql += ` AND (p.inn_name ILIKE $${paramIdx} OR p.brand_name ILIKE $${paramIdx})`
      paramIdx++
      sqlParams.push(`%${q}%`)
    }

    sql += ` ORDER BY p.inn_name, p.strength`

    const result = await query(sql, sqlParams)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error('List seller products error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

// POST: Register new product from drug dictionary
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

    // Only SELLER_ADMIN can register products
    if (user.role !== 'SELLER_ADMIN' && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'SELLER_ADMIN role required to register products' } },
        { status: 403 }
      )
    }

    const { id } = await params

    // Sellers can only add to their own manufacturer
    if (user.role === 'SELLER_ADMIN' && user.manufacturer_id !== id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only register products for your own company' } },
        { status: 403 }
      )
    }

    // Verify manufacturer exists
    const manufacturer = await queryOne<{ id: string; status: string }>(
      `SELECT id, status FROM manufacturers WHERE id = $1`,
      [id]
    )
    if (!manufacturer) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Manufacturer not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      drug_id,
      brand_name,
      strength,
      dosage_form,
      drap_reg_no,
      annual_production_capacity,
      export_eligible_countries,
      pack_sizes,
      labelling_reference,
    } = body

    if (!drug_id) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'drug_id is required (from drug dictionary)' } },
        { status: 400 }
      )
    }

    if (!strength) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'strength is required' } },
        { status: 400 }
      )
    }

    if (!dosage_form) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'dosage_form is required' } },
        { status: 400 }
      )
    }

    // Look up drug dictionary entry
    const drug = await queryOne<{
      id: string
      inn_name: string
      category_name: string | null
      pharmacopoeia: string | null
    }>(
      `SELECT id, inn_name, category_name, pharmacopoeia
       FROM drug_dictionary WHERE id = $1 AND active = TRUE`,
      [drug_id]
    )

    if (!drug) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Drug not found in dictionary or is inactive' } },
        { status: 404 }
      )
    }

    // Insert product using drug dictionary data
    const product = await queryOne(
      `INSERT INTO products
        (manufacturer_id, inn_name, brand_name, strength, dosage_form,
         drap_reg_no, product_category, pharmacopoeia,
         annual_production_capacity, export_eligible_countries,
         labelling_reference, registered_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE, 'ACTIVE')
       RETURNING *`,
      [
        id,
        drug.inn_name,
        brand_name || null,
        strength,
        dosage_form,
        drap_reg_no || null,
        drug.category_name || null,
        drug.pharmacopoeia || null,
        annual_production_capacity || null,
        export_eligible_countries || null,
        labelling_reference || null,
      ]
    )

    // product_count is updated by the existing trigger (trg_product_count)

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register product error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
