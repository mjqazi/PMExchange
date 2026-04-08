-- ============================================================
-- PMX Prototype: QC Templates Table + Deviations Schema Updates
-- Run: sudo -u postgres psql -d pmx_prototype -f scripts/schema-qc-templates.sql
-- ============================================================

-- ============================================================
-- 1. product_qc_templates table
-- ============================================================

CREATE TABLE IF NOT EXISTS product_qc_templates (
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
CREATE INDEX IF NOT EXISTS idx_qc_templates_product ON product_qc_templates(product_id, sort_order);

-- ============================================================
-- 2. Add missing columns to batch_deviations for lifecycle
-- ============================================================

-- Status lifecycle: OPEN -> INVESTIGATING -> RESOLVED -> CLOSED
ALTER TABLE batch_deviations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'OPEN';
ALTER TABLE batch_deviations ADD COLUMN IF NOT EXISTS affected_step_id UUID REFERENCES batch_steps(id);
ALTER TABLE batch_deviations ADD COLUMN IF NOT EXISTS investigation_notes TEXT;
-- 21 CFR Part 11 signature fields for deviation status transitions
ALTER TABLE batch_deviations ADD COLUMN IF NOT EXISTS signed_by UUID REFERENCES users(id);
ALTER TABLE batch_deviations ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE batch_deviations ADD COLUMN IF NOT EXISTS signer_full_name VARCHAR(255);
ALTER TABLE batch_deviations ADD COLUMN IF NOT EXISTS signature_meaning VARCHAR(500);
ALTER TABLE batch_deviations ADD COLUMN IF NOT EXISTS signature_hash VARCHAR(128);

-- Set existing deviations without status to OPEN
UPDATE batch_deviations SET status = 'OPEN' WHERE status IS NULL;

-- ============================================================
-- 3. Seed QC templates for Lahore Generics products
-- ============================================================

-- Product IDs (from seed-demo.sql):
-- Metformin 500mg Tablet   : 72e9d0cf-331d-460d-9641-1839676d50a9
-- Atorvastatin 40mg Tablet : b3e60c44-0959-48b4-a5c4-845cb10b423b
-- Ciprofloxacin 500mg Tab  : 2ee1be63-4d6b-4646-b17d-1dddbe56edc5
-- Amoxicillin 250mg Cap    : 48fffb84-2a84-492f-90e3-0bf03f07ad9c

-- Clear existing templates if re-running
DELETE FROM product_qc_templates WHERE product_id IN (
  '72e9d0cf-331d-460d-9641-1839676d50a9',
  'b3e60c44-0959-48b4-a5c4-845cb10b423b',
  '2ee1be63-4d6b-4646-b17d-1dddbe56edc5',
  '48fffb84-2a84-492f-90e3-0bf03f07ad9c'
);

-- ── Metformin 500mg Tablet (Tablet tests) ──
INSERT INTO product_qc_templates (product_id, test_name, method_reference, specification, result_unit, sort_order, required) VALUES
  ('72e9d0cf-331d-460d-9641-1839676d50a9', 'Assay (HPLC)',          'USP <621>',   '95.0% - 105.0% of label claim', '%',    1, true),
  ('72e9d0cf-331d-460d-9641-1839676d50a9', 'Dissolution',           'USP <711>',   'NLT 80% (Q) in 30 minutes',     '%',    2, true),
  ('72e9d0cf-331d-460d-9641-1839676d50a9', 'Related Substances',    'USP <621>',   'Any individual impurity NMT 0.2%, Total NMT 0.5%', '%', 3, true),
  ('72e9d0cf-331d-460d-9641-1839676d50a9', 'Microbial Limits',      'USP <61>',    'TAMC NMT 1000 CFU/g, TYMC NMT 100 CFU/g', 'CFU/g', 4, true),
  ('72e9d0cf-331d-460d-9641-1839676d50a9', 'Content Uniformity',    'USP <905>',   'AV NMT 15.0',                   'AV',   5, true),
  ('72e9d0cf-331d-460d-9641-1839676d50a9', 'Hardness',              'USP <1217>',  '80 - 180 N',                    'N',    6, true),
  ('72e9d0cf-331d-460d-9641-1839676d50a9', 'Friability',            'USP <1216>',  'NMT 1.0% weight loss',          '%',    7, true),
  ('72e9d0cf-331d-460d-9641-1839676d50a9', 'Disintegration',        'USP <701>',   'NMT 30 minutes',               'min',   8, true);

-- ── Atorvastatin 40mg Tablet (Tablet tests) ──
INSERT INTO product_qc_templates (product_id, test_name, method_reference, specification, result_unit, sort_order, required) VALUES
  ('b3e60c44-0959-48b4-a5c4-845cb10b423b', 'Assay (HPLC)',          'USP <621>',   '90.0% - 110.0% of label claim', '%',    1, true),
  ('b3e60c44-0959-48b4-a5c4-845cb10b423b', 'Dissolution',           'USP <711>',   'NLT 80% (Q) in 30 minutes',     '%',    2, true),
  ('b3e60c44-0959-48b4-a5c4-845cb10b423b', 'Related Substances',    'USP <621>',   'Any individual impurity NMT 0.3%, Total NMT 1.0%', '%', 3, true),
  ('b3e60c44-0959-48b4-a5c4-845cb10b423b', 'Microbial Limits',      'USP <61>',    'TAMC NMT 1000 CFU/g, TYMC NMT 100 CFU/g', 'CFU/g', 4, true),
  ('b3e60c44-0959-48b4-a5c4-845cb10b423b', 'Content Uniformity',    'USP <905>',   'AV NMT 15.0',                   'AV',   5, true),
  ('b3e60c44-0959-48b4-a5c4-845cb10b423b', 'Hardness',              'USP <1217>',  '40 - 120 N',                    'N',    6, true),
  ('b3e60c44-0959-48b4-a5c4-845cb10b423b', 'Friability',            'USP <1216>',  'NMT 1.0% weight loss',          '%',    7, true),
  ('b3e60c44-0959-48b4-a5c4-845cb10b423b', 'Disintegration',        'USP <701>',   'NMT 15 minutes',               'min',   8, true);

-- ── Ciprofloxacin 500mg Tablet (Tablet tests) ──
INSERT INTO product_qc_templates (product_id, test_name, method_reference, specification, result_unit, sort_order, required) VALUES
  ('2ee1be63-4d6b-4646-b17d-1dddbe56edc5', 'Assay (HPLC)',          'USP <621>',   '90.0% - 110.0% of label claim', '%',    1, true),
  ('2ee1be63-4d6b-4646-b17d-1dddbe56edc5', 'Dissolution',           'USP <711>',   'NLT 80% (Q) in 30 minutes',     '%',    2, true),
  ('2ee1be63-4d6b-4646-b17d-1dddbe56edc5', 'Related Substances',    'USP <621>',   'Any individual impurity NMT 0.2%, Total NMT 0.5%', '%', 3, true),
  ('2ee1be63-4d6b-4646-b17d-1dddbe56edc5', 'Microbial Limits',      'USP <61>',    'TAMC NMT 1000 CFU/g, TYMC NMT 100 CFU/g', 'CFU/g', 4, true),
  ('2ee1be63-4d6b-4646-b17d-1dddbe56edc5', 'Content Uniformity',    'USP <905>',   'AV NMT 15.0',                   'AV',   5, true),
  ('2ee1be63-4d6b-4646-b17d-1dddbe56edc5', 'Hardness',              'USP <1217>',  '60 - 150 N',                    'N',    6, true),
  ('2ee1be63-4d6b-4646-b17d-1dddbe56edc5', 'Friability',            'USP <1216>',  'NMT 1.0% weight loss',          '%',    7, true),
  ('2ee1be63-4d6b-4646-b17d-1dddbe56edc5', 'Disintegration',        'USP <701>',   'NMT 30 minutes',               'min',   8, true);

-- ── Amoxicillin 250mg Capsule (Capsule tests) ──
INSERT INTO product_qc_templates (product_id, test_name, method_reference, specification, result_unit, sort_order, required) VALUES
  ('48fffb84-2a84-492f-90e3-0bf03f07ad9c', 'Assay (HPLC)',          'USP <621>',   '90.0% - 120.0% of label claim', '%',    1, true),
  ('48fffb84-2a84-492f-90e3-0bf03f07ad9c', 'Dissolution',           'USP <711>',   'NLT 80% (Q) in 60 minutes',     '%',    2, true),
  ('48fffb84-2a84-492f-90e3-0bf03f07ad9c', 'Related Substances',    'USP <621>',   'Any individual impurity NMT 0.5%, Total NMT 2.0%', '%', 3, true),
  ('48fffb84-2a84-492f-90e3-0bf03f07ad9c', 'Microbial Limits',      'USP <61>',    'TAMC NMT 1000 CFU/g, TYMC NMT 100 CFU/g', 'CFU/g', 4, true),
  ('48fffb84-2a84-492f-90e3-0bf03f07ad9c', 'Content Uniformity',    'USP <905>',   'AV NMT 15.0',                   'AV',   5, true),
  ('48fffb84-2a84-492f-90e3-0bf03f07ad9c', 'Moisture Content',      'USP <921>',   'NMT 4.0%',                     '%',    6, true);

-- Verify
SELECT p.inn_name, p.strength, p.dosage_form, COUNT(t.id) as template_count
FROM products p
LEFT JOIN product_qc_templates t ON t.product_id = p.id
WHERE p.manufacturer_id = 'a1b2c3d4-0000-0000-0000-000000000001'
GROUP BY p.id, p.inn_name, p.strength, p.dosage_form
ORDER BY p.inn_name;
