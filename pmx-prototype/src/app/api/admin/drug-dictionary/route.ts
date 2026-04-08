import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// GET: List/search drug dictionary (public - no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') !== 'false' // default true

    let sql = `SELECT d.*, c.slug as category_slug
               FROM drug_dictionary d
               LEFT JOIN cms_product_categories c ON c.id = d.category_id
               WHERE 1=1`
    const params: unknown[] = []
    let paramIdx = 1

    if (activeOnly) {
      sql += ` AND d.active = TRUE`
    }

    if (q) {
      sql += ` AND d.inn_name ILIKE $${paramIdx++}`
      params.push(`%${q}%`)
    }

    if (category) {
      sql += ` AND (d.category_id::text = $${paramIdx} OR c.slug = $${paramIdx})`
      paramIdx++
      params.push(category)
    }

    sql += ` ORDER BY d.category_name, d.inn_name`

    const result = await query(sql, params)

    return NextResponse.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error('Drug dictionary list error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}

// POST: Create new drug entry (PMX_ADMIN only)
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const {
      inn_name,
      category_id,
      description,
      common_strengths,
      common_dosage_forms,
      pharmacopoeia,
      common_storage,
    } = body

    if (!inn_name || !inn_name.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'INN name is required' } },
        { status: 400 }
      )
    }

    // Check for duplicate INN
    const existing = await queryOne(
      `SELECT id FROM drug_dictionary WHERE LOWER(inn_name) = LOWER($1)`,
      [inn_name.trim()]
    )
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE', message: 'A drug with this INN name already exists' } },
        { status: 409 }
      )
    }

    // Look up category name if category_id provided
    let category_name: string | null = null
    if (category_id) {
      const cat = await queryOne<{ name: string }>(
        `SELECT name FROM cms_product_categories WHERE id = $1`,
        [category_id]
      )
      if (!cat) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid category_id' } },
          { status: 400 }
        )
      }
      category_name = cat.name
    }

    const result = await queryOne(
      `INSERT INTO drug_dictionary
        (inn_name, category_id, category_name, description, common_strengths, common_dosage_forms, pharmacopoeia, common_storage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        inn_name.trim(),
        category_id || null,
        category_name,
        description || null,
        common_strengths || null,
        common_dosage_forms || null,
        pharmacopoeia || 'BP / USP',
        common_storage || 'Below 25C, dry place',
      ]
    )

    return NextResponse.json(
      { success: true, data: result },
      { status: 201 }
    )
  } catch (error) {
    console.error('Drug dictionary create error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
