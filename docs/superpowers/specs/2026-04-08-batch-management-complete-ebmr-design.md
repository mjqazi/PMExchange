# Batch Management — Complete eBMR System Design

**Date:** 2026-04-08
**Status:** Approved
**Scope:** Progressive batch creation, data entry forms for all 6 eBMR tabs, 21 CFR Part 11 signing modal, deviation lifecycle, QC test templates, batch release with CoA generation

---

## Context

The batch management system has strong backend APIs (all endpoints implemented with 21 CFR Part 11 compliance, PDF generation, CQS integration) but the frontend is read-only. Users can view demo batch data but cannot create batches, add materials, sign steps, enter QC tests, record environmental readings, report deviations, or release batches. This spec closes all gaps to make the eBMR fully functional.

## Approach: Progressive Entry

Matches real pharmaceutical manufacturing workflow: create batch record at start of production, then operators add materials, sign off steps, QA enters test results, and finally QA releases. Everything happens progressively over hours/days, not all at once.

---

## 1. Batch Creation Page

**Route:** `/seller/batches/new`

**Form fields:**
- Product — dropdown of manufacturer's DRAP-registered products (fetched from `/api/sellers/{mfr_id}/profile`)
- Batch Number — text input with auto-suggestion pattern (e.g., `LHR-2026-XXXX`)
- Manufacture Date — date picker
- Expiry Date — date picker (auto-calculated from shelf life when product selected)
- Batch Size — number input + unit label (from product dosage form)
- Shelf Life (months) — number input (pre-filled from product if available)
- Yield Theoretical — number input (defaults to batch size)

**On submit:** POST `/api/batches` → creates batch in `IN_PROGRESS` status → redirect to `/seller/batches/{id}`

---

## 2. Batch Detail — Progressive Data Entry

Existing batch detail page (`/seller/batches/[id]`) upgraded from read-only to interactive.

### Tab 1: Bill of Materials

- Inline form row at bottom of table: Material Type (API/Excipient dropdown), Material Name, Supplier Name, Lot No., Quantity Used, Unit (g/kg/ml dropdown), Supplier CoA Ref
- "Add Material" button appends to table and POSTs to `/api/batches/[id]/materials`
- Each row gets delete (X) button (only while batch IN_PROGRESS)
- Locked when batch is QA_REVIEW, RELEASED, or REJECTED

### Tab 2: Manufacturing Steps

- "Add Step" button opens inline form: Step Number (auto-incremented), Description, Equipment ID, Process Parameters (key-value pairs)
- POST to `/api/batches/[id]/steps` (new endpoint)
- Each unsigned step row shows "Sign Step" button → opens 21 CFR Part 11 signing modal
- PUT to `/api/batches/[id]/steps/[stepNo]` for signing
- Signed steps: green checkmark, signer name, timestamp, hash — locked from editing

### Tab 3: QC Tests (Template-Based)

- "Load Product Template" button auto-populates required tests from `product_qc_templates`
- Each test row: pre-filled name/method/spec, editable result field + Pass/Fail toggle
- "Add Custom Test" button for ad-hoc tests (full form: name, method, spec, result, unit)
- Analyst name auto-filled from logged-in user
- Save individual results as entered → POST to `/api/batches/[id]/qc-tests`

### Tab 4: Environmental Monitoring

- Collapsible form at top: Production Area (text), Timestamp (defaults to now), Temperature (°C), Humidity (%), Differential Pressure (Pa), Within Spec (checkbox, auto-calculated), Notes
- "Add Reading" button → POST to `/api/batches/[id]/environmental`
- Out-of-spec readings auto-highlighted in red with prompt to file deviation

### Tab 5: Deviations (Tracked Lifecycle)

- "Report Deviation" button opens form: Description, Severity (Critical/Major/Minor), Affected Step (optional), CAPA Reference
- Creates deviation in OPEN status → POST to `/api/batches/[id]/deviations`
- Status lifecycle: OPEN → INVESTIGATING → RESOLVED → CLOSED
- Each transition signed with 21 CFR Part 11 modal
- Expandable rows showing: investigation notes, resolution notes, status history
- Critical deviation auto-changes batch to QUARANTINE
- Timer showing days open per deviation

### Tab 6: E-Signatures (Unchanged)

- Read-only audit trail of all signatures
- Auto-updates as steps are signed and batch is released

---

## 3. 21 CFR Part 11 Signing Modal

Reusable component for step signing, batch release, and deviation status changes.

**Props:** `action` (label), `batchRef`, `onConfirm(password, meaning)`, `onCancel`

**Modal content:**
- Header: "ELECTRONIC SIGNATURE — 21 CFR Part 11"
- Action being signed (e.g., "Sign Manufacturing Step 3")
- Batch reference
- Signer full name (read-only, from auth)
- Role (read-only)
- Date/time (live, updating every second)
- Signature meaning textarea (smart defaults based on action type)
- Password field (re-entry required)
- Compliance checkbox: "I understand this creates a legally binding electronic signature equivalent to a handwritten signature"
- Cancel + Sign & Confirm buttons
- Footer: "SHA-256 hash will be computed at moment of signing"

**Behavior:**
- Confirm disabled until: meaning + password + checkbox all filled
- Server validates password → returns success or error
- Error: red border on password, "Incorrect password", attempt counter
- Success: green flash → modal closes → element updates in place
- Smart defaults for meaning: "Completed [step] as [role]", "Approved for release as QA Manager", "Investigated and resolved deviation"

---

## 4. Batch Release

**Button in batch detail header** (visible when IN_PROGRESS and conditions met).

**Pre-release validation checklist displayed in modal:**
- [ ] At least 1 material added
- [ ] At least 1 step added and all steps signed
- [ ] All required QC tests from template entered
- [ ] All QC test results PASS
- [ ] No OPEN Critical or Major deviations
- [ ] At least 1 environmental reading recorded

Items that fail show red with explanation. Release button disabled until all green.

**On confirm:** POST `/api/batches/[id]/release` with password + meaning → batch RELEASED → CoA auto-generated → redirect to CoA viewer.

---

## 5. Database Changes

### New table: `product_qc_templates`

```sql
CREATE TABLE product_qc_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  test_name VARCHAR(255) NOT NULL,
  method_reference VARCHAR(255),
  specification VARCHAR(255),
  result_unit VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_qc_templates_product ON product_qc_templates(product_id, sort_order);
```

**Seed data:** Standard pharma QC tests per dosage form (tablets: Assay, Dissolution, Related Substances, Microbial Limits, Content Uniformity, Hardness, Friability, Disintegration; capsules: similar with dissolution variant).

### New API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `POST /api/batches/[id]/materials` | POST | Add material to existing batch |
| `DELETE /api/batches/[id]/materials/[materialId]` | DELETE | Remove material |
| `POST /api/batches/[id]/steps` | POST | Add manufacturing step |
| `POST /api/batches/[id]/deviations` | POST | Report deviation |
| `PUT /api/batches/[id]/deviations/[devId]` | PUT | Update deviation status (with signing) |
| `GET /api/products/[id]/qc-templates` | GET | Get QC test templates for product |

---

## 6. Business Rules

### Batch Lifecycle

| Status | Materials | Steps | QC Tests | Environmental | Deviations | Release |
|---|---|---|---|---|---|---|
| IN_PROGRESS | Add/Delete | Add/Sign | Add/Edit | Add | Report/Investigate | Available (if valid) |
| QA_REVIEW | Read-only | Read-only | Add/Edit | Add | Report/Investigate | Available (if valid) |
| QUARANTINE | Read-only | Read-only | Read-only | Read-only | Resolve required | Blocked |
| RELEASED | Read-only | Read-only | Read-only | Read-only | Read-only | Done |
| REJECTED | Read-only | Read-only | Read-only | Read-only | Read-only | Blocked |

### Deviation Impact

- Filing Critical deviation → batch auto-changes to QUARANTINE
- Cannot release while Critical/Major deviations OPEN
- Resolving all deviations → batch returns to IN_PROGRESS
- Deviation count and severity affect CQS score

---

## 7. Files to Create/Modify

**New files:**
- `src/app/seller/batches/new/page.tsx` — batch creation form
- `src/components/SignatureModal.tsx` — reusable 21 CFR Part 11 modal
- `src/app/api/batches/[id]/materials/route.ts` — add materials
- `src/app/api/batches/[id]/materials/[materialId]/route.ts` — delete material
- `src/app/api/batches/[id]/steps/route.ts` — add steps
- `src/app/api/batches/[id]/deviations/route.ts` — deviations CRUD
- `src/app/api/batches/[id]/deviations/[devId]/route.ts` — deviation status update
- `src/app/api/products/[id]/qc-templates/route.ts` — QC templates
- `scripts/schema-qc-templates.sql` — new table + seed data

**Modified files:**
- `src/app/seller/batches/[id]/page.tsx` — add forms to all tabs + release button
- `src/app/seller/batches/page.tsx` — fix "New batch" link

---

## 8. Verification

- Create a new batch via the form
- Add 3+ materials via BOM tab
- Add 5 manufacturing steps via Steps tab
- Sign each step with password re-entry (verify hash generated)
- Load QC test template, fill in results
- Add 2 environmental readings
- Report a Minor deviation, resolve it through lifecycle
- Release batch with signing ceremony
- Verify CoA PDF generated with all data
- Verify CQS recalculated
- Run E2E tests: all 67 existing + new batch flow tests pass
