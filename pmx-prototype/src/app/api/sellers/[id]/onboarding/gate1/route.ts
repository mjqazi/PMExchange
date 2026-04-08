import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { GATE_1_DOCS } from '@/lib/types'

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

    // Only seller admin or PMX admin can upload docs
    if (user.role !== 'PMX_ADMIN' && (user.role !== 'SELLER_ADMIN' || user.manufacturer_id !== id)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    const manufacturer = await queryOne<any>(
      `SELECT id, kyb_gate FROM manufacturers WHERE id = $1`,
      [id]
    )

    if (!manufacturer) {
      return NextResponse.json(
        { success: false, error: { code: 'SELLER_NOT_FOUND', message: 'Seller not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { documents } = body

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_DOCUMENTS', message: 'At least one document is required' } },
        { status: 400 }
      )
    }

    // Validate document types
    const validTypes = GATE_1_DOCS.map((d) => d.type)
    const uploadedDocs = []

    for (const doc of documents) {
      if (!validTypes.includes(doc.doc_type)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_DOC_TYPE', message: `Invalid document type: ${doc.doc_type}` } },
          { status: 400 }
        )
      }

      const docDef = GATE_1_DOCS.find((d) => d.type === doc.doc_type)

      // Upsert document record
      await query(
        `INSERT INTO onboarding_documents (manufacturer_id, gate, doc_type, doc_label, file_path, file_name, uploaded_by)
         VALUES ($1, 'GATE_1', $2, $3, $4, $5, $6)
         ON CONFLICT (manufacturer_id, gate, doc_type) DO UPDATE SET
           file_path = EXCLUDED.file_path,
           file_name = EXCLUDED.file_name,
           verification_status = 'UPLOADED',
           uploaded_by = EXCLUDED.uploaded_by,
           uploaded_at = NOW()`,
        [id, doc.doc_type, docDef?.label || doc.doc_type, doc.file_path || '/uploads/placeholder', doc.file_name || 'document.pdf', user.id]
      )

      uploadedDocs.push(doc.doc_type)
    }

    // Check if all required docs are uploaded
    const allDocs = await query(
      `SELECT doc_type FROM onboarding_documents WHERE manufacturer_id = $1 AND gate = 'GATE_1'`,
      [id]
    )
    const uploadedTypes = allDocs.rows.map((d: any) => d.doc_type)
    const requiredDocs = GATE_1_DOCS.filter((d) => d.required)
    const allRequiredUploaded = requiredDocs.every((d) => uploadedTypes.includes(d.type))

    // If all required docs uploaded and still at GATE_1, advance to GATE_2
    if (allRequiredUploaded && manufacturer.kyb_gate === 'GATE_1') {
      await query(
        `UPDATE manufacturers SET kyb_gate = 'GATE_2', updated_at = NOW() WHERE id = $1`,
        [id]
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        uploaded: uploadedDocs,
        all_required_uploaded: allRequiredUploaded,
        advanced_to_gate2: allRequiredUploaded && manufacturer.kyb_gate === 'GATE_1',
      },
    })
  } catch (error) {
    console.error('Gate 1 upload error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    )
  }
}
