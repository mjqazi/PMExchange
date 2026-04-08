import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)
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

    // Get the file path before deleting the record
    const media = await queryOne<{ file_path: string }>(`SELECT file_path FROM cms_media WHERE id = $1`, [id])
    if (!media) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Media not found' } },
        { status: 404 }
      )
    }

    // Delete DB record
    await query(`DELETE FROM cms_media WHERE id = $1`, [id])

    // Attempt to delete the file from disk
    try {
      const fullPath = join(process.cwd(), 'public', media.file_path)
      await unlink(fullPath)
    } catch {
      // File may already be deleted; log but don't fail
      console.warn(`Could not delete file at ${media.file_path}`)
    }

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('Delete CMS media error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
