import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { generateDRAPDocument } from '@/lib/pdf-generator'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    if (!user.manufacturer_id && user.role !== 'PMX_ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only sellers can generate DRAP documents' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { product_id, destination_country } = body

    if (!product_id || !destination_country) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'product_id and destination_country are required' } },
        { status: 400 }
      )
    }

    const manufacturer = await queryOne<any>(
      `SELECT * FROM manufacturers WHERE id = $1`,
      [user.manufacturer_id]
    )
    const product = await queryOne<any>(
      `SELECT * FROM products WHERE id = $1 AND manufacturer_id = $2`,
      [product_id, user.manufacturer_id]
    )

    if (!product) {
      return NextResponse.json(
        { success: false, error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      )
    }

    const { pdfBytes, sha256 } = await generateDRAPDocument('COPP', manufacturer, product, destination_country)

    // Save PDF
    const drapDir = path.join(process.cwd(), 'public', 'drap')
    await mkdir(drapDir, { recursive: true })
    const docRef = `COPP-${manufacturer.drap_licence_no}-${Date.now().toString(36).toUpperCase()}`
    const pdfPath = `/drap/${docRef}.pdf`
    await writeFile(path.join(process.cwd(), 'public', pdfPath), pdfBytes)

    // Create record
    const validUntil = new Date()
    validUntil.setFullYear(validUntil.getFullYear() + 2)

    const result = await query(
      `INSERT INTO drap_documents (manufacturer_id, doc_type, product_id, destination_country, doc_ref, pdf_path, sha256_hash, generated_by, valid_until)
       VALUES ($1, 'COPP', $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user.manufacturer_id, product_id, destination_country, docRef, pdfPath, sha256, user.id, validUntil.toISOString().split('T')[0]]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    }, { status: 201 })
  } catch (error) {
    console.error('COPP generation error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
