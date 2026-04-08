import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as QRCode from 'qrcode'
import * as crypto from 'crypto'

export async function generateCoAPDF(
  batch: any,
  manufacturer: any,
  qcTests: any[] = [],
  qaSig: any = null
): Promise<{ pdfBytes: Uint8Array; sha256: string; qrPayload: string }> {
  if (!batch || !manufacturer) {
    throw new Error('Batch and manufacturer data are required to generate CoA PDF')
  }
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()

  // Header
  page.drawText('CERTIFICATE OF ANALYSIS', { x: 50, y: height - 60, size: 16, font: boldFont })
  page.drawText(
    `${manufacturer.company_name} | DRAP Licence: ${manufacturer.drap_licence_no}`,
    { x: 50, y: height - 80, size: 10, font }
  )

  // Product details table
  const fields = [
    ['Product (INN):', batch.product_inn || batch.inn_name || ''],
    ['Brand Name:', batch.brand_name || ''],
    ['Strength/Form:', `${batch.strength || ''} ${batch.dosage_form || ''}`],
    ['Batch No.:', batch.batch_no],
    ['Manufacture Date:', batch.manufacture_date?.toISOString?.() || String(batch.manufacture_date)],
    ['Expiry Date:', batch.expiry_date?.toISOString?.() || String(batch.expiry_date)],
    ['Storage:', 'Below 25 C, dry place'],
    ['Pharmacopoeia:', 'BP 2024 / USP 47'],
  ]

  let y = height - 130
  for (const [label, value] of fields) {
    page.drawText(label, { x: 50, y, size: 10, font: boldFont })
    page.drawText(String(value), { x: 200, y, size: 10, font })
    y -= 18
  }

  // QC Results table
  y -= 20
  page.drawText('QUALITY CONTROL RESULTS', { x: 50, y, size: 12, font: boldFont })
  y -= 20
  // Column headers
  page.drawText('Test', { x: 50, y, size: 9, font: boldFont })
  page.drawText('Specification', { x: 200, y, size: 9, font: boldFont })
  page.drawText('Result', { x: 330, y, size: 9, font: boldFont })
  page.drawText('Status', { x: 430, y, size: 9, font: boldFont })
  y -= 16

  for (const test of qcTests) {
    page.drawText(test.test_name, { x: 50, y, size: 9, font })
    page.drawText(test.specification || '', { x: 200, y, size: 9, font })
    page.drawText(`${test.result_value || ''} ${test.result_unit || ''}`.trim(), {
      x: 330, y, size: 9, font,
    })
    page.drawText(test.pass_fail || '', {
      x: 430, y, size: 9, font,
      color: test.pass_fail === 'PASS' ? rgb(0.23, 0.43, 0.07) : rgb(0.64, 0.18, 0.18),
    })
    y -= 16
  }

  // QA release statement with signature manifestation (21 CFR Part 11)
  y -= 20
  if (qaSig) {
    page.drawText(
      `QA Release: Approved by ${qaSig.signer_full_name} (QA Manager) on ${new Date(qaSig.signed_at).toISOString()}`,
      { x: 50, y, size: 9, font: boldFont }
    )
    y -= 14
    page.drawText(`Meaning: "${qaSig.signature_meaning}"`, { x: 50, y, size: 9, font })
  }

  // Compute SHA-256 hash of PDF content so far
  const partialBytes = await pdfDoc.save()
  const sha256 = crypto.createHash('sha256').update(partialBytes).digest('hex')

  // QR Code with payload: batch_no + manufacturer_id + date + hash
  const qrPayload = `${batch.batch_no}|${manufacturer.id}|${batch.manufacture_date}|${sha256.substring(0, 16)}`
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 80 })
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrDataUrl.split(',')[1], 'base64'))
  page.drawImage(qrImage, { x: width - 120, y: 60, width: 80, height: 80 })

  // SHA-256 footer
  page.drawText(`SHA-256: ${sha256.substring(0, 32)}...`, { x: 50, y: 40, size: 8, font })

  const pdfBytes = await pdfDoc.save()
  return { pdfBytes, sha256, qrPayload }
}

export async function generateContractPDF(order: any, buyer: any, seller: any, product: any = null): Promise<{ pdfBytes: Uint8Array; sha256: string }> {
  if (!order || !buyer || !seller) {
    throw new Error('Order, buyer, and seller data are required to generate contract PDF')
  }
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const { height } = page.getSize()

  let y = height - 60
  page.drawText('PMX SUPPLY AGREEMENT', { x: 50, y, size: 18, font: boldFont })
  y -= 25
  page.drawText(`Contract Ref: ${order.contract_ref || 'PMX-CONTRACT-' + order.id.substring(0, 8)}`, { x: 50, y, size: 11, font })
  y -= 20
  page.drawText(`Date: ${new Date().toISOString().split('T')[0]}`, { x: 50, y, size: 10, font })

  y -= 35
  page.drawText('PARTIES', { x: 50, y, size: 13, font: boldFont })
  y -= 20
  page.drawText(`Seller: ${seller.company_name} (DRAP: ${seller.drap_licence_no})`, { x: 50, y, size: 10, font })
  y -= 16
  page.drawText(`Buyer: ${buyer.company_name} (${buyer.country_code})`, { x: 50, y, size: 10, font })

  y -= 30
  page.drawText('ORDER DETAILS', { x: 50, y, size: 13, font: boldFont })
  y -= 20
  const details = [
    ['Product:', product?.inn_name ? `${product.inn_name} ${product.strength} ${product.dosage_form}` : 'As agreed'],
    ['Quantity:', String(order.quantity)],
    ['Price (USD):', order.agreed_price_usd ? `$${parseFloat(order.agreed_price_usd).toFixed(6)}/unit` : 'As agreed'],
    ['Payment Terms:', 'PSO Escrow'],
    ['Incoterms:', order.incoterms || 'FOB Karachi'],
  ]
  for (const [label, value] of details) {
    page.drawText(label, { x: 50, y, size: 10, font: boldFont })
    page.drawText(value, { x: 200, y, size: 10, font })
    y -= 18
  }

  y -= 25
  page.drawText('TERMS AND CONDITIONS', { x: 50, y, size: 13, font: boldFont })
  y -= 20
  const terms = [
    '1. Seller shall manufacture goods in compliance with DRAP GMP standards.',
    '2. Certificate of Analysis shall accompany each shipment.',
    '3. Payment held in PSO escrow until buyer confirms delivery.',
    '4. Escrow auto-releases 3 business days after delivery if no dispute.',
    '5. Either party may raise dispute within delivery confirmation window.',
    '6. PMX commission of 2% deducted from escrow on release.',
    '7. This agreement governed by laws of Pakistan.',
  ]
  for (const term of terms) {
    page.drawText(term, { x: 50, y, size: 9, font })
    y -= 16
  }

  y -= 30
  page.drawText('SIGNATURES', { x: 50, y, size: 13, font: boldFont })
  y -= 25
  page.drawText('Buyer: ____________________________', { x: 50, y, size: 10, font })
  page.drawText('Seller: ____________________________', { x: 320, y, size: 10, font })

  const pdfBytes = await pdfDoc.save()
  const sha256 = crypto.createHash('sha256').update(pdfBytes).digest('hex')
  return { pdfBytes, sha256 }
}

export async function generateDRAPDocument(
  docType: 'COPP' | 'GMP_CERT' | 'FREE_SALE',
  manufacturer: any,
  product: any = null,
  destinationCountry: string
): Promise<{ pdfBytes: Uint8Array; sha256: string }> {
  if (!manufacturer || !destinationCountry) {
    throw new Error('Manufacturer and destination country are required to generate DRAP document')
  }
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()

  const titles: Record<string, string> = {
    COPP: 'CERTIFICATE OF PHARMACEUTICAL PRODUCT (COPP)',
    GMP_CERT: 'GOOD MANUFACTURING PRACTICE CERTIFICATE',
    FREE_SALE: 'FREE SALE CERTIFICATE',
  }

  let y = height - 60
  page.drawText('DRUG REGULATORY AUTHORITY OF PAKISTAN', { x: 50, y, size: 14, font: boldFont })
  y -= 20
  page.drawText('Ministry of National Health Services', { x: 50, y, size: 10, font })
  y -= 35
  page.drawText(titles[docType] || docType, { x: 50, y, size: 14, font: boldFont })

  y -= 30
  page.drawText(`This is to certify that the following product manufactured by:`, { x: 50, y, size: 10, font })
  y -= 20
  page.drawText(`Manufacturer: ${manufacturer.company_name}`, { x: 50, y, size: 10, font: boldFont })
  y -= 16
  page.drawText(`DRAP Licence No: ${manufacturer.drap_licence_no}`, { x: 50, y, size: 10, font })
  y -= 16
  page.drawText(`Address: ${manufacturer.address || manufacturer.city || 'Pakistan'}`, { x: 50, y, size: 10, font })

  if (product) {
    y -= 25
    page.drawText('PRODUCT DETAILS', { x: 50, y, size: 12, font: boldFont })
    y -= 18
    page.drawText(`Product (INN): ${product.inn_name}`, { x: 50, y, size: 10, font })
    y -= 16
    page.drawText(`Brand Name: ${product.brand_name || 'N/A'}`, { x: 50, y, size: 10, font })
    y -= 16
    page.drawText(`Strength: ${product.strength}`, { x: 50, y, size: 10, font })
    y -= 16
    page.drawText(`Dosage Form: ${product.dosage_form}`, { x: 50, y, size: 10, font })
    y -= 16
    page.drawText(`DRAP Registration No: ${product.drap_reg_no || 'N/A'}`, { x: 50, y, size: 10, font })
  }

  y -= 25
  page.drawText(`Destination Country: ${destinationCountry}`, { x: 50, y, size: 10, font: boldFont })

  if (docType === 'COPP') {
    y -= 25
    page.drawText('CERTIFICATION', { x: 50, y, size: 12, font: boldFont })
    y -= 18
    page.drawText('This product is authorized for sale in Pakistan and conforms to WHO COPP format.', { x: 50, y, size: 10, font })
    y -= 16
    page.drawText('The manufacturing facility complies with GMP standards as per DRAP requirements.', { x: 50, y, size: 10, font })
  } else if (docType === 'GMP_CERT') {
    y -= 25
    page.drawText('GMP COMPLIANCE', { x: 50, y, size: 12, font: boldFont })
    y -= 18
    page.drawText('The manufacturing facility has been inspected and found in compliance with GMP.', { x: 50, y, size: 10, font })
    y -= 16
    page.drawText(`Last Inspection: ${manufacturer.last_gmp_inspection_date || 'On record'}`, { x: 50, y, size: 10, font })
  } else if (docType === 'FREE_SALE') {
    y -= 25
    page.drawText('FREE SALE DECLARATION', { x: 50, y, size: 12, font: boldFont })
    y -= 18
    page.drawText('The above product is freely sold in the domestic market of Pakistan.', { x: 50, y, size: 10, font })
  }

  y -= 40
  page.drawText(`Date of Issue: ${new Date().toISOString().split('T')[0]}`, { x: 50, y, size: 10, font })
  y -= 16
  const validUntil = new Date()
  validUntil.setFullYear(validUntil.getFullYear() + 2)
  page.drawText(`Valid Until: ${validUntil.toISOString().split('T')[0]}`, { x: 50, y, size: 10, font })

  y -= 40
  page.drawText('Director General, DRAP', { x: 50, y, size: 10, font: boldFont })
  page.drawText('[MOCK - Prototype Only]', { x: 50, y: y - 14, size: 8, font, color: rgb(0.6, 0.1, 0.1) })

  // QR code
  const qrPayload = `DRAP|${docType}|${manufacturer.drap_licence_no}|${product?.drap_reg_no || 'N/A'}|${new Date().toISOString()}`
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 80 })
  const qrImage = await pdfDoc.embedPng(Buffer.from(qrDataUrl.split(',')[1], 'base64'))
  page.drawImage(qrImage, { x: width - 120, y: 60, width: 80, height: 80 })

  const pdfBytes = await pdfDoc.save()
  const sha256 = crypto.createHash('sha256').update(pdfBytes).digest('hex')
  return { pdfBytes, sha256 }
}
