-- ============================================================
-- PMX Prototype: Comprehensive Demo Data Seed
-- Generated 2026-04-05
-- ============================================================
-- Run with:  sudo -u postgres psql -d pmx_prototype -f scripts/seed-demo.sql
-- ============================================================

BEGIN;

-- ============================================================
-- Product IDs (looked up from live DB)
-- ============================================================
-- Metformin 500mg Tablet   : 72e9d0cf-331d-460d-9641-1839676d50a9
-- Atorvastatin 40mg Tablet : b3e60c44-0959-48b4-a5c4-845cb10b423b
-- Ciprofloxacin 500mg Tab  : 2ee1be63-4d6b-4646-b17d-1dddbe56edc5
-- Amoxicillin 250mg Cap    : 48fffb84-2a84-492f-90e3-0bf03f07ad9c

-- Manufacturer: Lahore Generics = a1b2c3d4-0000-0000-0000-000000000001
-- Manufacturer: Karachi PharmaCorp = a1b2c3d4-0000-0000-0000-000000000002
-- Manufacturer: Faisalabad Meds = a1b2c3d4-0000-0000-0000-000000000004

-- Buyer: Gulf Medical = b1b2c3d4-0000-0000-0000-000000000001
-- Buyer: Al-Zahrawi   = b1b2c3d4-0000-0000-0000-000000000002

-- Users:
--   Ali Hassan (SELLER_ADMIN) : c1000000-0000-0000-0000-000000000001
--   Dr. Farrukh (SELLER_QA)   : c1000000-0000-0000-0000-000000000002
--   Tariq Mahmood (OPS)       : c1000000-0000-0000-0000-000000000003
--   Khalid (BUYER_ADMIN)      : c2000000-0000-0000-0000-000000000001
--   Nasir (PMX_ADMIN)         : c9000000-0000-0000-0000-000000000001


-- ============================================================
-- 1. BATCHES (4 for Lahore Generics)
-- ============================================================

INSERT INTO batches (id, manufacturer_id, product_id, batch_no, manufacture_date, expiry_date, shelf_life_months, batch_size, yield_actual, yield_theoretical, yield_variance_pct, status, qc_released_by, qc_released_at, qc_signature_hash)
VALUES
  -- d1..01: Metformin 500mg, RELEASED
  ('d1000000-0000-0000-0000-000000000001',
   'a1b2c3d4-0000-0000-0000-000000000001',
   '72e9d0cf-331d-460d-9641-1839676d50a9',
   'LHR-2026-0031', '2026-04-01', '2028-03-31', 24,
   200000, 197840, 200000, -1.080,
   'RELEASED',
   'c1000000-0000-0000-0000-000000000002',
   '2026-04-03 14:30:00+05',
   'sha256:a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'),

  -- d1..02: Atorvastatin 40mg, IN_PROGRESS
  ('d1000000-0000-0000-0000-000000000002',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'b3e60c44-0959-48b4-a5c4-845cb10b423b',
   'LHR-2026-0030', '2026-03-28', '2028-03-27', 24,
   150000, NULL, 150000, NULL,
   'IN_PROGRESS',
   NULL, NULL, NULL),

  -- d1..03: Ciprofloxacin 500mg, RELEASED
  ('d1000000-0000-0000-0000-000000000003',
   'a1b2c3d4-0000-0000-0000-000000000001',
   '2ee1be63-4d6b-4646-b17d-1dddbe56edc5',
   'LHR-2026-0029', '2026-03-22', '2028-03-21', 24,
   300000, 296100, 300000, -1.300,
   'RELEASED',
   'c1000000-0000-0000-0000-000000000002',
   '2026-03-26 10:15:00+05',
   'sha256:b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b200'),

  -- d1..04: Amoxicillin 250mg, QUARANTINE
  ('d1000000-0000-0000-0000-000000000004',
   'a1b2c3d4-0000-0000-0000-000000000001',
   '48fffb84-2a84-492f-90e3-0bf03f07ad9c',
   'LHR-2026-0028', '2026-03-18', '2028-03-17', 24,
   500000, 488200, 500000, -2.360,
   'QUARANTINE',
   NULL, NULL, NULL);


-- ============================================================
-- 2. BATCH MATERIALS (4 for batch d1..01 Metformin)
-- ============================================================

INSERT INTO batch_materials (id, batch_id, material_type, material_name, supplier_name, lot_no, quantity_used, unit, supplier_coa_ref)
VALUES
  ('d1100000-0000-0000-0000-000000000001',
   'd1000000-0000-0000-0000-000000000001',
   'API', 'Metformin HCl', 'Zhejiang Huahai Pharmaceutical', 'ZH-MET-2026-044',
   130.0000, 'kg', 'COA-ZH-2026-044'),

  ('d1100000-0000-0000-0000-000000000002',
   'd1000000-0000-0000-0000-000000000001',
   'Excipient', 'Povidone K30', 'BASF SE', 'BASF-PVP-2025-891',
   12.5000, 'kg', 'COA-BASF-891'),

  ('d1100000-0000-0000-0000-000000000003',
   'd1000000-0000-0000-0000-000000000001',
   'Excipient', 'Magnesium Stearate', 'Peter Greven GmbH', 'PG-MGS-2026-012',
   2.0000, 'kg', 'COA-PG-012'),

  ('d1100000-0000-0000-0000-000000000004',
   'd1000000-0000-0000-0000-000000000001',
   'Excipient', 'Microcrystalline Cellulose PH-102', 'FMC BioPolymer', 'FMC-MCC-2025-334',
   55.5000, 'kg', 'COA-FMC-334');


-- ============================================================
-- 3. BATCH STEPS (5 for batch d1..01, all COMPLETED, signed by Tariq)
-- ============================================================

INSERT INTO batch_steps (id, batch_id, step_no, description, operator_id, equipment_id, process_params, completed_at, status, signed_by, signed_at, signer_full_name, signature_meaning, signature_hash)
VALUES
  ('d1200000-0000-0000-0000-000000000001',
   'd1000000-0000-0000-0000-000000000001',
   1, 'Dispensing & Weighing',
   'c1000000-0000-0000-0000-000000000003', 'BAL-001',
   '{"target_weight_kg": 200.0, "actual_weight_kg": 200.02, "tolerance_pct": 0.5}',
   '2026-04-01 08:30:00+05', 'COMPLETED',
   'c1000000-0000-0000-0000-000000000003', '2026-04-01 08:35:00+05',
   'Tariq Mahmood', 'I have performed this step per SOP-DIS-001', 'sha256:step1hash0001'),

  ('d1200000-0000-0000-0000-000000000002',
   'd1000000-0000-0000-0000-000000000001',
   2, 'Dry Mixing (20 min, 25 RPM)',
   'c1000000-0000-0000-0000-000000000003', 'MIX-V200',
   '{"duration_min": 20, "speed_rpm": 25, "mixer_type": "V-blender"}',
   '2026-04-01 09:15:00+05', 'COMPLETED',
   'c1000000-0000-0000-0000-000000000003', '2026-04-01 09:20:00+05',
   'Tariq Mahmood', 'I have performed this step per SOP-MIX-003', 'sha256:step2hash0002'),

  ('d1200000-0000-0000-0000-000000000003',
   'd1000000-0000-0000-0000-000000000001',
   3, 'Wet Granulation',
   'c1000000-0000-0000-0000-000000000003', 'GRAN-HSM-01',
   '{"binder_solution_pct": 5.0, "impeller_rpm": 150, "chopper_rpm": 1500, "granulation_time_min": 8}',
   '2026-04-01 10:45:00+05', 'COMPLETED',
   'c1000000-0000-0000-0000-000000000003', '2026-04-01 10:50:00+05',
   'Tariq Mahmood', 'I have performed this step per SOP-GRAN-002', 'sha256:step3hash0003'),

  ('d1200000-0000-0000-0000-000000000004',
   'd1000000-0000-0000-0000-000000000001',
   4, 'Compression (Rotary Press)',
   'c1000000-0000-0000-0000-000000000003', 'TAB-PRESS-45',
   '{"compression_force_kn": 12.5, "turret_rpm": 35, "tablet_weight_mg": 650, "hardness_kp": 8.5}',
   '2026-04-01 15:30:00+05', 'COMPLETED',
   'c1000000-0000-0000-0000-000000000003', '2026-04-01 15:35:00+05',
   'Tariq Mahmood', 'I have performed this step per SOP-COMP-005', 'sha256:step4hash0004'),

  ('d1200000-0000-0000-0000-000000000005',
   'd1000000-0000-0000-0000-000000000001',
   5, 'Film Coating',
   'c1000000-0000-0000-0000-000000000003', 'COAT-BPC-60',
   '{"coating_solution": "Opadry II White", "inlet_temp_c": 55, "spray_rate_ml_min": 12, "pan_rpm": 8}',
   '2026-04-02 11:00:00+05', 'COMPLETED',
   'c1000000-0000-0000-0000-000000000003', '2026-04-02 11:05:00+05',
   'Tariq Mahmood', 'I have performed this step per SOP-COAT-001', 'sha256:step5hash0005');


-- ============================================================
-- 4. QC TESTS (4 for batch d1..01, all PASS)
-- ============================================================

INSERT INTO batch_qc_tests (id, batch_id, test_name, method_reference, specification, result_value, result_unit, pass_fail, analyst_id, tested_at, notes)
VALUES
  ('d1300000-0000-0000-0000-000000000001',
   'd1000000-0000-0000-0000-000000000001',
   'Assay (Metformin HCl)', 'USP <621> HPLC',
   '95.0 - 105.0% of label claim', '99.2', '%', 'PASS',
   'c1000000-0000-0000-0000-000000000002',
   '2026-04-02 14:00:00+05',
   'Within specification. RSD 0.3%.'),

  ('d1300000-0000-0000-0000-000000000002',
   'd1000000-0000-0000-0000-000000000001',
   'Dissolution (Q=30 min)', 'USP <711>',
   'NLT 80% (Q) in 30 minutes', '92', '%', 'PASS',
   'c1000000-0000-0000-0000-000000000002',
   '2026-04-02 15:30:00+05',
   'All 6 units passed. Mean 92%, range 88-95%.'),

  ('d1300000-0000-0000-0000-000000000003',
   'd1000000-0000-0000-0000-000000000001',
   'Content Uniformity', 'USP <905>',
   'AV <= 15.0', '4.8', 'AV', 'PASS',
   'c1000000-0000-0000-0000-000000000002',
   '2026-04-02 16:45:00+05',
   '10 units tested. AV = 4.8.'),

  ('d1300000-0000-0000-0000-000000000004',
   'd1000000-0000-0000-0000-000000000001',
   'Microbial Limits', 'USP <61>/<62>',
   'TAMC < 1000 CFU/g, TYMC < 100 CFU/g', '<10 / <10', 'CFU/g', 'PASS',
   'c1000000-0000-0000-0000-000000000002',
   '2026-04-03 09:00:00+05',
   'No pathogens detected. E.coli absent.');


-- ============================================================
-- 5. ENVIRONMENTAL READINGS (3 for batch d1..01)
-- ============================================================

INSERT INTO batch_environmental (id, batch_id, step_id, production_area, recorded_at, temperature_c, humidity_pct, differential_pressure_pa, within_spec, notes, recorded_by)
VALUES
  ('d1400000-0000-0000-0000-000000000001',
   'd1000000-0000-0000-0000-000000000001',
   'd1200000-0000-0000-0000-000000000001',
   'Dispensing Room A-101',
   '2026-04-01 08:00:00+05',
   22.50, 42.00, 15.00, true,
   'Pre-production environmental check',
   'c1000000-0000-0000-0000-000000000003'),

  ('d1400000-0000-0000-0000-000000000002',
   'd1000000-0000-0000-0000-000000000001',
   'd1200000-0000-0000-0000-000000000003',
   'Granulation Suite B-201',
   '2026-04-01 10:00:00+05',
   23.10, 44.50, 12.50, true,
   'In-process environmental monitoring',
   'c1000000-0000-0000-0000-000000000003'),

  ('d1400000-0000-0000-0000-000000000003',
   'd1000000-0000-0000-0000-000000000001',
   'd1200000-0000-0000-0000-000000000004',
   'Compression Room C-301',
   '2026-04-01 14:00:00+05',
   21.80, 38.20, 18.00, true,
   'Compression area clean-room conditions verified',
   'c1000000-0000-0000-0000-000000000003');


-- ============================================================
-- 6. DEVIATION (1 for batch d1..04 - Amoxicillin QUARANTINE)
-- ============================================================

INSERT INTO batch_deviations (id, batch_id, description, severity, capa_ref, reported_by, reported_at, closed_at, resolution)
VALUES
  ('d1500000-0000-0000-0000-000000000001',
   'd1000000-0000-0000-0000-000000000004',
   'Dissolution test failure: 4 of 6 units failed S1 stage (<80% at Q=30 min). Mean dissolution 72%. Capsule shell integrity suspect - possible moisture ingress during storage of empty capsules.',
   'MAJOR',
   'CAPA-2026-017',
   'c1000000-0000-0000-0000-000000000002',
   '2026-03-20 11:00:00+05',
   NULL,
   NULL);


-- ============================================================
-- 7. CoAs (2 for released batches)
-- ============================================================

INSERT INTO coas (id, batch_id, coa_ref_no, generated_at, generated_by, pdf_path, qr_code_payload, sha256_hash, status)
VALUES
  ('d4000000-0000-0000-0000-000000000001',
   'd1000000-0000-0000-0000-000000000001',
   'COA-LHR-2026-0031',
   '2026-04-03 15:00:00+05',
   'c1000000-0000-0000-0000-000000000002',
   '/documents/coas/COA-LHR-2026-0031.pdf',
   'https://pmx.pk/verify/COA-LHR-2026-0031',
   'sha256:coa1a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
   'ISSUED'),

  ('d4000000-0000-0000-0000-000000000002',
   'd1000000-0000-0000-0000-000000000003',
   'COA-LHR-2026-0029',
   '2026-03-26 11:00:00+05',
   'c1000000-0000-0000-0000-000000000002',
   '/documents/coas/COA-LHR-2026-0029.pdf',
   'https://pmx.pk/verify/COA-LHR-2026-0029',
   'sha256:coa2b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f600',
   'ISSUED');


-- ============================================================
-- 8. DRAP DOCUMENTS (4 for Lahore Generics)
-- ============================================================

INSERT INTO drap_documents (id, manufacturer_id, doc_type, product_id, destination_country, doc_ref, pdf_path, sha256_hash, generated_at, generated_by, valid_until)
VALUES
  ('d1600000-0000-0000-0000-000000000001',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'CPP',
   '72e9d0cf-331d-460d-9641-1839676d50a9',
   'Saudi Arabia',
   'DRAP-CPP-2026-0091',
   '/documents/drap/DRAP-CPP-2026-0091.pdf',
   'sha256:drap1cpp0091',
   '2026-03-15 10:00:00+05',
   'c1000000-0000-0000-0000-000000000001',
   '2027-03-15'),

  ('d1600000-0000-0000-0000-000000000002',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'GMP_Certificate',
   NULL,
   NULL,
   'DRAP-GMP-2026-0042',
   '/documents/drap/DRAP-GMP-2026-0042.pdf',
   'sha256:drap2gmp0042',
   '2026-01-10 09:00:00+05',
   'c1000000-0000-0000-0000-000000000001',
   '2028-01-10'),

  ('d1600000-0000-0000-0000-000000000003',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Free_Sale_Certificate',
   '72e9d0cf-331d-460d-9641-1839676d50a9',
   'Kenya',
   'DRAP-FSC-2026-0033',
   '/documents/drap/DRAP-FSC-2026-0033.pdf',
   'sha256:drap3fsc0033',
   '2026-02-20 11:00:00+05',
   'c1000000-0000-0000-0000-000000000001',
   '2027-02-20'),

  ('d1600000-0000-0000-0000-000000000004',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'CoA_Export',
   '48fffb84-2a84-492f-90e3-0bf03f07ad9c',
   'UAE',
   'DRAP-COA-2026-0019',
   '/documents/drap/DRAP-COA-2026-0019.pdf',
   'sha256:drap4coa0019',
   '2026-03-01 14:00:00+05',
   'c1000000-0000-0000-0000-000000000001',
   '2027-03-01');


-- ============================================================
-- 9. RFQs (3 published from buyers)
-- ============================================================

INSERT INTO rfqs (id, buyer_id, rfq_type, product_inn, product_strength, product_form, volume_qty, volume_unit, order_frequency, required_certs, destination_country, incoterms, lead_time_days, price_min_usd, price_max_usd, payment_terms, status, expires_at, created_at)
VALUES
  -- RFQ 001: Metformin 500mg, Saudi Arabia, 5M tabs, Gulf Medical
  ('d2000000-0000-0000-0000-000000000001',
   'b1b2c3d4-0000-0000-0000-000000000001',
   'RFQ',
   'Metformin Hydrochloride', '500mg', 'Tablet',
   5000000, 'tablets', 'Quarterly',
   ARRAY['WHO-GMP', 'SFDA'],
   'Saudi Arabia', 'CIF Jeddah', 90,
   0.025000, 0.035000,
   'PSO Escrow',
   'PUBLISHED',
   '2026-05-15 23:59:59+05',
   '2026-03-20 09:00:00+05'),

  -- RFQ 002: Amoxicillin 250mg, Kenya, 10M caps, Gulf Medical
  ('d2000000-0000-0000-0000-000000000002',
   'b1b2c3d4-0000-0000-0000-000000000001',
   'RFQ',
   'Amoxicillin', '250mg', 'Capsule',
   10000000, 'capsules', 'Bi-annual',
   ARRAY['WHO-GMP'],
   'Kenya', 'CIF Mombasa', 120,
   0.015000, 0.025000,
   'PSO Escrow',
   'PUBLISHED',
   '2026-06-01 23:59:59+05',
   '2026-03-25 11:00:00+05'),

  -- RFQ 003: Atorvastatin 40mg, UAE, 2M tabs, Al-Zahrawi
  ('d2000000-0000-0000-0000-000000000003',
   'b1b2c3d4-0000-0000-0000-000000000002',
   'RFQ',
   'Atorvastatin', '40mg', 'Tablet',
   2000000, 'tablets', 'One-time',
   ARRAY['WHO-GMP', 'SFDA'],
   'UAE', 'FOB Karachi', 60,
   0.040000, 0.060000,
   'PSO Escrow',
   'PUBLISHED',
   '2026-05-01 23:59:59+05',
   '2026-03-28 14:00:00+05');


-- ============================================================
-- 10. ORDERS (2)
-- ============================================================

-- Order 1: Metformin, Gulf Medical -> Lahore Generics, IN_PRODUCTION
INSERT INTO orders (id, rfq_id, buyer_id, seller_id, product_id, quantity, agreed_price_usd, pmx_commission_usd, status, contract_ref, contract_hash, contract_signed_buyer_at, contract_signed_seller_at, escrow_account_ref, escrow_status, escrow_funded_at, created_at, updated_at)
VALUES
  ('d3000000-0000-0000-0000-000000000001',
   'd2000000-0000-0000-0000-000000000001',
   'b1b2c3d4-0000-0000-0000-000000000001',
   'a1b2c3d4-0000-0000-0000-000000000001',
   '72e9d0cf-331d-460d-9641-1839676d50a9',
   5000000,
   148000.000000,
   4440.00,
   'IN_PRODUCTION',
   'PMX-ORD-2026-00001',
   'sha256:contract001hash',
   '2026-03-25 10:00:00+05',
   '2026-03-25 12:00:00+05',
   'ESC-PMX-2026-00001',
   'FUNDED',
   '2026-03-26 09:00:00+05',
   '2026-03-22 10:00:00+05',
   '2026-04-01 08:00:00+05');

-- Order 2: Amoxicillin, Gulf Medical -> Karachi PharmaCorp, NEGOTIATING
INSERT INTO orders (id, rfq_id, buyer_id, seller_id, product_id, quantity, status, created_at, updated_at)
VALUES
  ('d3000000-0000-0000-0000-000000000002',
   'd2000000-0000-0000-0000-000000000002',
   'b1b2c3d4-0000-0000-0000-000000000001',
   'a1b2c3d4-0000-0000-0000-000000000002',
   '48fffb84-2a84-492f-90e3-0bf03f07ad9c',
   10000000,
   'NEGOTIATING',
   '2026-03-30 14:00:00+05',
   '2026-04-04 09:00:00+05');


-- ============================================================
-- 11. ESCROW ACCOUNT (1 for order d3..01)
-- ============================================================

INSERT INTO escrow_accounts (id, order_id, pso_account_ref, amount_usd, funded_at, released_at, release_trigger, status)
VALUES
  ('d5000000-0000-0000-0000-000000000001',
   'd3000000-0000-0000-0000-000000000001',
   'ESC-PMX-2026-00001',
   148000.00,
   '2026-03-26 09:00:00+05',
   NULL,
   NULL,
   'FUNDED');


-- ============================================================
-- 12. MESSAGES (for negotiating order d3..02)
-- ============================================================

INSERT INTO messages (id, order_id, sender_id, sender_role, message_type, content, offer_price_usd, offer_qty, offer_lead_days, offer_incoterms, offer_version, is_current_offer, created_at)
VALUES
  -- Buyer opens negotiation
  ('d6000000-0000-0000-0000-000000000001',
   'd3000000-0000-0000-0000-000000000002',
   'c2000000-0000-0000-0000-000000000001',
   'BUYER_ADMIN',
   'OFFER',
   'We need 10M caps of Amoxicillin 250mg for the Kenyan market. Can you offer CIF Mombasa? Our target is $0.018/cap.',
   0.018000, 10000000, 120, 'CIF Mombasa', 1, false,
   '2026-03-30 14:00:00+05'),

  -- Seller counter-offers
  ('d6000000-0000-0000-0000-000000000002',
   'd3000000-0000-0000-0000-000000000002',
   'c1000000-0000-0000-0000-000000000001',
   'SELLER_ADMIN',
   'COUNTER_OFFER',
   'Thank you for the inquiry. At 10M units CIF Mombasa, our best price is $0.022/cap with 90-day lead time. WHO-GMP certified. We can include stability data.',
   0.022000, 10000000, 90, 'CIF Mombasa', 2, false,
   '2026-03-31 10:30:00+05'),

  -- Buyer responds
  ('d6000000-0000-0000-0000-000000000003',
   'd3000000-0000-0000-0000-000000000002',
   'c2000000-0000-0000-0000-000000000001',
   'BUYER_ADMIN',
   'COUNTER_OFFER',
   'Can you do $0.020/cap if we commit to a bi-annual schedule (20M/year)? We also need KEBS pre-clearance documentation.',
   0.020000, 10000000, 90, 'CIF Mombasa', 3, true,
   '2026-04-02 08:15:00+05'),

  -- Seller message (no price change)
  ('d6000000-0000-0000-0000-000000000004',
   'd3000000-0000-0000-0000-000000000002',
   'c1000000-0000-0000-0000-000000000001',
   'SELLER_ADMIN',
   'MESSAGE',
   'We are reviewing the bi-annual commitment terms internally. Will revert by Thursday with updated pricing.',
   NULL, NULL, NULL, NULL, NULL, false,
   '2026-04-04 09:00:00+05');


-- ============================================================
-- 13. NOTIFICATIONS
-- ============================================================

-- 5 for seller (Ali Hassan - c1..01)
INSERT INTO notifications (id, user_id, type, title, body, link, read, related_entity_type, related_entity_id, created_at)
VALUES
  ('d7000000-0000-0000-0000-000000000001',
   'c1000000-0000-0000-0000-000000000001',
   'RFQ_MATCH_FOUND',
   'New RFQ Match: Metformin 500mg',
   'A buyer in Saudi Arabia is looking for 5,000,000 tablets of Metformin HCl 500mg. Deadline: May 15.',
   '/rfqs/d2000000-0000-0000-0000-000000000001',
   true,
   'rfq', 'd2000000-0000-0000-0000-000000000001',
   '2026-03-20 09:15:00+05'),

  ('d7000000-0000-0000-0000-000000000002',
   'c1000000-0000-0000-0000-000000000001',
   'ESCROW_FUNDED',
   'Escrow Funded: Order PMX-ORD-2026-00001',
   'Gulf Medical Supply has funded $148,000 into escrow for the Metformin order. Production can begin.',
   '/orders/d3000000-0000-0000-0000-000000000001',
   true,
   'order', 'd3000000-0000-0000-0000-000000000001',
   '2026-03-26 09:05:00+05'),

  ('d7000000-0000-0000-0000-000000000003',
   'c1000000-0000-0000-0000-000000000001',
   'BATCH_RELEASED',
   'Batch LHR-2026-0031 Released',
   'Dr. Farrukh Ali has released batch LHR-2026-0031 (Metformin 500mg). CoA is now available.',
   '/batches/d1000000-0000-0000-0000-000000000001',
   false,
   'batch', 'd1000000-0000-0000-0000-000000000001',
   '2026-04-03 14:35:00+05'),

  ('d7000000-0000-0000-0000-000000000004',
   'c1000000-0000-0000-0000-000000000001',
   'DEVIATION_FILED',
   'Deviation Filed: Batch LHR-2026-0028',
   'A MAJOR deviation has been filed for Amoxicillin batch LHR-2026-0028. Dissolution failure. CAPA required.',
   '/batches/d1000000-0000-0000-0000-000000000004',
   false,
   'batch', 'd1000000-0000-0000-0000-000000000004',
   '2026-03-20 11:10:00+05'),

  ('d7000000-0000-0000-0000-000000000005',
   'c1000000-0000-0000-0000-000000000001',
   'NEGOTIATION_MESSAGE',
   'New Message: Amoxicillin Negotiation',
   'Khalid Al-Rashid sent a counter-offer for the Amoxicillin 250mg order. $0.020/cap with bi-annual commitment.',
   '/orders/d3000000-0000-0000-0000-000000000002',
   false,
   'order', 'd3000000-0000-0000-0000-000000000002',
   '2026-04-02 08:20:00+05');

-- 3 for buyer (Khalid - c2..01)
INSERT INTO notifications (id, user_id, type, title, body, link, read, related_entity_type, related_entity_id, created_at)
VALUES
  ('d7000000-0000-0000-0000-000000000006',
   'c2000000-0000-0000-0000-000000000001',
   'RFQ_RESPONSE_RECEIVED',
   'Response to RFQ: Metformin 500mg',
   'Lahore Generics has responded to your Metformin RFQ with a competitive offer. Review the details.',
   '/rfqs/d2000000-0000-0000-0000-000000000001',
   true,
   'rfq', 'd2000000-0000-0000-0000-000000000001',
   '2026-03-21 16:00:00+05'),

  ('d7000000-0000-0000-0000-000000000007',
   'c2000000-0000-0000-0000-000000000001',
   'CONTRACT_GENERATED',
   'Contract Ready: Metformin Order',
   'The contract for your Metformin 500mg order with Lahore Generics is ready for signing.',
   '/orders/d3000000-0000-0000-0000-000000000001',
   true,
   'order', 'd3000000-0000-0000-0000-000000000001',
   '2026-03-24 14:00:00+05'),

  ('d7000000-0000-0000-0000-000000000008',
   'c2000000-0000-0000-0000-000000000001',
   'NEGOTIATION_MESSAGE',
   'Seller Response: Amoxicillin Negotiation',
   'Lahore Generics is reviewing your bi-annual commitment proposal. They will respond by Thursday.',
   '/orders/d3000000-0000-0000-0000-000000000002',
   false,
   'order', 'd3000000-0000-0000-0000-000000000002',
   '2026-04-04 09:05:00+05');

-- 3 for admin (Nasir - c9..01)
INSERT INTO notifications (id, user_id, type, title, body, link, read, related_entity_type, related_entity_id, created_at)
VALUES
  ('d7000000-0000-0000-0000-000000000009',
   'c9000000-0000-0000-0000-000000000001',
   'DEVIATION_FILED',
   'Platform Alert: MAJOR Deviation',
   'Lahore Generics filed a MAJOR deviation on batch LHR-2026-0028 (Amoxicillin 250mg). Review recommended.',
   '/admin/batches/d1000000-0000-0000-0000-000000000004',
   false,
   'batch', 'd1000000-0000-0000-0000-000000000004',
   '2026-03-20 11:15:00+05'),

  ('d7000000-0000-0000-0000-000000000010',
   'c9000000-0000-0000-0000-000000000001',
   'ESCROW_FUNDED',
   'Escrow Activity: $148,000 Funded',
   'Gulf Medical has funded escrow for order PMX-ORD-2026-00001. Metformin 500mg, 5M tablets.',
   '/admin/orders/d3000000-0000-0000-0000-000000000001',
   true,
   'order', 'd3000000-0000-0000-0000-000000000001',
   '2026-03-26 09:10:00+05'),

  ('d7000000-0000-0000-0000-000000000011',
   'c9000000-0000-0000-0000-000000000001',
   'CQS_WARNING',
   'CQS Alert: Lahore Generics Yield Variance',
   'Amoxicillin batch LHR-2026-0028 yield variance of -2.36% flagged. Combined with dissolution deviation, CQS score may be impacted.',
   '/admin/manufacturers/a1b2c3d4-0000-0000-0000-000000000001',
   false,
   'batch', 'd1000000-0000-0000-0000-000000000004',
   '2026-03-21 08:00:00+05');


-- ============================================================
-- 14. SUPPLIER QUALIFICATIONS (4 for Lahore Generics)
-- ============================================================

INSERT INTO supplier_qualifications (id, manufacturer_id, supplier_name, supplier_country, material_type, qualification_status, last_audit_date, next_audit_due, notes)
VALUES
  ('d8000000-0000-0000-0000-000000000001',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Zhejiang Huahai Pharmaceutical',
   'China',
   'API',
   'QUALIFIED',
   '2025-11-15', '2026-11-15',
   'WHO-PQ listed API manufacturer. Metformin HCl, Atorvastatin Ca. Last audit: no critical findings.'),

  ('d8000000-0000-0000-0000-000000000002',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'BASF SE',
   'Germany',
   'Excipient',
   'QUALIFIED',
   '2025-09-20', '2026-09-20',
   'Povidone K30, Kollidon grades. GMP-certified excipient supplier.'),

  ('d8000000-0000-0000-0000-000000000003',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Roquette Frères',
   'France',
   'Excipient',
   'QUALIFIED',
   '2025-08-10', '2026-08-10',
   'Starch 1500, MCC grades. Reliable supply chain.'),

  ('d8000000-0000-0000-0000-000000000004',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'Anhui Sunhere Pharmaceutical',
   'China',
   'API',
   'QUALIFIED',
   '2026-01-22', '2027-01-22',
   'Ciprofloxacin HCl, Amoxicillin Trihydrate. WHO-PQ under review for Amoxicillin.');


-- ============================================================
-- 15. REGULATORY PATHWAY PROGRESS (1: WHO-GMP, IN_PROGRESS)
-- ============================================================

INSERT INTO regulatory_pathway_progress (id, manufacturer_id, pathway, status, steps_total, steps_completed, started_at, assigned_to, notes)
VALUES
  ('d9000000-0000-0000-0000-000000000001',
   'a1b2c3d4-0000-0000-0000-000000000001',
   'WHO_GMP',
   'IN_PROGRESS',
   11, 7,
   '2025-06-01 09:00:00+05',
   'c1000000-0000-0000-0000-000000000001',
   'WHO-GMP certification in progress for Lahore Generics. 7 of 11 steps completed. Target submission Q3 2026.');

-- 11 steps for the WHO-GMP pathway (7 completed, 4 pending)
INSERT INTO regulatory_pathway_steps (id, pathway_progress_id, step_no, step_name, step_description, auto_populated, source_table, source_field, auto_populated_value, manual_value, completed, completed_by, completed_at)
VALUES
  ('d9100000-0000-0000-0000-000000000001',
   'd9000000-0000-0000-0000-000000000001',
   1, 'Site Master File (SMF)',
   'Prepare and submit the Site Master File per WHO format', false, NULL, NULL, NULL,
   'SMF v3.2 submitted 2025-06-15',
   true, 'c1000000-0000-0000-0000-000000000001', '2025-06-15 10:00:00+05'),

  ('d9100000-0000-0000-0000-000000000002',
   'd9000000-0000-0000-0000-000000000001',
   2, 'Quality Manual & SOPs',
   'Complete quality manual and all referenced SOPs', false, NULL, NULL, NULL,
   '142 SOPs reviewed and approved',
   true, 'c1000000-0000-0000-0000-000000000002', '2025-07-20 14:00:00+05'),

  ('d9100000-0000-0000-0000-000000000003',
   'd9000000-0000-0000-0000-000000000001',
   3, 'Equipment Qualification (IQ/OQ/PQ)',
   'Complete qualification for all critical equipment', false, NULL, NULL, NULL,
   'All 23 critical equipment items qualified',
   true, 'c1000000-0000-0000-0000-000000000003', '2025-09-10 16:00:00+05'),

  ('d9100000-0000-0000-0000-000000000004',
   'd9000000-0000-0000-0000-000000000001',
   4, 'Process Validation (3 batches)',
   'Complete 3 consecutive successful validation batches', true, 'batches', 'status',
   '3 validation batches completed (LHR-2025-VAL-001 to 003)',
   NULL,
   true, 'c1000000-0000-0000-0000-000000000002', '2025-11-30 11:00:00+05'),

  ('d9100000-0000-0000-0000-000000000005',
   'd9000000-0000-0000-0000-000000000001',
   5, 'Stability Studies (6-month accelerated)',
   'Complete 6-month accelerated stability per ICH guidelines', false, NULL, NULL, NULL,
   '6-month data available. All parameters within spec.',
   true, 'c1000000-0000-0000-0000-000000000002', '2026-01-15 09:00:00+05'),

  ('d9100000-0000-0000-0000-000000000006',
   'd9000000-0000-0000-0000-000000000001',
   6, 'Water System Validation',
   'Validate purified water and WFI systems', false, NULL, NULL, NULL,
   'PW and WFI systems validated. Phase 3 monitoring ongoing.',
   true, 'c1000000-0000-0000-0000-000000000003', '2025-10-05 15:00:00+05'),

  ('d9100000-0000-0000-0000-000000000007',
   'd9000000-0000-0000-0000-000000000001',
   7, 'HVAC Qualification',
   'Qualify HVAC systems for all production areas', false, NULL, NULL, NULL,
   'All clean rooms qualified. ISO 8 / Grade D confirmed.',
   true, 'c1000000-0000-0000-0000-000000000003', '2025-10-20 12:00:00+05'),

  ('d9100000-0000-0000-0000-000000000008',
   'd9000000-0000-0000-0000-000000000001',
   8, 'Supplier Qualification Dossier',
   'Complete qualification of all API and critical excipient suppliers', true, 'supplier_qualifications', 'qualification_status',
   NULL, NULL,
   false, NULL, NULL),

  ('d9100000-0000-0000-0000-000000000009',
   'd9000000-0000-0000-0000-000000000001',
   9, 'Internal GMP Audit (Mock Inspection)',
   'Conduct full mock WHO-GMP inspection', false, NULL, NULL, NULL, NULL,
   false, NULL, NULL),

  ('d9100000-0000-0000-0000-000000000010',
   'd9000000-0000-0000-0000-000000000001',
   10, 'CAPA Closure for All Open Items',
   'Close all open CAPAs and deviations', false, NULL, NULL, NULL, NULL,
   false, NULL, NULL),

  ('d9100000-0000-0000-0000-000000000011',
   'd9000000-0000-0000-0000-000000000001',
   11, 'WHO Prequalification Application Submission',
   'Compile and submit complete WHO-PQ application package', false, NULL, NULL, NULL, NULL,
   false, NULL, NULL);


-- ============================================================
-- 16. ONBOARDING DOCUMENTS (7 for Faisalabad Meds: 5 verified, 1 under review, 1 not uploaded)
-- ============================================================

INSERT INTO onboarding_documents (id, manufacturer_id, gate, doc_type, doc_label, file_path, file_name, verification_status, verified_by, verified_at, rejection_reason, expiry_date, uploaded_by, uploaded_at)
VALUES
  -- GATE_1: Company Registration (VERIFIED)
  ('da000000-0000-0000-0000-000000000001',
   'a1b2c3d4-0000-0000-0000-000000000004',
   'GATE_1',
   'Company_Registration',
   'SECP Registration Certificate',
   '/onboarding/faisalabad/secp-reg.pdf',
   'secp-reg.pdf',
   'VERIFIED',
   'c9000000-0000-0000-0000-000000000001',
   '2026-03-10 10:00:00+05',
   NULL,
   '2028-12-31',
   'c1000000-0000-0000-0000-000000000001',
   '2026-03-08 09:00:00+05'),

  -- GATE_1: Tax Registration (VERIFIED)
  ('da000000-0000-0000-0000-000000000002',
   'a1b2c3d4-0000-0000-0000-000000000004',
   'GATE_1',
   'Tax_Registration',
   'NTN / FBR Registration',
   '/onboarding/faisalabad/ntn-cert.pdf',
   'ntn-cert.pdf',
   'VERIFIED',
   'c9000000-0000-0000-0000-000000000001',
   '2026-03-10 10:05:00+05',
   NULL,
   NULL,
   'c1000000-0000-0000-0000-000000000001',
   '2026-03-08 09:05:00+05'),

  -- GATE_2: Drug Manufacturing License (VERIFIED)
  ('da000000-0000-0000-0000-000000000003',
   'a1b2c3d4-0000-0000-0000-000000000004',
   'GATE_2',
   'Drug_Manufacturing_License',
   'DRAP Manufacturing License',
   '/onboarding/faisalabad/drap-ml.pdf',
   'drap-ml.pdf',
   'VERIFIED',
   'c9000000-0000-0000-0000-000000000001',
   '2026-03-12 11:00:00+05',
   NULL,
   '2027-06-30',
   'c1000000-0000-0000-0000-000000000001',
   '2026-03-09 14:00:00+05'),

  -- GATE_2: GMP Certificate (VERIFIED)
  ('da000000-0000-0000-0000-000000000004',
   'a1b2c3d4-0000-0000-0000-000000000004',
   'GATE_2',
   'GMP_Certificate',
   'DRAP GMP Certificate',
   '/onboarding/faisalabad/drap-gmp.pdf',
   'drap-gmp.pdf',
   'VERIFIED',
   'c9000000-0000-0000-0000-000000000001',
   '2026-03-12 11:10:00+05',
   NULL,
   '2027-12-31',
   'c1000000-0000-0000-0000-000000000001',
   '2026-03-09 14:30:00+05'),

  -- GATE_3: Product Dossier (VERIFIED)
  ('da000000-0000-0000-0000-000000000005',
   'a1b2c3d4-0000-0000-0000-000000000004',
   'GATE_3',
   'Product_Dossier',
   'CTD Dossier - Paracetamol 500mg',
   '/onboarding/faisalabad/ctd-paracetamol.pdf',
   'ctd-paracetamol.pdf',
   'VERIFIED',
   'c9000000-0000-0000-0000-000000000001',
   '2026-03-15 09:30:00+05',
   NULL,
   NULL,
   'c1000000-0000-0000-0000-000000000001',
   '2026-03-11 10:00:00+05'),

  -- GATE_3: Stability Data (UPLOADED - under review)
  ('da000000-0000-0000-0000-000000000006',
   'a1b2c3d4-0000-0000-0000-000000000004',
   'GATE_3',
   'Stability_Data',
   'Accelerated Stability Report - Paracetamol 500mg',
   '/onboarding/faisalabad/stability-paracetamol.pdf',
   'stability-paracetamol.pdf',
   'UPLOADED',
   NULL, NULL, NULL,
   NULL,
   'c1000000-0000-0000-0000-000000000001',
   '2026-03-14 16:00:00+05'),

  -- GATE_4: WHO-GMP Certificate (not uploaded yet - placeholder)
  ('da000000-0000-0000-0000-000000000007',
   'a1b2c3d4-0000-0000-0000-000000000004',
   'GATE_4',
   'WHO_GMP_Certificate',
   'WHO-GMP Pre-Qualification Certificate',
   NULL,
   NULL,
   'UPLOADED',
   NULL, NULL, NULL,
   NULL,
   NULL,
   NULL);


COMMIT;

-- ============================================================
-- Verification
-- ============================================================
SELECT 'batches' AS entity, COUNT(*) AS cnt FROM batches
UNION ALL SELECT 'batch_materials', COUNT(*) FROM batch_materials
UNION ALL SELECT 'batch_steps', COUNT(*) FROM batch_steps
UNION ALL SELECT 'batch_qc_tests', COUNT(*) FROM batch_qc_tests
UNION ALL SELECT 'batch_environmental', COUNT(*) FROM batch_environmental
UNION ALL SELECT 'batch_deviations', COUNT(*) FROM batch_deviations
UNION ALL SELECT 'coas', COUNT(*) FROM coas
UNION ALL SELECT 'drap_documents', COUNT(*) FROM drap_documents
UNION ALL SELECT 'rfqs', COUNT(*) FROM rfqs
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'escrow_accounts', COUNT(*) FROM escrow_accounts
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'supplier_qualifications', COUNT(*) FROM supplier_qualifications
UNION ALL SELECT 'regulatory_pathway_progress', COUNT(*) FROM regulatory_pathway_progress
UNION ALL SELECT 'regulatory_pathway_steps', COUNT(*) FROM regulatory_pathway_steps
UNION ALL SELECT 'onboarding_documents', COUNT(*) FROM onboarding_documents
ORDER BY entity;
