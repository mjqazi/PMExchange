import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { id, materialId } = await params

    // Get batch and validate access
    const batch = await queryOne<any>(
      `SELECT manufacturer_id, status FROM batches WHERE id = $1`,
      [id]
    )

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

    // Only allow material deletion when batch is IN_PROGRESS
    if (batch.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATUS', message: `Cannot delete materials when batch is ${batch.status}` } },
        { status: 400 }
      )
    }

    // Verify material belongs to this batch
    const material = await queryOne<any>(
      `SELECT id FROM batch_materials WHERE id = $1 AND batch_id = $2`,
      [materialId, id]
    )

    if (!material) {
      return NextResponse.json(
        { success: false, error: { code: 'MATERIAL_NOT_FOUND', message: 'Material not found for this batch' } },
        { status: 404 }
      )
    }

    await query(`DELETE FROM batch_materials WHERE id = $1`, [materialId])

    return NextResponse.json({
      success: true,
      data: { deleted: materialId },
    })
  } catch (error) {
    console.error('Material delete error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
