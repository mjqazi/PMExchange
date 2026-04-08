// Shared marketplace data — hardcoded for prototype

export interface Manufacturer {
  id: string;
  name: string;
  city: string;
  tier: string;
  tierLabel: string;
  cqs: number;
  cqsBadge: 'green' | 'amber' | 'red';
  certifications: string[];
  pmxCertified: boolean;
  memberSince: string;
  ordersCompleted: number;
  responseRate: string;
  avgResponseTime: string;
  productCount: number;
  suspended?: boolean;
  cqsDimensions: { label: string; value: number; }[];
  image: string;
}

export interface Product {
  id: string;
  inn: string;
  brandName: string;
  strength: string;
  dosageForm: string;
  dosageFormShort: string;
  category: string;
  manufacturerId: string;
  manufacturerName: string;
  drapRegNo: string;
  pharmacopoeia: string;
  shelfLife: string;
  storageConditions: string;
  annualCapacity: string;
  packSizes: string[];
  exportCountries: string[];
  priceRange: string;
  priceLow: number;
  priceHigh: number;
  moq: string;
  certifications: string[];
  cqs: number;
  cqsBadge: 'green' | 'amber' | 'red';
  tier: string;
  pmxCertified: boolean;
  recentCoA: { batch: string; result: string; date: string; }[];
  qcTests: string[];
  image: string;
}

export const manufacturers: Manufacturer[] = [
  {
    id: 'lahore-generics',
    name: 'Lahore Generics Ltd.',
    city: 'Lahore',
    tier: 'Tier 2',
    tierLabel: 'Tier 2 — Export Ready',
    cqs: 83.4,
    cqsBadge: 'green',
    certifications: ['WHO-GMP', 'DRAP-GMP', 'ISO 9001:2015'],
    pmxCertified: true,
    memberSince: 'Jan 2025',
    ordersCompleted: 34,
    responseRate: '96%',
    avgResponseTime: '< 4 hours',
    productCount: 4,
    image: 'https://images.unsplash.com/photo-1563213126-a4273aed2016?w=400&h=300&fit=crop',
    cqsDimensions: [
      { label: 'Batch Completeness', value: 96 },
      { label: 'CoA Accuracy', value: 89 },
      { label: 'Deviation Rate (inv.)', value: 78 },
      { label: 'Supplier Qualification', value: 82 },
      { label: 'Certification Status', value: 100 },
      { label: 'Delivery Performance', value: 75 },
    ],
  },
  {
    id: 'karachi-pharmacorp',
    name: 'Karachi PharmaCorp',
    city: 'Karachi',
    tier: 'Tier 2',
    tierLabel: 'Tier 2 — Export Ready',
    cqs: 71.8,
    cqsBadge: 'amber',
    certifications: ['DRAP-GMP', 'SFDA', 'ISO 9001:2015'],
    pmxCertified: true,
    memberSince: 'Mar 2025',
    ordersCompleted: 18,
    responseRate: '89%',
    avgResponseTime: '< 8 hours',
    productCount: 3,
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop',
    cqsDimensions: [
      { label: 'Batch Completeness', value: 85 },
      { label: 'CoA Accuracy', value: 76 },
      { label: 'Deviation Rate (inv.)', value: 64 },
      { label: 'Supplier Qualification', value: 72 },
      { label: 'Certification Status', value: 80 },
      { label: 'Delivery Performance', value: 68 },
    ],
  },
  {
    id: 'multan-medgen',
    name: 'Multan MedGen Pvt.',
    city: 'Multan',
    tier: 'Tier 2',
    tierLabel: 'Tier 2 — Export Ready',
    cqs: 66.2,
    cqsBadge: 'amber',
    certifications: ['DRAP-GMP', 'ISO 9001:2015'],
    pmxCertified: true,
    memberSince: 'Jun 2025',
    ordersCompleted: 9,
    responseRate: '82%',
    avgResponseTime: '< 12 hours',
    productCount: 3,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
    cqsDimensions: [
      { label: 'Batch Completeness', value: 78 },
      { label: 'CoA Accuracy', value: 70 },
      { label: 'Deviation Rate (inv.)', value: 58 },
      { label: 'Supplier Qualification', value: 64 },
      { label: 'Certification Status', value: 72 },
      { label: 'Delivery Performance', value: 60 },
    ],
  },
  {
    id: 'faisalabad-meds',
    name: 'Faisalabad Meds Co.',
    city: 'Faisalabad',
    tier: 'Tier 1',
    tierLabel: 'Tier 1 — Onboarding',
    cqs: 0,
    cqsBadge: 'amber',
    certifications: ['DRAP-GMP'],
    pmxCertified: false,
    memberSince: 'Sep 2025',
    ordersCompleted: 0,
    responseRate: '75%',
    avgResponseTime: '< 24 hours',
    productCount: 1,
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=300&fit=crop',
    cqsDimensions: [
      { label: 'Batch Completeness', value: 45 },
      { label: 'CoA Accuracy', value: 40 },
      { label: 'Deviation Rate (inv.)', value: 50 },
      { label: 'Supplier Qualification', value: 38 },
      { label: 'Certification Status', value: 60 },
      { label: 'Delivery Performance', value: 0 },
    ],
  },
];

export const products: Product[] = [
  // Lahore Generics
  {
    id: 'lg-metformin-500',
    inn: 'Metformin HCl',
    brandName: 'Glucomet-500',
    strength: '500mg',
    dosageForm: 'Film-Coated Tablet',
    dosageFormShort: 'Tablet',
    category: 'Anti-Diabetics',
    manufacturerId: 'lahore-generics',
    manufacturerName: 'Lahore Generics Ltd.',
    drapRegNo: 'DRAP-074521',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
    pharmacopoeia: 'BP 2024 / USP 47',
    shelfLife: '36 months',
    storageConditions: 'Store below 30°C in dry place',
    annualCapacity: '24M units/year',
    packSizes: ['30 tabs/blister', '100 tabs/bottle', '1000 tabs/bulk'],
    exportCountries: ['Saudi Arabia', 'UAE', 'Kenya', 'Nigeria', 'Sri Lanka'],
    priceRange: '$0.008 - $0.012 / tablet',
    priceLow: 0.008,
    priceHigh: 0.012,
    moq: 'Min. 1,000,000 units',
    certifications: ['WHO-GMP', 'DRAP-GMP'],
    cqs: 83.4,
    cqsBadge: 'green',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'LHR-2026-0031', result: 'Pass — All specs met', date: 'Mar 2026' },
      { batch: 'LHR-2026-0027', result: 'Pass — All specs met', date: 'Feb 2026' },
      { batch: 'LHR-2026-0019', result: 'Pass — All specs met', date: 'Jan 2026' },
    ],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Content Uniformity', 'Related Substances', 'Hardness', 'Friability', 'Disintegration', 'Microbial Limits'],
  },
  {
    id: 'lg-atorvastatin-40',
    inn: 'Atorvastatin',
    brandName: 'Atorgen-40',
    strength: '40mg',
    dosageForm: 'Film-Coated Tablet',
    dosageFormShort: 'Tablet',
    category: 'Cardiovascular',
    manufacturerId: 'lahore-generics',
    manufacturerName: 'Lahore Generics Ltd.',
    drapRegNo: 'DRAP-074589',
    image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=300&fit=crop',
    pharmacopoeia: 'USP 47',
    shelfLife: '24 months',
    storageConditions: 'Store below 25°C, protect from light',
    annualCapacity: '18M units/year',
    packSizes: ['30 tabs/blister', '90 tabs/bottle'],
    exportCountries: ['Saudi Arabia', 'UAE', 'Kenya'],
    priceRange: '$0.015 - $0.022 / tablet',
    priceLow: 0.015,
    priceHigh: 0.022,
    moq: 'Min. 500,000 units',
    certifications: ['WHO-GMP', 'DRAP-GMP'],
    cqs: 83.4,
    cqsBadge: 'green',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'LHR-2026-0030', result: 'In Progress', date: 'Mar 2026' },
      { batch: 'LHR-2026-0024', result: 'Pass — All specs met', date: 'Feb 2026' },
    ],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Content Uniformity', 'Related Substances', 'Hardness', 'Friability'],
  },
  {
    id: 'lg-ciprofloxacin-500',
    inn: 'Ciprofloxacin',
    brandName: 'Ciprogen-500',
    strength: '500mg',
    dosageForm: 'Film-Coated Tablet',
    dosageFormShort: 'Tablet',
    category: 'Anti-Infectives',
    manufacturerId: 'lahore-generics',
    manufacturerName: 'Lahore Generics Ltd.',
    drapRegNo: 'DRAP-074602',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&h=300&fit=crop',
    pharmacopoeia: 'BP 2024',
    shelfLife: '36 months',
    storageConditions: 'Store below 30°C',
    annualCapacity: '36M units/year',
    packSizes: ['10 tabs/blister', '100 tabs/bottle', '5000 tabs/bulk'],
    exportCountries: ['Kenya', 'Nigeria', 'Tanzania', 'Uganda', 'Sri Lanka', 'Myanmar'],
    priceRange: '$0.010 - $0.015 / tablet',
    priceLow: 0.010,
    priceHigh: 0.015,
    moq: 'Min. 2,000,000 units',
    certifications: ['WHO-GMP', 'DRAP-GMP'],
    cqs: 83.4,
    cqsBadge: 'green',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'LHR-2026-0029', result: 'Pass — All specs met', date: 'Mar 2026' },
      { batch: 'LHR-2026-0022', result: 'Pass — All specs met', date: 'Feb 2026' },
    ],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Content Uniformity', 'Related Substances', 'Hardness', 'Microbial Limits'],
  },
  {
    id: 'lg-amoxicillin-250',
    inn: 'Amoxicillin',
    brandName: 'Amoxgen-250',
    strength: '250mg',
    dosageForm: 'Hard Gelatin Capsule',
    dosageFormShort: 'Capsule',
    category: 'Anti-Infectives',
    manufacturerId: 'lahore-generics',
    manufacturerName: 'Lahore Generics Ltd.',
    drapRegNo: 'DRAP-074618',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop',
    pharmacopoeia: 'BP 2024 / USP 47',
    shelfLife: '24 months',
    storageConditions: 'Store below 25°C, protect from moisture',
    annualCapacity: '60M units/year',
    packSizes: ['10 caps/blister', '100 caps/bottle', '10000 caps/bulk'],
    exportCountries: ['Nigeria', 'Kenya', 'Tanzania', 'Uganda', 'Ghana', 'Sri Lanka'],
    priceRange: '$0.004 - $0.007 / capsule',
    priceLow: 0.004,
    priceHigh: 0.007,
    moq: 'Min. 5,000,000 units',
    certifications: ['WHO-GMP', 'DRAP-GMP'],
    cqs: 83.4,
    cqsBadge: 'green',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'LHR-2026-0028', result: 'Quarantine — Dissolution OOS', date: 'Mar 2026' },
      { batch: 'LHR-2026-0020', result: 'Pass — All specs met', date: 'Feb 2026' },
    ],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Content Uniformity', 'Related Substances', 'Moisture Content', 'Microbial Limits'],
  },
  // Karachi PharmaCorp
  {
    id: 'kp-metformin-500',
    inn: 'Metformin HCl',
    brandName: 'Metpak-500',
    strength: '500mg',
    dosageForm: 'Film-Coated Tablet',
    dosageFormShort: 'Tablet',
    category: 'Anti-Diabetics',
    manufacturerId: 'karachi-pharmacorp',
    manufacturerName: 'Karachi PharmaCorp',
    drapRegNo: 'DRAP-081203',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=300&fit=crop',
    pharmacopoeia: 'BP 2024',
    shelfLife: '36 months',
    storageConditions: 'Store below 30°C in dry place',
    annualCapacity: '30M units/year',
    packSizes: ['30 tabs/blister', '500 tabs/bottle'],
    exportCountries: ['Saudi Arabia', 'UAE', 'Oman', 'Bahrain'],
    priceRange: '$0.007 - $0.011 / tablet',
    priceLow: 0.007,
    priceHigh: 0.011,
    moq: 'Min. 2,000,000 units',
    certifications: ['DRAP-GMP', 'SFDA'],
    cqs: 71.8,
    cqsBadge: 'amber',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'KPC-2026-0018', result: 'Pass — All specs met', date: 'Mar 2026' },
      { batch: 'KPC-2026-0012', result: 'Pass — All specs met', date: 'Feb 2026' },
    ],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Content Uniformity', 'Related Substances', 'Hardness'],
  },
  {
    id: 'kp-omeprazole-20',
    inn: 'Omeprazole',
    brandName: 'Omepak-20',
    strength: '20mg',
    dosageForm: 'Enteric-Coated Capsule',
    dosageFormShort: 'Capsule',
    category: 'Gastrointestinal',
    manufacturerId: 'karachi-pharmacorp',
    manufacturerName: 'Karachi PharmaCorp',
    drapRegNo: 'DRAP-081245',
    image: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=400&h=300&fit=crop',
    pharmacopoeia: 'USP 47',
    shelfLife: '24 months',
    storageConditions: 'Store below 25°C, protect from light & moisture',
    annualCapacity: '20M units/year',
    packSizes: ['14 caps/blister', '28 caps/blister', '100 caps/bottle'],
    exportCountries: ['Saudi Arabia', 'UAE', 'Oman'],
    priceRange: '$0.012 - $0.018 / capsule',
    priceLow: 0.012,
    priceHigh: 0.018,
    moq: 'Min. 1,000,000 units',
    certifications: ['DRAP-GMP', 'SFDA'],
    cqs: 71.8,
    cqsBadge: 'amber',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'KPC-2026-0016', result: 'Pass — All specs met', date: 'Mar 2026' },
    ],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Content Uniformity', 'Acid Resistance', 'Related Substances'],
  },
  {
    id: 'kp-amlodipine-5',
    inn: 'Amlodipine',
    brandName: 'Amlokare-5',
    strength: '5mg',
    dosageForm: 'Tablet',
    dosageFormShort: 'Tablet',
    category: 'Cardiovascular',
    manufacturerId: 'karachi-pharmacorp',
    manufacturerName: 'Karachi PharmaCorp',
    drapRegNo: 'DRAP-081267',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
    pharmacopoeia: 'BP 2024',
    shelfLife: '36 months',
    storageConditions: 'Store below 30°C, protect from light',
    annualCapacity: '40M units/year',
    packSizes: ['30 tabs/blister', '100 tabs/bottle'],
    exportCountries: ['Saudi Arabia', 'UAE', 'Kenya', 'Nigeria'],
    priceRange: '$0.005 - $0.009 / tablet',
    priceLow: 0.005,
    priceHigh: 0.009,
    moq: 'Min. 2,000,000 units',
    certifications: ['DRAP-GMP', 'SFDA'],
    cqs: 71.8,
    cqsBadge: 'amber',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'KPC-2026-0017', result: 'Pass — All specs met', date: 'Mar 2026' },
    ],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Content Uniformity', 'Related Substances', 'Hardness'],
  },
  // Multan MedGen
  {
    id: 'mm-paracetamol-500',
    inn: 'Paracetamol',
    brandName: 'ParaMult-500',
    strength: '500mg',
    dosageForm: 'Tablet',
    dosageFormShort: 'Tablet',
    category: 'Analgesics & NSAIDs',
    manufacturerId: 'multan-medgen',
    manufacturerName: 'Multan MedGen Pvt.',
    drapRegNo: 'DRAP-092301',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=300&fit=crop',
    pharmacopoeia: 'BP 2024',
    shelfLife: '36 months',
    storageConditions: 'Store below 30°C',
    annualCapacity: '100M units/year',
    packSizes: ['10 tabs/strip', '100 tabs/bottle', '10000 tabs/bulk'],
    exportCountries: ['Afghanistan', 'Sri Lanka', 'Myanmar', 'Kenya'],
    priceRange: '$0.003 - $0.005 / tablet',
    priceLow: 0.003,
    priceHigh: 0.005,
    moq: 'Min. 5,000,000 units',
    certifications: ['DRAP-GMP'],
    cqs: 66.2,
    cqsBadge: 'amber',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'MMG-2026-0009', result: 'Pass — All specs met', date: 'Mar 2026' },
    ],
    qcTests: ['Assay (UV)', 'Dissolution', 'Hardness', 'Friability', 'Disintegration'],
  },
  {
    id: 'mm-ibuprofen-400',
    inn: 'Ibuprofen',
    brandName: 'IbuMult-400',
    strength: '400mg',
    dosageForm: 'Film-Coated Tablet',
    dosageFormShort: 'Tablet',
    category: 'Analgesics & NSAIDs',
    manufacturerId: 'multan-medgen',
    manufacturerName: 'Multan MedGen Pvt.',
    drapRegNo: 'DRAP-092318',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop',
    pharmacopoeia: 'BP 2024',
    shelfLife: '36 months',
    storageConditions: 'Store below 30°C',
    annualCapacity: '80M units/year',
    packSizes: ['10 tabs/strip', '100 tabs/bottle', '5000 tabs/bulk'],
    exportCountries: ['Afghanistan', 'Sri Lanka', 'Kenya', 'Tanzania'],
    priceRange: '$0.004 - $0.006 / tablet',
    priceLow: 0.004,
    priceHigh: 0.006,
    moq: 'Min. 3,000,000 units',
    certifications: ['DRAP-GMP'],
    cqs: 66.2,
    cqsBadge: 'amber',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'MMG-2026-0008', result: 'Pass — All specs met', date: 'Feb 2026' },
    ],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Content Uniformity', 'Hardness', 'Friability'],
  },
  {
    id: 'mm-cetirizine-10',
    inn: 'Cetirizine',
    brandName: 'CetiMult-10',
    strength: '10mg',
    dosageForm: 'Film-Coated Tablet',
    dosageFormShort: 'Tablet',
    category: 'Respiratory',
    manufacturerId: 'multan-medgen',
    manufacturerName: 'Multan MedGen Pvt.',
    drapRegNo: 'DRAP-092335',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
    pharmacopoeia: 'USP 47',
    shelfLife: '24 months',
    storageConditions: 'Store below 25°C, protect from moisture',
    annualCapacity: '50M units/year',
    packSizes: ['10 tabs/blister', '30 tabs/blister', '100 tabs/bottle'],
    exportCountries: ['Afghanistan', 'Sri Lanka', 'Myanmar'],
    priceRange: '$0.003 - $0.005 / tablet',
    priceLow: 0.003,
    priceHigh: 0.005,
    moq: 'Min. 2,000,000 units',
    certifications: ['DRAP-GMP'],
    cqs: 66.2,
    cqsBadge: 'amber',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'MMG-2026-0007', result: 'Pass — All specs met', date: 'Feb 2026' },
    ],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Content Uniformity', 'Related Substances'],
  },
  // Faisalabad Meds
  {
    id: 'fm-metformin-500',
    inn: 'Metformin HCl',
    brandName: 'MetFais-500',
    strength: '500mg',
    dosageForm: 'Film-Coated Tablet',
    dosageFormShort: 'Tablet',
    category: 'Anti-Diabetics',
    manufacturerId: 'faisalabad-meds',
    manufacturerName: 'Faisalabad Meds Co.',
    drapRegNo: 'DRAP-099801',
    image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=300&fit=crop',
    pharmacopoeia: 'BP 2024',
    shelfLife: '36 months',
    storageConditions: 'Store below 30°C',
    annualCapacity: '15M units/year',
    packSizes: ['30 tabs/blister', '100 tabs/bottle'],
    exportCountries: ['Afghanistan'],
    priceRange: '$0.006 - $0.009 / tablet',
    priceLow: 0.006,
    priceHigh: 0.009,
    moq: 'Min. 1,000,000 units',
    certifications: ['DRAP-GMP'],
    cqs: 0,
    cqsBadge: 'amber',
    tier: 'Tier 1',
    pmxCertified: false,
    recentCoA: [],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Hardness'],
  },
  // Additional products for variety
  {
    id: 'lg-losartan-50',
    inn: 'Losartan',
    brandName: 'Losagen-50',
    strength: '50mg',
    dosageForm: 'Film-Coated Tablet',
    dosageFormShort: 'Tablet',
    category: 'Cardiovascular',
    manufacturerId: 'lahore-generics',
    manufacturerName: 'Lahore Generics Ltd.',
    drapRegNo: 'DRAP-074650',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=300&fit=crop',
    pharmacopoeia: 'USP 47',
    shelfLife: '24 months',
    storageConditions: 'Store below 25°C, protect from light',
    annualCapacity: '12M units/year',
    packSizes: ['30 tabs/blister', '90 tabs/bottle'],
    exportCountries: ['Saudi Arabia', 'UAE', 'Kenya'],
    priceRange: '$0.012 - $0.018 / tablet',
    priceLow: 0.012,
    priceHigh: 0.018,
    moq: 'Min. 500,000 units',
    certifications: ['WHO-GMP', 'DRAP-GMP'],
    cqs: 83.4,
    cqsBadge: 'green',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'LHR-2026-0026', result: 'Pass — All specs met', date: 'Feb 2026' },
    ],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Content Uniformity', 'Related Substances', 'Hardness'],
  },
  {
    id: 'kp-ranitidine-150',
    inn: 'Ranitidine',
    brandName: 'Ranipak-150',
    strength: '150mg',
    dosageForm: 'Film-Coated Tablet',
    dosageFormShort: 'Tablet',
    category: 'Gastrointestinal',
    manufacturerId: 'karachi-pharmacorp',
    manufacturerName: 'Karachi PharmaCorp',
    drapRegNo: 'DRAP-081290',
    image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400&h=300&fit=crop',
    pharmacopoeia: 'BP 2024',
    shelfLife: '24 months',
    storageConditions: 'Store below 25°C, protect from moisture',
    annualCapacity: '25M units/year',
    packSizes: ['14 tabs/blister', '100 tabs/bottle'],
    exportCountries: ['Saudi Arabia', 'UAE', 'Oman'],
    priceRange: '$0.006 - $0.010 / tablet',
    priceLow: 0.006,
    priceHigh: 0.010,
    moq: 'Min. 1,000,000 units',
    certifications: ['DRAP-GMP', 'SFDA'],
    cqs: 71.8,
    cqsBadge: 'amber',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'KPC-2026-0015', result: 'Pass — All specs met', date: 'Feb 2026' },
    ],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Content Uniformity', 'NDMA Testing', 'Related Substances'],
  },
  {
    id: 'mm-salbutamol-4',
    inn: 'Salbutamol',
    brandName: 'SalbuMult-4',
    strength: '4mg',
    dosageForm: 'Tablet',
    dosageFormShort: 'Tablet',
    category: 'Respiratory',
    manufacturerId: 'multan-medgen',
    manufacturerName: 'Multan MedGen Pvt.',
    drapRegNo: 'DRAP-092350',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=300&fit=crop',
    pharmacopoeia: 'BP 2024',
    shelfLife: '36 months',
    storageConditions: 'Store below 30°C',
    annualCapacity: '40M units/year',
    packSizes: ['10 tabs/strip', '100 tabs/bottle'],
    exportCountries: ['Afghanistan', 'Sri Lanka', 'Myanmar'],
    priceRange: '$0.003 - $0.005 / tablet',
    priceLow: 0.003,
    priceHigh: 0.005,
    moq: 'Min. 2,000,000 units',
    certifications: ['DRAP-GMP'],
    cqs: 66.2,
    cqsBadge: 'amber',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'MMG-2026-0006', result: 'Pass — All specs met', date: 'Feb 2026' },
    ],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Content Uniformity', 'Hardness'],
  },
  {
    id: 'kp-glimepiride-2',
    inn: 'Glimepiride',
    brandName: 'GlimiKare-2',
    strength: '2mg',
    dosageForm: 'Tablet',
    dosageFormShort: 'Tablet',
    category: 'Anti-Diabetics',
    manufacturerId: 'karachi-pharmacorp',
    manufacturerName: 'Karachi PharmaCorp',
    drapRegNo: 'DRAP-081310',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=300&fit=crop',
    pharmacopoeia: 'USP 47',
    shelfLife: '24 months',
    storageConditions: 'Store below 25°C, protect from light',
    annualCapacity: '15M units/year',
    packSizes: ['30 tabs/blister', '100 tabs/bottle'],
    exportCountries: ['Saudi Arabia', 'UAE'],
    priceRange: '$0.008 - $0.014 / tablet',
    priceLow: 0.008,
    priceHigh: 0.014,
    moq: 'Min. 500,000 units',
    certifications: ['DRAP-GMP', 'SFDA'],
    cqs: 71.8,
    cqsBadge: 'amber',
    tier: 'Tier 2',
    pmxCertified: true,
    recentCoA: [
      { batch: 'KPC-2026-0014', result: 'Pass — All specs met', date: 'Feb 2026' },
    ],
    qcTests: ['Assay (HPLC)', 'Dissolution', 'Content Uniformity', 'Related Substances'],
  },
];

export const categories = [
  { name: 'Cardiovascular', icon: '♥', examples: 'Atorvastatin, Amlodipine, Losartan', count: 3 },
  { name: 'Anti-Diabetics', icon: '◈', examples: 'Metformin, Glimepiride', count: 4 },
  { name: 'Anti-Infectives', icon: '⊕', examples: 'Amoxicillin, Ciprofloxacin', count: 2 },
  { name: 'Analgesics & NSAIDs', icon: '◇', examples: 'Paracetamol, Ibuprofen', count: 2 },
  { name: 'Gastrointestinal', icon: '○', examples: 'Omeprazole, Ranitidine', count: 2 },
  { name: 'Respiratory', icon: '△', examples: 'Cetirizine, Salbutamol', count: 2 },
];

export function getProductsByManufacturer(manufacturerId: string): Product[] {
  return products.filter(p => p.manufacturerId === manufacturerId);
}

export function getManufacturer(id: string): Manufacturer | undefined {
  return manufacturers.find(m => m.id === id);
}

export function getProduct(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

export function searchProducts(query: string, filters?: {
  dosageForm?: string;
  certification?: string;
  tier?: string;
  minCqs?: number;
  country?: string;
}): Product[] {
  const q = query.toLowerCase();
  let results = products.filter(p =>
    p.inn.toLowerCase().includes(q) ||
    p.brandName.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.manufacturerName.toLowerCase().includes(q) ||
    p.strength.toLowerCase().includes(q)
  );

  if (filters?.dosageForm) {
    results = results.filter(p => p.dosageFormShort.toLowerCase() === filters.dosageForm!.toLowerCase());
  }
  if (filters?.certification) {
    results = results.filter(p => p.certifications.some(c => c.toLowerCase() === filters.certification!.toLowerCase()));
  }
  if (filters?.tier) {
    results = results.filter(p => p.tier === filters.tier);
  }
  if (filters?.minCqs) {
    results = results.filter(p => p.cqs >= filters.minCqs!);
  }
  if (filters?.country) {
    results = results.filter(p => p.exportCountries.some(c => c.toLowerCase().includes(filters.country!.toLowerCase())));
  }

  return results;
}
