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

    const batch = await queryOne<any>(`SELECT manufacturer_id FROM batches WHERE id = $1`, [id])
    if (!batch) {
      return NextResponse.json(
        { success: false, error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      )
    }

    if (user.manufacturer_id && user.manufacturer_id !== batch.manufacturer_id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    const records = await query(
      `SELECT e.*, u.full_name as recorded_by_name
       FROM batch_environmental e
       LEFT JOIN users u ON e.recorded_by = u.id
       WHERE e.batch_id = $1
       ORDER BY e.recorded_at DESC`,
      [id]
    )

    return NextResponse.json({
      success: true,
      data: records.rows,
    })
  } catch (error) {
    console.error('Environmental GET error:', error)
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

    const batch = await queryOne<any>(`SELECT manufacturer_id, status FROM batches WHERE id = $1`, [id])
    if (!batch) {
      return NextResponse.json(
        { success: false, error: { code: 'BATCH_NOT_FOUND', message: 'Batch not found' } },
        { status: 404 }
      )
    }

    if (user.manufacturer_id && user.manufacturer_id !== batch.manufacturer_id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { production_area, recorded_at, temperature_c, humidity_pct, differential_pressure_pa, within_spec, notes, step_id } = body

    if (!production_area || !recorded_at) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'production_area and recorded_at are required' } },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO batch_environmental (batch_id, step_id, production_area, recorded_at, temperature_c, humidity_pct, differential_pressure_pa, within_spec, notes, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        step_id || null,
        production_area,
        recorded_at,
        temperature_c ?? null,
        humidity_pct ?? null,
        differential_pressure_pa ?? null,
        within_spec ?? true,
        notes || null,
        user.id,
      ]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    }, { status: 201 })
  } catch (error) {
    console.error('Environmental create error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
