-- PMX Drug Dictionary Schema
-- Run: sudo -u postgres psql -d pmx_prototype -f scripts/schema-drug-dictionary.sql

-- Enable UUID extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Master Drug Dictionary (managed by PMX Admin) ─────────────────────────

CREATE TABLE IF NOT EXISTS drug_dictionary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inn_name VARCHAR(255) UNIQUE NOT NULL,  -- International Nonproprietary Name
  category_id UUID REFERENCES cms_product_categories(id),
  category_name VARCHAR(100),  -- denormalized for easy display
  pharmacopoeia VARCHAR(100) DEFAULT 'BP / USP',
  description TEXT,
  common_strengths TEXT[],     -- e.g., {'250mg', '500mg', '1000mg'}
  common_dosage_forms TEXT[],  -- e.g., {'Tablet', 'Capsule', 'Syrup'}
  common_storage VARCHAR(255) DEFAULT 'Below 25C, dry place',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drug_dict_inn ON drug_dictionary(inn_name);
CREATE INDEX IF NOT EXISTS idx_drug_dict_category ON drug_dictionary(category_id);

-- ─── Seed: 26 Common Pharma INNs ──────────────────────────────────────────

INSERT INTO drug_dictionary (inn_name, category_id, category_name, pharmacopoeia, description, common_strengths, common_dosage_forms, common_storage)
VALUES
-- Anti-Infectives (category: af9c0133-650b-40ef-b488-25a627bf6d42)
('Amoxicillin',
 'af9c0133-650b-40ef-b488-25a627bf6d42', 'Anti-Infectives', 'BP / USP',
 'Broad-spectrum penicillin antibiotic used to treat bacterial infections',
 ARRAY['250mg','500mg','875mg'], ARRAY['Capsule','Tablet','Oral Suspension'],
 'Below 25C, dry place'),

('Ciprofloxacin',
 'af9c0133-650b-40ef-b488-25a627bf6d42', 'Anti-Infectives', 'BP / USP',
 'Fluoroquinolone antibiotic for urinary tract, respiratory, and GI infections',
 ARRAY['250mg','500mg','750mg'], ARRAY['Tablet','Oral Suspension','IV Infusion'],
 'Below 30C, protect from light'),

('Azithromycin',
 'af9c0133-650b-40ef-b488-25a627bf6d42', 'Anti-Infectives', 'BP / USP',
 'Macrolide antibiotic effective against respiratory and soft tissue infections',
 ARRAY['250mg','500mg'], ARRAY['Tablet','Capsule','Oral Suspension'],
 'Below 25C, dry place'),

('Metronidazole',
 'af9c0133-650b-40ef-b488-25a627bf6d42', 'Anti-Infectives', 'BP / USP',
 'Nitroimidazole antibiotic for anaerobic bacterial and protozoal infections',
 ARRAY['200mg','400mg','500mg'], ARRAY['Tablet','IV Infusion','Oral Suspension'],
 'Below 25C, protect from light'),

('Cephalexin',
 'af9c0133-650b-40ef-b488-25a627bf6d42', 'Anti-Infectives', 'BP / USP',
 'First-generation cephalosporin antibiotic for skin and urinary infections',
 ARRAY['250mg','500mg'], ARRAY['Capsule','Tablet','Oral Suspension'],
 'Below 25C, dry place'),

('Levofloxacin',
 'af9c0133-650b-40ef-b488-25a627bf6d42', 'Anti-Infectives', 'BP / USP',
 'Third-generation fluoroquinolone for respiratory and urinary tract infections',
 ARRAY['250mg','500mg','750mg'], ARRAY['Tablet','IV Infusion'],
 'Below 25C, protect from light'),

-- Anti-Diabetics (category: 76a8a18f-834f-413e-87aa-15f65004c5f0)
('Metformin',
 '76a8a18f-834f-413e-87aa-15f65004c5f0', 'Anti-Diabetics', 'BP / USP',
 'First-line oral antidiabetic for type 2 diabetes mellitus',
 ARRAY['500mg','850mg','1000mg'], ARRAY['Tablet','Extended-Release Tablet'],
 'Below 25C, dry place'),

('Glimepiride',
 '76a8a18f-834f-413e-87aa-15f65004c5f0', 'Anti-Diabetics', 'BP / USP',
 'Sulfonylurea for type 2 diabetes, stimulates insulin secretion',
 ARRAY['1mg','2mg','4mg'], ARRAY['Tablet'],
 'Below 25C, dry place'),

('Sitagliptin',
 '76a8a18f-834f-413e-87aa-15f65004c5f0', 'Anti-Diabetics', 'USP',
 'DPP-4 inhibitor for type 2 diabetes mellitus management',
 ARRAY['25mg','50mg','100mg'], ARRAY['Tablet'],
 'Below 25C, dry place'),

('Pioglitazone',
 '76a8a18f-834f-413e-87aa-15f65004c5f0', 'Anti-Diabetics', 'BP / USP',
 'Thiazolidinedione insulin sensitizer for type 2 diabetes',
 ARRAY['15mg','30mg','45mg'], ARRAY['Tablet'],
 'Below 25C, dry place'),

-- Cardiovascular (category: e96cf191-2640-4808-b93b-f355c814dd45)
('Atorvastatin',
 'e96cf191-2640-4808-b93b-f355c814dd45', 'Cardiovascular', 'BP / USP',
 'HMG-CoA reductase inhibitor (statin) for hypercholesterolemia',
 ARRAY['10mg','20mg','40mg','80mg'], ARRAY['Tablet'],
 'Below 25C, dry place'),

('Amlodipine',
 'e96cf191-2640-4808-b93b-f355c814dd45', 'Cardiovascular', 'BP / USP',
 'Calcium channel blocker for hypertension and angina',
 ARRAY['2.5mg','5mg','10mg'], ARRAY['Tablet'],
 'Below 25C, protect from moisture'),

('Losartan',
 'e96cf191-2640-4808-b93b-f355c814dd45', 'Cardiovascular', 'BP / USP',
 'Angiotensin II receptor blocker (ARB) for hypertension',
 ARRAY['25mg','50mg','100mg'], ARRAY['Tablet'],
 'Below 25C, dry place'),

('Enalapril',
 'e96cf191-2640-4808-b93b-f355c814dd45', 'Cardiovascular', 'BP / USP',
 'ACE inhibitor for hypertension and heart failure',
 ARRAY['2.5mg','5mg','10mg','20mg'], ARRAY['Tablet'],
 'Below 25C, dry place'),

('Clopidogrel',
 'e96cf191-2640-4808-b93b-f355c814dd45', 'Cardiovascular', 'BP / USP',
 'Antiplatelet agent for prevention of thrombotic events',
 ARRAY['75mg','300mg'], ARRAY['Tablet'],
 'Below 25C, dry place'),

-- Analgesics (category: cea5a386-6cbb-4e42-bb5f-a803d7c331fc)
('Paracetamol',
 'cea5a386-6cbb-4e42-bb5f-a803d7c331fc', 'Analgesics & NSAIDs', 'BP / USP',
 'Analgesic and antipyretic for pain and fever management',
 ARRAY['250mg','500mg','650mg','1000mg'], ARRAY['Tablet','Syrup','Oral Suspension','Suppository'],
 'Below 25C, dry place'),

('Ibuprofen',
 'cea5a386-6cbb-4e42-bb5f-a803d7c331fc', 'Analgesics & NSAIDs', 'BP / USP',
 'NSAID for pain, inflammation, and fever',
 ARRAY['200mg','400mg','600mg'], ARRAY['Tablet','Capsule','Oral Suspension'],
 'Below 25C, dry place'),

('Diclofenac',
 'cea5a386-6cbb-4e42-bb5f-a803d7c331fc', 'Analgesics & NSAIDs', 'BP / USP',
 'NSAID for musculoskeletal pain and inflammatory conditions',
 ARRAY['25mg','50mg','75mg','100mg'], ARRAY['Tablet','Capsule','Gel','Injection'],
 'Below 25C, protect from light'),

('Naproxen',
 'cea5a386-6cbb-4e42-bb5f-a803d7c331fc', 'Analgesics & NSAIDs', 'BP / USP',
 'Long-acting NSAID for arthritis, pain, and inflammation',
 ARRAY['250mg','500mg'], ARRAY['Tablet','Oral Suspension'],
 'Below 25C, dry place'),

-- Gastrointestinal (category: 64d703ae-8b54-435a-85e9-0be413011b23)
('Omeprazole',
 '64d703ae-8b54-435a-85e9-0be413011b23', 'Gastrointestinal', 'BP / USP',
 'Proton pump inhibitor for GERD, peptic ulcers, and acid reflux',
 ARRAY['10mg','20mg','40mg'], ARRAY['Capsule','Tablet','IV Injection'],
 'Below 25C, dry place, protect from light'),

('Ranitidine',
 '64d703ae-8b54-435a-85e9-0be413011b23', 'Gastrointestinal', 'BP / USP',
 'H2 receptor antagonist for gastric acid reduction',
 ARRAY['150mg','300mg'], ARRAY['Tablet','Syrup','Injection'],
 'Below 25C, protect from light'),

('Esomeprazole',
 '64d703ae-8b54-435a-85e9-0be413011b23', 'Gastrointestinal', 'BP / USP',
 'Proton pump inhibitor (S-isomer of omeprazole) for acid-related disorders',
 ARRAY['20mg','40mg'], ARRAY['Capsule','Tablet','IV Injection'],
 'Below 25C, dry place'),

('Domperidone',
 '64d703ae-8b54-435a-85e9-0be413011b23', 'Gastrointestinal', 'BP',
 'Dopamine antagonist antiemetic and prokinetic agent',
 ARRAY['10mg','20mg'], ARRAY['Tablet','Oral Suspension'],
 'Below 25C, dry place'),

-- Respiratory (category: 5f700e03-34fe-4744-805e-cec2327f134d)
('Salbutamol',
 '5f700e03-34fe-4744-805e-cec2327f134d', 'Respiratory', 'BP / USP',
 'Short-acting beta-2 agonist bronchodilator for asthma',
 ARRAY['2mg','4mg','100mcg/dose'], ARRAY['Tablet','Syrup','Metered-Dose Inhaler','Nebuliser Solution'],
 'Below 25C, protect from light'),

('Montelukast',
 '5f700e03-34fe-4744-805e-cec2327f134d', 'Respiratory', 'BP / USP',
 'Leukotriene receptor antagonist for asthma and allergic rhinitis',
 ARRAY['4mg','5mg','10mg'], ARRAY['Tablet','Chewable Tablet','Granules'],
 'Below 25C, protect from light and moisture'),

('Cetirizine',
 '5f700e03-34fe-4744-805e-cec2327f134d', 'Respiratory', 'BP / USP',
 'Second-generation antihistamine for allergic rhinitis and urticaria',
 ARRAY['5mg','10mg'], ARRAY['Tablet','Syrup','Oral Drops'],
 'Below 25C, dry place'),

('Loratadine',
 '5f700e03-34fe-4744-805e-cec2327f134d', 'Respiratory', 'BP / USP',
 'Non-sedating antihistamine for allergic rhinitis and chronic urticaria',
 ARRAY['5mg','10mg'], ARRAY['Tablet','Syrup','Oral Disintegrating Tablet'],
 'Below 25C, dry place')

ON CONFLICT (inn_name) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  category_name = EXCLUDED.category_name,
  pharmacopoeia = EXCLUDED.pharmacopoeia,
  description = EXCLUDED.description,
  common_strengths = EXCLUDED.common_strengths,
  common_dosage_forms = EXCLUDED.common_dosage_forms,
  common_storage = EXCLUDED.common_storage,
  updated_at = NOW();
