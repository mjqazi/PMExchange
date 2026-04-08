'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SignatureModal from '@/components/SignatureModal';

/* ───────── Types ───────── */

interface Material {
  id?: string;
  type: string;
  typeClass: string;
  name: string;
  supplier: string;
  lot: string;
  qty: string;
  unit: string;
  coaRef: string;
}

interface Step {
  step: number;
  desc: string;
  operator: string;
  equipment: string;
  params: string;
  time: string;
  signed: boolean;
  signer?: string;
  hash?: string;
}

interface QCTest {
  id?: string;
  name: string;
  method: string;
  spec: string;
  result: string;
  unit: string;
  verdict: string;
  fromTemplate?: boolean;
  saved?: boolean;
}

interface EnvReading {
  id?: string;
  time: string;
  area: string;
  temp: string;
  humidity: string;
  pressure: string;
  withinSpec: boolean;
  by: string;
}

interface Deviation {
  id?: string;
  deviation_id?: string;
  classification?: string;
  severity?: string;
  description?: string;
  capa_ref?: string;
  status?: string;
  created_at?: string;
  investigation_notes?: string;
  resolution_notes?: string;
  expanded?: boolean;
}

interface Signature {
  title: string;
  signer: string;
  meaning: string;
  date: string;
  hash: string;
  color: string;
  extra?: string;
}

interface HeaderItem {
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
}

/* ───────── Demo data ───────── */

const DEMO_MATERIALS: Material[] = [
  { type: 'API', typeClass: 'info', name: 'Metformin Hydrochloride', supplier: 'Granules India Pvt. Ltd.', lot: 'GIN-2026-0441', qty: '102,500', unit: 'g', coaRef: 'GIN-COA-0441' },
  { type: 'Excipient', typeClass: 'neutral', name: 'Microcrystalline Cellulose PH101', supplier: 'FMC BioPolymer', lot: 'FMC-2026-0220', qty: '47,000', unit: 'g', coaRef: 'FMC-COA-0220' },
  { type: 'Excipient', typeClass: 'neutral', name: 'Magnesium Stearate', supplier: 'Spectrum Pakistan', lot: 'SP-2026-0119', qty: '2,100', unit: 'g', coaRef: 'SP-COA-0119' },
  { type: 'Excipient', typeClass: 'neutral', name: 'Povidone K30', supplier: 'BASF Pakistan', lot: 'BASF-26-0088', qty: '10,200', unit: 'g', coaRef: 'BASF-COA-0088' },
];

const DEMO_STEPS: Step[] = [
  { step: 1, desc: 'API weighing & sifting', operator: 'Tariq Mahmood', equipment: 'BAL-001/SIFT-002', params: 'Mesh 40, humidity <50%', time: '09:14 UTC', signed: true, signer: 'Tariq Mahmood', hash: '3f8a2c9d...' },
  { step: 2, desc: 'Granulation', operator: 'Tariq Mahmood', equipment: 'GRAN-001', params: 'Speed 180rpm, temp 55\u00B0C, 20min', time: '10:45 UTC', signed: true, signer: 'Tariq Mahmood', hash: '7b1e9c4a...' },
  { step: 3, desc: 'Drying (FBD)', operator: 'Tariq Mahmood', equipment: 'FBD-001', params: 'Inlet 65\u00B0C, outlet 40\u00B0C, LOD <2%', time: '12:30 UTC', signed: true, signer: 'Tariq Mahmood', hash: 'c4d2f8e1...' },
  { step: 4, desc: 'Blending & lubrication', operator: 'Tariq Mahmood', equipment: 'BLN-002', params: '12rpm, 5min post Mg-stearate', time: '13:15 UTC', signed: true, signer: 'Tariq Mahmood', hash: '8e3a1b5f...' },
  { step: 5, desc: 'Tablet compression', operator: 'Tariq Mahmood', equipment: 'TBM-003', params: 'Hardness 8\u201312kP, thickness 4.2mm\u00B10.1', time: '14:00 UTC', signed: true, signer: 'Tariq Mahmood', hash: 'a1f7d9c2...' },
];

const DEMO_QC_TESTS: QCTest[] = [
  { name: 'Assay (HPLC)', method: 'BP 2024 / USP 47', spec: '98.0\u2013102.0%', result: '100.3', unit: '%', verdict: 'PASS', saved: true },
  { name: 'Dissolution (Q, 45 min)', method: 'USP <711> App.II', spec: 'NLT 80%', result: '93.4', unit: '%', verdict: 'PASS', saved: true },
  { name: 'Related substances', method: 'BP 2024', spec: 'NMT 0.5%', result: '0.12', unit: '%', verdict: 'PASS', saved: true },
  { name: 'Microbial limits', method: 'USP <61> / <62>', spec: 'Compliant', result: 'Compliant', unit: '\u2014', verdict: 'PASS', saved: true },
];

const DEMO_ENV_DATA: EnvReading[] = [
  { time: '09:00', area: 'Granulation Room A', temp: '22.3', humidity: '44.1', pressure: '12.5', withinSpec: true, by: 'Tariq Mahmood' },
  { time: '11:00', area: 'FBD Room', temp: '24.8', humidity: '47.2', pressure: '10.2', withinSpec: true, by: 'Tariq Mahmood' },
  { time: '13:00', area: 'Compression Hall', temp: '21.5', humidity: '43.6', pressure: '15.1', withinSpec: true, by: 'Tariq Mahmood' },
];

const DEMO_DEVIATIONS: Deviation[] = [];

const DEMO_SIGNATURES: Signature[] = [
  { title: 'Production Operator sign-off', signer: 'Tariq Mahmood (SELLER_OPERATOR)', meaning: 'Completed all manufacturing steps as Production Operator', date: '01 Apr 2026 14:00 UTC', hash: '3f8a2c9d...', color: 'var(--pmx-green)' },
  { title: 'QC Analyst sign-off', signer: 'Amna Siddiqui (SELLER_QA)', meaning: 'All QC tests completed as QC Analyst', date: '01 Apr 2026 12:30 UTC', hash: '9d1e4f7b...', color: 'var(--pmx-green)' },
  { title: 'QA Manager release \u2014 BATCH RELEASED', signer: 'Dr. Farrukh Ali (SELLER_QA)', meaning: 'Approved for release as QA Manager', date: '01 Apr 2026 14:07 UTC', hash: 'a4f2c81e...', color: 'var(--pmx-teal)', extra: 'CoA generation triggered' },
];

const DEMO_HEADER_INFO: HeaderItem[] = [
  { label: 'Batch no.:', value: 'LHR-2026-0031', mono: true },
  { label: 'Batch size:', value: '200,000 tablets' },
  { label: 'Yield actual:', value: '197,840 (98.9%)' },
  { label: 'Shelf life:', value: '24 months' },
  { label: 'Mfg. date:', value: '01 Apr 2026' },
  { label: 'Expiry date:', value: '31 Mar 2028' },
  { label: 'Yield theoretical:', value: '200,000' },
  { label: 'Variance %:', value: '\u22121.08% (in spec)', valueColor: 'var(--pmx-green)' },
];

/* ───────── Permission helpers ───────── */

type BatchStatus = 'IN_PROGRESS' | 'QA_REVIEW' | 'QUARANTINE' | 'RELEASED' | 'REJECTED' | string;

function canEditMaterials(status: BatchStatus) {
  return status === 'IN_PROGRESS' || status === 'In progress';
}
function canEditSteps(status: BatchStatus) {
  return status === 'IN_PROGRESS' || status === 'In progress';
}
function canEditQC(status: BatchStatus) {
  const s = status.toUpperCase().replace(/\s/g, '_');
  return s === 'IN_PROGRESS' || s === 'QA_REVIEW';
}
function canEditEnv(status: BatchStatus) {
  const s = status.toUpperCase().replace(/\s/g, '_');
  return s === 'IN_PROGRESS' || s === 'QA_REVIEW';
}
function canEditDeviations(status: BatchStatus) {
  const s = status.toUpperCase().replace(/\s/g, '_');
  return s === 'IN_PROGRESS' || s === 'QA_REVIEW' || s === 'QUARANTINE';
}
function canRelease(status: BatchStatus) {
  const s = status.toUpperCase().replace(/\s/g, '_');
  return s === 'IN_PROGRESS' || s === 'QA_REVIEW';
}
function isReadOnly(status: BatchStatus) {
  const s = status.toUpperCase().replace(/\s/g, '_');
  return s === 'RELEASED' || s === 'REJECTED';
}

/* ───────── Badge helper ───────── */

const badgeStyles: Record<string, { bg: string; color: string }> = {
  success: { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' },
  info: { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' },
  neutral: { bg: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' },
  danger: { bg: 'var(--pmx-red-light)', color: 'var(--pmx-red)' },
  warning: { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' },
  teal: { bg: 'var(--pmx-teal-light)', color: 'var(--pmx-teal)' },
};

function statusBadgeClass(status: string): string {
  const s = (status || '').toUpperCase().replace(/\s/g, '_');
  if (s === 'RELEASED') return 'success';
  if (s === 'IN_PROGRESS') return 'info';
  if (s === 'QA_REVIEW') return 'warning';
  if (s === 'QUARANTINE' || s === 'REJECTED') return 'danger';
  return 'info';
}

function devStatusColor(status?: string) {
  const s = (status || '').toUpperCase();
  if (s === 'OPEN') return { bg: 'var(--pmx-red-light)', color: 'var(--pmx-red)' };
  if (s === 'INVESTIGATING') return { bg: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' };
  if (s === 'RESOLVED') return { bg: 'var(--pmx-blue-light)', color: 'var(--pmx-blue)' };
  if (s === 'CLOSED') return { bg: 'var(--pmx-green-light)', color: 'var(--pmx-green)' };
  return { bg: 'var(--pmx-gray-light)', color: 'var(--pmx-gray)' };
}

function nextDevStatus(current?: string): string | null {
  const s = (current || '').toUpperCase();
  if (s === 'OPEN') return 'INVESTIGATING';
  if (s === 'INVESTIGATING') return 'RESOLVED';
  if (s === 'RESOLVED') return 'CLOSED';
  return null;
}

function daysOpen(createdAt?: string): string {
  if (!createdAt) return '0';
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return String(days);
}

/* ───────── Main Component ───────── */

export default function BatchDetail() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  /* --- Core state --- */
  const [activeTab, setActiveTab] = useState(0);
  const [headerInfo, setHeaderInfo] = useState(DEMO_HEADER_INFO);
  const [materials, setMaterials] = useState<Material[]>(DEMO_MATERIALS);
  const [steps, setSteps] = useState<Step[]>(DEMO_STEPS);
  const [qcTests, setQcTests] = useState<QCTest[]>(DEMO_QC_TESTS);
  const [envData, setEnvData] = useState<EnvReading[]>(DEMO_ENV_DATA);
  const [deviations, setDeviations] = useState<Deviation[]>(DEMO_DEVIATIONS);
  const [signatures, setSignatures] = useState<Signature[]>(DEMO_SIGNATURES);
  const [batchTitle, setBatchTitle] = useState(`eBMR \u2014 ${batchId || 'LHR-2026-0031'}`);
  const [productDesc, setProductDesc] = useState('Metformin Hydrochloride Tablets 500mg \u00B7 DRAP Reg: PKR-DRG-18-3421');
  const [batchStatus, setBatchStatus] = useState<BatchStatus>('Released');
  const [productId, setProductId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* --- User info --- */
  const [signerName, setSignerName] = useState('Dr. Farrukh Ali');
  const [signerRole, setSignerRole] = useState('SELLER_QA');

  /* --- Inline form states --- */
  const [matForm, setMatForm] = useState({ type: 'Excipient', name: '', supplier: '', lot: '', qty: '', unit: 'g', coaRef: '' });
  const [matSubmitting, setMatSubmitting] = useState(false);
  const [matError, setMatError] = useState<string | null>(null);
  const [matSuccess, setMatSuccess] = useState<string | null>(null);

  const [stepForm, setStepForm] = useState({ desc: '', equipment: '', params: '' });
  const [stepSubmitting, setStepSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [stepSuccess, setStepSuccess] = useState<string | null>(null);
  const [showStepForm, setShowStepForm] = useState(false);

  const [sigModal, setSigModal] = useState<{ open: boolean; action: string; defaultMeaning: string; stepNo?: number; devId?: string; mode: 'step' | 'release' | 'deviation' }>({
    open: false, action: '', defaultMeaning: '', mode: 'step',
  });

  const [qcSubmitting, setQcSubmitting] = useState<Record<number, boolean>>({});
  const [qcError, setQcError] = useState<string | null>(null);
  const [qcSuccess, setQcSuccess] = useState<string | null>(null);
  const [showCustomQcForm, setShowCustomQcForm] = useState(false);
  const [customQc, setCustomQc] = useState({ name: '', method: '', spec: '', result: '', unit: '', verdict: 'PASS' });
  const [templateLoading, setTemplateLoading] = useState(false);

  const [envForm, setEnvForm] = useState({ area: '', timestamp: '', temp: '', humidity: '', pressure: '', withinSpec: true, notes: '' });
  const [envSubmitting, setEnvSubmitting] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);
  const [envSuccess, setEnvSuccess] = useState<string | null>(null);
  const [showEnvForm, setShowEnvForm] = useState(false);

  const [devForm, setDevForm] = useState({ description: '', severity: 'Minor', capa_ref: '' });
  const [devSubmitting, setDevSubmitting] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);
  const [devSuccess, setDevSuccess] = useState<string | null>(null);
  const [showDevForm, setShowDevForm] = useState(false);
  const [devAdvanceNotes, setDevAdvanceNotes] = useState<Record<string, string>>({});

  const [showReleaseChecklist, setShowReleaseChecklist] = useState(false);

  /* --- Tab labels --- */
  const tabs = [
    'Bill of Materials',
    `Mfg. Steps (${steps.length})`,
    `QC Tests (${qcTests.length})`,
    'Environmental',
    `Deviations (${deviations.length})`,
    'E-Signatures',
  ];

  /* --- Fetch user info --- */
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data) {
          setSignerName(data.data.full_name || 'Dr. Farrukh Ali');
          setSignerRole(data.data.role || 'SELLER_QA');
        }
      })
      .catch(() => { /* use defaults */ });
  }, []);

  /* --- Fetch batch data --- */
  useEffect(() => {
    if (!batchId) { setLoading(false); return; }
    fetch(`/api/batches/${batchId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const data = d.data;
          const batch = data.batch || data;

          if (batch) {
            setBatchTitle(`eBMR \u2014 ${batch.batch_number || batchId}`);
            if (batch.product_name) setProductDesc(`${batch.product_name}${batch.drap_reg ? ` \u00B7 DRAP Reg: ${batch.drap_reg}` : ''}`);
            if (batch.status) setBatchStatus(batch.status);
            if (batch.product_id) setProductId(batch.product_id);

            const newHeader: HeaderItem[] = [
              { label: 'Batch no.:', value: batch.batch_number || batchId, mono: true },
              { label: 'Batch size:', value: batch.batch_size ? `${Number(batch.batch_size).toLocaleString()} ${batch.dosage_form || 'tablets'}` : DEMO_HEADER_INFO[1].value },
              { label: 'Yield actual:', value: batch.yield_actual ? `${Number(batch.yield_actual).toLocaleString()} (${batch.yield_percent || ''}%)` : DEMO_HEADER_INFO[2].value },
              { label: 'Shelf life:', value: batch.shelf_life || DEMO_HEADER_INFO[3].value },
              { label: 'Mfg. date:', value: batch.mfg_date || batch.manufacturing_date || DEMO_HEADER_INFO[4].value },
              { label: 'Expiry date:', value: batch.expiry_date || DEMO_HEADER_INFO[5].value },
              { label: 'Yield theoretical:', value: batch.yield_theoretical ? Number(batch.yield_theoretical).toLocaleString() : DEMO_HEADER_INFO[6].value },
              { label: 'Variance %:', value: batch.variance || DEMO_HEADER_INFO[7].value, valueColor: batch.variance_in_spec !== false ? 'var(--pmx-green)' : 'var(--pmx-red)' },
            ];
            setHeaderInfo(newHeader);
          }

          if (data.materials && Array.isArray(data.materials) && data.materials.length > 0) {
            setMaterials(data.materials.map((m: Record<string, unknown>) => ({
              id: String(m.id || ''),
              type: String(m.type || m.material_type || 'Excipient'),
              typeClass: String(m.type || m.material_type || '').toLowerCase() === 'api' ? 'info' : 'neutral',
              name: String(m.name || m.material_name || ''),
              supplier: String(m.supplier || m.supplier_name || ''),
              lot: String(m.lot || m.lot_number || ''),
              qty: String(m.qty || m.quantity || ''),
              unit: String(m.unit || 'g'),
              coaRef: String(m.coa_ref || m.supplier_coa_ref || ''),
            })));
          }

          if (data.steps && Array.isArray(data.steps) && data.steps.length > 0) {
            setSteps(data.steps.map((s: Record<string, unknown>, i: number) => ({
              step: Number(s.step_number || s.step || i + 1),
              desc: String(s.description || s.desc || ''),
              operator: String(s.operator || s.operator_name || ''),
              equipment: String(s.equipment || s.equipment_id || ''),
              params: String(s.params || s.process_params || ''),
              time: String(s.signed_at || s.time || ''),
              signed: Boolean(s.signed || s.signed_at),
              signer: String(s.signer || s.signed_by || ''),
              hash: String(s.hash || s.signature_hash || ''),
            })));
          }

          if (data.qc_tests && Array.isArray(data.qc_tests) && data.qc_tests.length > 0) {
            setQcTests(data.qc_tests.map((t: Record<string, unknown>) => ({
              id: String(t.id || ''),
              name: String(t.name || t.test_name || ''),
              method: String(t.method || t.method_reference || ''),
              spec: String(t.spec || t.specification || ''),
              result: String(t.result || ''),
              unit: String(t.unit || ''),
              verdict: String(t.verdict || t.pass_fail || 'PASS'),
              saved: true,
            })));
          }

          if (data.environmental && Array.isArray(data.environmental) && data.environmental.length > 0) {
            setEnvData(data.environmental.map((e: Record<string, unknown>) => ({
              id: String(e.id || ''),
              time: String(e.time || e.recorded_at || ''),
              area: String(e.area || e.production_area || ''),
              temp: String(e.temp || e.temperature || ''),
              humidity: String(e.humidity || ''),
              pressure: String(e.pressure || e.diff_pressure || ''),
              withinSpec: (e.within_spec as boolean) ?? (e.withinSpec as boolean) ?? true,
              by: String(e.recorded_by || e.by || ''),
            })));
          }

          if (data.deviations && Array.isArray(data.deviations)) {
            setDeviations(data.deviations.map((dev: Record<string, unknown>) => ({
              id: String(dev.id || ''),
              deviation_id: String(dev.deviation_id || dev.id || ''),
              classification: String(dev.classification || dev.severity || ''),
              severity: String(dev.severity || dev.classification || ''),
              description: String(dev.description || ''),
              capa_ref: String(dev.capa_ref || ''),
              status: String(dev.status || 'OPEN'),
              created_at: String(dev.created_at || ''),
              investigation_notes: String(dev.investigation_notes || ''),
              resolution_notes: String(dev.resolution_notes || ''),
            })));
          }

          if (data.signatures && Array.isArray(data.signatures) && data.signatures.length > 0) {
            setSignatures(data.signatures.map((s: Record<string, unknown>) => ({
              title: String(s.title || ''),
              signer: String(s.signer || ''),
              meaning: String(s.meaning || ''),
              date: String(s.date || s.signed_at || ''),
              hash: String(s.hash || ''),
              color: String(s.color || 'var(--pmx-green)'),
              extra: s.extra ? String(s.extra) : undefined,
            })));
          }
        }
      })
      .catch(() => { setError('Failed to load batch details. Showing demo data.'); })
      .finally(() => setLoading(false));
  }, [batchId]);

  /* ───────── Material form handlers ───────── */

  const handleAddMaterial = useCallback(async () => {
    if (!matForm.name || !matForm.qty) {
      setMatError('Name and Quantity are required.');
      return;
    }
    setMatSubmitting(true);
    setMatError(null);
    setMatSuccess(null);
    try {
      const res = await fetch(`/api/batches/${batchId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_type: matForm.type,
          material_name: matForm.name,
          supplier_name: matForm.supplier,
          lot_number: matForm.lot,
          quantity: matForm.qty,
          unit: matForm.unit,
          supplier_coa_ref: matForm.coaRef,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add material');

      const newMat: Material = {
        id: data.data?.id,
        type: matForm.type,
        typeClass: matForm.type.toLowerCase() === 'api' ? 'info' : 'neutral',
        name: matForm.name,
        supplier: matForm.supplier,
        lot: matForm.lot,
        qty: matForm.qty,
        unit: matForm.unit,
        coaRef: matForm.coaRef,
      };
      setMaterials((prev) => [...prev, newMat]);
      setMatForm({ type: 'Excipient', name: '', supplier: '', lot: '', qty: '', unit: 'g', coaRef: '' });
      setMatSuccess('Material added.');
      setTimeout(() => setMatSuccess(null), 3000);
    } catch (err: unknown) {
      setMatError(err instanceof Error ? err.message : 'Failed to add material');
    } finally {
      setMatSubmitting(false);
    }
  }, [batchId, matForm]);

  const handleDeleteMaterial = useCallback(async (index: number) => {
    const mat = materials[index];
    if (!mat.id) {
      setMaterials((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    try {
      const res = await fetch(`/api/batches/${batchId}/materials/${mat.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete');
      setMaterials((prev) => prev.filter((_, i) => i !== index));
    } catch (err: unknown) {
      setMatError(err instanceof Error ? err.message : 'Failed to delete material');
    }
  }, [batchId, materials]);

  /* ───────── Step form handlers ───────── */

  const handleAddStep = useCallback(async () => {
    if (!stepForm.desc) {
      setStepError('Description is required.');
      return;
    }
    setStepSubmitting(true);
    setStepError(null);
    setStepSuccess(null);
    try {
      const nextStepNo = steps.length > 0 ? Math.max(...steps.map((s) => s.step)) + 1 : 1;
      const res = await fetch(`/api/batches/${batchId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_number: nextStepNo,
          description: stepForm.desc,
          equipment_id: stepForm.equipment,
          process_params: stepForm.params,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add step');

      const newStep: Step = {
        step: nextStepNo,
        desc: stepForm.desc,
        operator: signerName,
        equipment: stepForm.equipment,
        params: stepForm.params,
        time: '',
        signed: false,
      };
      setSteps((prev) => [...prev, newStep]);
      setStepForm({ desc: '', equipment: '', params: '' });
      setShowStepForm(false);
      setStepSuccess('Step added.');
      setTimeout(() => setStepSuccess(null), 3000);
    } catch (err: unknown) {
      setStepError(err instanceof Error ? err.message : 'Failed to add step');
    } finally {
      setStepSubmitting(false);
    }
  }, [batchId, stepForm, steps, signerName]);

  const handleSignStep = useCallback((stepNo: number) => {
    const step = steps.find((s) => s.step === stepNo);
    if (!step) return;
    setSigModal({
      open: true,
      action: `Sign Manufacturing Step ${stepNo}`,
      defaultMeaning: `Completed ${step.desc} as ${signerRole}`,
      stepNo,
      mode: 'step',
    });
  }, [steps, signerRole]);

  /* ───────── QC Test handlers ───────── */

  const handleLoadTemplate = useCallback(async () => {
    if (!productId) {
      setQcError('No product ID associated with this batch.');
      return;
    }
    setTemplateLoading(true);
    setQcError(null);
    try {
      const res = await fetch(`/api/products/${productId}/qc-templates`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load templates');

      const templates = Array.isArray(data.data) ? data.data : data.data?.items || [];
      if (templates.length === 0) throw new Error('No QC templates found for this product');

      const newTests: QCTest[] = templates.map((t: Record<string, unknown>) => ({
        name: String(t.test_name || t.name || ''),
        method: String(t.method_reference || t.method || ''),
        spec: String(t.specification || t.spec || ''),
        result: '',
        unit: String(t.result_unit || t.unit || ''),
        verdict: '',
        fromTemplate: true,
        saved: false,
      }));
      setQcTests((prev) => [...prev, ...newTests]);
      setQcSuccess('Template tests loaded.');
      setTimeout(() => setQcSuccess(null), 3000);
    } catch (err: unknown) {
      setQcError(err instanceof Error ? err.message : 'Failed to load QC templates');
    } finally {
      setTemplateLoading(false);
    }
  }, [productId]);

  const handleSaveQcResult = useCallback(async (index: number) => {
    const test = qcTests[index];
    if (!test.result) {
      setQcError('Please enter a result before saving.');
      return;
    }
    setQcSubmitting((prev) => ({ ...prev, [index]: true }));
    setQcError(null);
    try {
      const res = await fetch(`/api/batches/${batchId}/qc-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_name: test.name,
          method_reference: test.method,
          specification: test.spec,
          result: test.result,
          result_unit: test.unit,
          pass_fail: test.verdict || 'PASS',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save QC result');

      setQcTests((prev) =>
        prev.map((t, i) => i === index ? { ...t, saved: true, id: data.data?.id || t.id } : t)
      );
      setQcSuccess('Result saved.');
      setTimeout(() => setQcSuccess(null), 3000);
    } catch (err: unknown) {
      setQcError(err instanceof Error ? err.message : 'Failed to save QC result');
    } finally {
      setQcSubmitting((prev) => ({ ...prev, [index]: false }));
    }
  }, [batchId, qcTests]);

  const handleAddCustomQc = useCallback(() => {
    if (!customQc.name) {
      setQcError('Test name is required.');
      return;
    }
    setQcTests((prev) => [...prev, { ...customQc, fromTemplate: false, saved: false }]);
    setCustomQc({ name: '', method: '', spec: '', result: '', unit: '', verdict: 'PASS' });
    setShowCustomQcForm(false);
  }, [customQc]);

  /* ───────── Environmental form handlers ───────── */

  const handleAddEnvReading = useCallback(async () => {
    if (!envForm.area || !envForm.temp) {
      setEnvError('Production area and temperature are required.');
      return;
    }
    setEnvSubmitting(true);
    setEnvError(null);
    setEnvSuccess(null);
    try {
      const ts = envForm.timestamp || new Date().toISOString();
      const res = await fetch(`/api/batches/${batchId}/environmental`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          production_area: envForm.area,
          recorded_at: ts,
          temperature: parseFloat(envForm.temp),
          humidity: envForm.humidity ? parseFloat(envForm.humidity) : null,
          diff_pressure: envForm.pressure ? parseFloat(envForm.pressure) : null,
          within_spec: envForm.withinSpec,
          notes: envForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add reading');

      const timeStr = new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setEnvData((prev) => [...prev, {
        id: data.data?.id,
        time: timeStr,
        area: envForm.area,
        temp: envForm.temp,
        humidity: envForm.humidity,
        pressure: envForm.pressure,
        withinSpec: envForm.withinSpec,
        by: signerName,
      }]);
      setEnvForm({ area: '', timestamp: '', temp: '', humidity: '', pressure: '', withinSpec: true, notes: '' });
      setShowEnvForm(false);
      setEnvSuccess('Environmental reading added.');
      setTimeout(() => setEnvSuccess(null), 3000);
    } catch (err: unknown) {
      setEnvError(err instanceof Error ? err.message : 'Failed to add environmental reading');
    } finally {
      setEnvSubmitting(false);
    }
  }, [batchId, envForm, signerName]);

  /* ───────── Deviation handlers ───────── */

  const handleReportDeviation = useCallback(async () => {
    if (!devForm.description) {
      setDevError('Description is required.');
      return;
    }
    setDevSubmitting(true);
    setDevError(null);
    setDevSuccess(null);
    try {
      const res = await fetch(`/api/batches/${batchId}/deviations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: devForm.description,
          severity: devForm.severity,
          capa_ref: devForm.capa_ref,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to report deviation');

      const newDev: Deviation = {
        id: data.data?.id || `DEV-${deviations.length + 1}`,
        deviation_id: data.data?.deviation_id || `DEV-${deviations.length + 1}`,
        severity: devForm.severity,
        classification: devForm.severity,
        description: devForm.description,
        capa_ref: devForm.capa_ref,
        status: 'OPEN',
        created_at: new Date().toISOString(),
      };
      setDeviations((prev) => [...prev, newDev]);
      setDevForm({ description: '', severity: 'Minor', capa_ref: '' });
      setShowDevForm(false);
      setDevSuccess('Deviation reported.');
      setTimeout(() => setDevSuccess(null), 3000);

      // Critical deviation auto-quarantines
      if (devForm.severity === 'Critical') {
        setBatchStatus('QUARANTINE');
      }
    } catch (err: unknown) {
      setDevError(err instanceof Error ? err.message : 'Failed to report deviation');
    } finally {
      setDevSubmitting(false);
    }
  }, [batchId, devForm, deviations.length]);

  const handleAdvanceDeviation = useCallback((devId: string) => {
    const dev = deviations.find((d) => (d.id || d.deviation_id) === devId);
    if (!dev) return;
    const next = nextDevStatus(dev.status);
    if (!next) return;

    setSigModal({
      open: true,
      action: `Advance Deviation ${devId} to ${next}`,
      defaultMeaning: next === 'INVESTIGATING' ? 'Investigated deviation' : next === 'RESOLVED' ? 'Investigated and resolved deviation' : 'Confirmed deviation closed',
      devId,
      mode: 'deviation',
    });
  }, [deviations]);

  /* ───────── Signature modal confirm ───────── */

  const handleSigConfirm = useCallback(async (password: string, meaning: string) => {
    if (sigModal.mode === 'step' && sigModal.stepNo != null) {
      const res = await fetch(`/api/batches/${batchId}/steps/${sigModal.stepNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, meaning }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Signature failed');

      setSteps((prev) =>
        prev.map((s) =>
          s.step === sigModal.stepNo
            ? { ...s, signed: true, signer: signerName, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' UTC', hash: data.data?.hash || 'verified' }
            : s
        )
      );
      setSigModal((prev) => ({ ...prev, open: false }));
    } else if (sigModal.mode === 'release') {
      const res = await fetch(`/api/batches/${batchId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, meaning }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Release failed');

      setBatchStatus('RELEASED');
      setSigModal((prev) => ({ ...prev, open: false }));
      setShowReleaseChecklist(false);
      setTimeout(() => {
        router.push(`/seller/coa/${batchId}`);
      }, 800);
    } else if (sigModal.mode === 'deviation' && sigModal.devId) {
      const dev = deviations.find((d) => (d.id || d.deviation_id) === sigModal.devId);
      const next = nextDevStatus(dev?.status);
      const notes = devAdvanceNotes[sigModal.devId] || '';
      const res = await fetch(`/api/batches/${batchId}/deviations/${sigModal.devId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_status: next,
          password,
          meaning,
          investigation_notes: next === 'INVESTIGATING' || next === 'RESOLVED' ? notes : undefined,
          resolution_notes: next === 'RESOLVED' || next === 'CLOSED' ? notes : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Status update failed');

      setDeviations((prev) =>
        prev.map((d) => {
          if ((d.id || d.deviation_id) === sigModal.devId) {
            return {
              ...d,
              status: next || d.status,
              investigation_notes: next === 'INVESTIGATING' ? notes : d.investigation_notes,
              resolution_notes: next === 'RESOLVED' || next === 'CLOSED' ? notes : d.resolution_notes,
            };
          }
          return d;
        })
      );
      setSigModal((prev) => ({ ...prev, open: false }));
    }
  }, [sigModal, batchId, signerName, deviations, devAdvanceNotes, router]);

  /* ───────── Release checklist ───────── */

  const releaseChecks = [
    { label: 'Materials added', pass: materials.length > 0, detail: `${materials.length} material(s)` },
    { label: 'All steps signed', pass: steps.length > 0 && steps.every((s) => s.signed), detail: steps.length === 0 ? 'No steps added' : `${steps.filter((s) => s.signed).length}/${steps.length} signed` },
    { label: 'All QC tests entered and PASS', pass: qcTests.length > 0 && qcTests.every((t) => t.verdict === 'PASS' && t.saved), detail: qcTests.length === 0 ? 'No QC tests' : `${qcTests.filter((t) => t.verdict === 'PASS' && t.saved).length}/${qcTests.length} passing` },
    { label: 'No open Critical/Major deviations', pass: !deviations.some((d) => (d.status === 'OPEN' || d.status === 'INVESTIGATING') && (d.severity === 'Critical' || d.severity === 'Major')), detail: deviations.filter((d) => (d.status === 'OPEN' || d.status === 'INVESTIGATING') && (d.severity === 'Critical' || d.severity === 'Major')).length > 0 ? `${deviations.filter((d) => (d.status === 'OPEN' || d.status === 'INVESTIGATING') && (d.severity === 'Critical' || d.severity === 'Major')).length} open Critical/Major` : 'None' },
    { label: 'Environmental readings recorded', pass: envData.length > 0, detail: `${envData.length} reading(s)` },
  ];
  const allChecksPassed = releaseChecks.every((c) => c.pass);

  /* ───────── Loading ───────── */

  if (loading) {
    return (
      <div style={{ padding: 20, minHeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--pmx-teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>Loading batch details...</div>
        </div>
      </div>
    );
  }

  /* ───────── Render ───────── */

  return (
    <div className="animate-fade-in-up" style={{ padding: 20, minHeight: 600 }}>
      {error && (
        <div style={{ padding: '8px 12px', background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)', borderRadius: 8, fontSize: 12, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <span onClick={() => setError(null)} style={{ cursor: 'pointer', fontWeight: 700 }}>&times;</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav style={{ fontSize: 11, color: 'var(--pmx-tx3)', marginBottom: 12 }}>
        <Link href="/seller/dashboard" style={{ color: 'var(--pmx-tx3)', textDecoration: 'none' }}>Dashboard</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <Link href="/seller/batches" style={{ color: 'var(--pmx-tx3)', textDecoration: 'none' }}>Batches</Link>
        <span style={{ margin: '0 6px' }}>/</span>
        <span style={{ color: 'var(--pmx-tx2)' }}>{batchId}</span>
      </nav>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pmx-tx)', marginBottom: 2 }}>
            {batchTitle.split('\u2014')[0]}&mdash; <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16 }}>{batchId}</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--pmx-tx2)' }}>{productDesc}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: badgeStyles[statusBadgeClass(batchStatus)]?.bg, color: badgeStyles[statusBadgeClass(batchStatus)]?.color }}>
            {batchStatus}
          </span>
          {canRelease(batchStatus) && (
            <button
              onClick={() => setShowReleaseChecklist(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: 'var(--pmx-teal)',
                color: '#fff',
                fontFamily: 'inherit',
              }}
            >
              Release Batch
            </button>
          )}
          <Link
            href={`/seller/coa/${batchId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 9px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              border: '0.5px solid var(--input)',
              background: 'var(--pmx-bg)',
              color: 'var(--pmx-tx)',
              textDecoration: 'none',
              fontFamily: 'inherit',
            }}
          >
            View CoA &#8599;
          </Link>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12 }}>
          {headerInfo.map((h) => (
            <div key={h.label}>
              <span style={{ color: 'var(--pmx-tx2)' }}>{h.label}</span><br />
              <strong style={{ fontFamily: h.mono ? "'IBM Plex Mono', monospace" : 'inherit', color: h.valueColor || 'var(--pmx-tx)' }}>{h.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 16 }}>
        {tabs.map((t, i) => (
          <div
            key={t}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 500,
              color: activeTab === i ? 'var(--pmx-teal)' : 'var(--pmx-tx2)',
              cursor: 'pointer',
              borderBottom: activeTab === i ? '2px solid var(--pmx-teal)' : '2px solid transparent',
              marginBottom: -0.5,
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* ═══════ TAB 0: Bill of Materials ═══════ */}
      {activeTab === 0 && (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Type', 'Material', 'Supplier', 'Lot no.', 'Qty used', 'Unit', 'Supplier CoA ref', ...(canEditMaterials(batchStatus) ? [''] : [])].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.map((m, i) => (
                <tr key={i}>
                  <td style={tdStyle}><span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: badgeStyles[m.typeClass]?.bg, color: badgeStyles[m.typeClass]?.color }}>{m.type}</span></td>
                  <td style={tdStyle}>{m.name}</td>
                  <td style={tdStyle}>{m.supplier}</td>
                  <td style={tdStyle}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{m.lot}</span></td>
                  <td style={tdStyle}>{m.qty}</td>
                  <td style={tdStyle}>{m.unit}</td>
                  <td style={tdStyle}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{m.coaRef}</span></td>
                  {canEditMaterials(batchStatus) && (
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDeleteMaterial(i)}
                        title="Remove material"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pmx-red)', fontSize: 14, fontWeight: 700, padding: '2px 6px' }}
                      >
                        &times;
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add material form */}
          {canEditMaterials(batchStatus) && (
            <div style={{ marginTop: 12, padding: 14, background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Add Material</div>
              {matError && <div style={formErrorStyle}>{matError}</div>}
              {matSuccess && <div style={formSuccessStyle}>{matSuccess}</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr 80px 70px 1fr', gap: 8, alignItems: 'end' }}>
                <div>
                  <label style={miniLabelStyle}>Type</label>
                  <select value={matForm.type} onChange={(e) => setMatForm((f) => ({ ...f, type: e.target.value }))} style={miniInputStyle}>
                    <option value="API">API</option>
                    <option value="Excipient">Excipient</option>
                  </select>
                </div>
                <div>
                  <label style={miniLabelStyle}>Name *</label>
                  <input value={matForm.name} onChange={(e) => setMatForm((f) => ({ ...f, name: e.target.value }))} style={miniInputStyle} placeholder="Material name" />
                </div>
                <div>
                  <label style={miniLabelStyle}>Supplier</label>
                  <input value={matForm.supplier} onChange={(e) => setMatForm((f) => ({ ...f, supplier: e.target.value }))} style={miniInputStyle} placeholder="Supplier" />
                </div>
                <div>
                  <label style={miniLabelStyle}>Lot No.</label>
                  <input value={matForm.lot} onChange={(e) => setMatForm((f) => ({ ...f, lot: e.target.value }))} style={{ ...miniInputStyle, fontFamily: "'IBM Plex Mono', monospace" }} placeholder="Lot" />
                </div>
                <div>
                  <label style={miniLabelStyle}>Qty *</label>
                  <input value={matForm.qty} onChange={(e) => setMatForm((f) => ({ ...f, qty: e.target.value }))} style={miniInputStyle} placeholder="Qty" />
                </div>
                <div>
                  <label style={miniLabelStyle}>Unit</label>
                  <select value={matForm.unit} onChange={(e) => setMatForm((f) => ({ ...f, unit: e.target.value }))} style={miniInputStyle}>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                  </select>
                </div>
                <div>
                  <label style={miniLabelStyle}>CoA Ref</label>
                  <input value={matForm.coaRef} onChange={(e) => setMatForm((f) => ({ ...f, coaRef: e.target.value }))} style={{ ...miniInputStyle, fontFamily: "'IBM Plex Mono', monospace" }} placeholder="CoA ref" />
                </div>
              </div>
              <button onClick={handleAddMaterial} disabled={matSubmitting} style={{ ...btnTealSmStyle, marginTop: 10 }}>
                {matSubmitting ? 'Adding...' : '+ Add Material'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════ TAB 1: Manufacturing Steps ═══════ */}
      {activeTab === 1 && (
        <>
          {stepError && <div style={formErrorStyle}>{stepError}</div>}
          {stepSuccess && <div style={formSuccessStyle}>{stepSuccess}</div>}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Step', 'Description', 'Operator', 'Equipment', 'Process params', 'Status', 'Signed'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {steps.map((s) => (
                <tr key={s.step}>
                  <td style={tdStyle}><strong>{s.step}</strong></td>
                  <td style={tdStyle}>{s.desc}</td>
                  <td style={tdStyle}>{s.operator}</td>
                  <td style={tdStyle}>{s.equipment}</td>
                  <td style={tdStyle}>{s.params}</td>
                  <td style={tdStyle}>
                    {s.signed ? (
                      <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'var(--pmx-green-light)', color: 'var(--pmx-green)' }}>Complete</span>
                    ) : canEditSteps(batchStatus) ? (
                      <button onClick={() => handleSignStep(s.step)} style={btnTealSmStyle}>
                        Sign Step
                      </button>
                    ) : (
                      <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: 'var(--pmx-amber-light)', color: 'var(--pmx-amber)' }}>Pending</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {s.signed ? (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--pmx-green)' }}>
                        {'\u2713'} {s.time}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--pmx-tx3)' }}>&mdash;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add Step form */}
          {canEditSteps(batchStatus) && (
            <div style={{ marginTop: 10 }}>
              {!showStepForm ? (
                <button onClick={() => setShowStepForm(true)} style={btnSmStyle}>+ Add Step</button>
              ) : (
                <div style={{ padding: 14, background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>
                    Add Step {steps.length > 0 ? Math.max(...steps.map((s) => s.step)) + 1 : 1}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <div>
                      <label style={miniLabelStyle}>Description *</label>
                      <input value={stepForm.desc} onChange={(e) => setStepForm((f) => ({ ...f, desc: e.target.value }))} style={miniInputStyle} placeholder="Step description" />
                    </div>
                    <div>
                      <label style={miniLabelStyle}>Equipment ID</label>
                      <input value={stepForm.equipment} onChange={(e) => setStepForm((f) => ({ ...f, equipment: e.target.value }))} style={miniInputStyle} placeholder="Equipment ID" />
                    </div>
                    <div>
                      <label style={miniLabelStyle}>Process Params</label>
                      <input value={stepForm.params} onChange={(e) => setStepForm((f) => ({ ...f, params: e.target.value }))} style={miniInputStyle} placeholder="Process parameters" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleAddStep} disabled={stepSubmitting} style={btnTealSmStyle}>
                      {stepSubmitting ? 'Adding...' : '+ Add Step'}
                    </button>
                    <button onClick={() => { setShowStepForm(false); setStepError(null); }} style={btnSmStyle}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 10, padding: 10, background: 'var(--pmx-blue-light)', borderRadius: 8, fontSize: 11, color: 'var(--pmx-blue)' }}>
            21 CFR Part 11: Every step signature re-verified password at time of signing. Meaning of signature recorded. SHA-256 hash computed at moment of signing.
          </div>
        </>
      )}

      {/* ═══════ TAB 2: QC Tests ═══════ */}
      {activeTab === 2 && (
        <>
          {qcError && <div style={formErrorStyle}>{qcError}</div>}
          {qcSuccess && <div style={formSuccessStyle}>{qcSuccess}</div>}

          {canEditQC(batchStatus) && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={handleLoadTemplate} disabled={templateLoading} style={btnTealSmStyle}>
                {templateLoading ? 'Loading...' : 'Load Product Template'}
              </button>
              <button onClick={() => setShowCustomQcForm(!showCustomQcForm)} style={btnSmStyle}>
                + Add Custom Test
              </button>
            </div>
          )}

          {showCustomQcForm && canEditQC(batchStatus) && (
            <div style={{ padding: 14, background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Custom Test</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 70px', gap: 8, marginBottom: 10 }}>
                <div>
                  <label style={miniLabelStyle}>Test Name *</label>
                  <input value={customQc.name} onChange={(e) => setCustomQc((f) => ({ ...f, name: e.target.value }))} style={miniInputStyle} placeholder="Test name" />
                </div>
                <div>
                  <label style={miniLabelStyle}>Method</label>
                  <input value={customQc.method} onChange={(e) => setCustomQc((f) => ({ ...f, method: e.target.value }))} style={miniInputStyle} placeholder="Method reference" />
                </div>
                <div>
                  <label style={miniLabelStyle}>Specification</label>
                  <input value={customQc.spec} onChange={(e) => setCustomQc((f) => ({ ...f, spec: e.target.value }))} style={miniInputStyle} placeholder="Specification" />
                </div>
                <div>
                  <label style={miniLabelStyle}>Unit</label>
                  <input value={customQc.unit} onChange={(e) => setCustomQc((f) => ({ ...f, unit: e.target.value }))} style={miniInputStyle} placeholder="Unit" />
                </div>
                <div>
                  <label style={miniLabelStyle}>Verdict</label>
                  <select value={customQc.verdict} onChange={(e) => setCustomQc((f) => ({ ...f, verdict: e.target.value }))} style={miniInputStyle}>
                    <option value="PASS">PASS</option>
                    <option value="FAIL">FAIL</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleAddCustomQc} style={btnTealSmStyle}>+ Add Test</button>
                <button onClick={() => setShowCustomQcForm(false)} style={btnSmStyle}>Cancel</button>
              </div>
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Test name', 'Method reference', 'Specification', 'Result', 'Unit', 'Verdict', ...(canEditQC(batchStatus) ? ['Action'] : ['Analyst'])].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {qcTests.map((t, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{t.name}</td>
                  <td style={tdStyle}>{t.method}</td>
                  <td style={tdStyle}>{t.spec}</td>
                  <td style={tdStyle}>
                    {canEditQC(batchStatus) && !t.saved ? (
                      <input
                        value={t.result}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQcTests((prev) => prev.map((test, idx) => idx === i ? { ...test, result: val } : test));
                        }}
                        style={{ ...miniInputStyle, width: 80 }}
                        placeholder="Result"
                      />
                    ) : (
                      t.result
                    )}
                  </td>
                  <td style={tdStyle}>{t.unit}</td>
                  <td style={tdStyle}>
                    {canEditQC(batchStatus) && !t.saved ? (
                      <select
                        value={t.verdict}
                        onChange={(e) => {
                          const val = e.target.value;
                          setQcTests((prev) => prev.map((test, idx) => idx === i ? { ...test, verdict: val } : test));
                        }}
                        style={{ ...miniInputStyle, width: 70, background: t.verdict === 'PASS' ? 'var(--pmx-green-light)' : t.verdict === 'FAIL' ? 'var(--pmx-red-light)' : 'var(--pmx-bg)' }}
                      >
                        <option value="">--</option>
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                      </select>
                    ) : (
                      <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: t.verdict === 'PASS' ? 'var(--pmx-green-light)' : 'var(--pmx-red-light)', color: t.verdict === 'PASS' ? 'var(--pmx-green)' : 'var(--pmx-red)' }}>
                        {t.verdict}
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {canEditQC(batchStatus) && !t.saved ? (
                      <button onClick={() => handleSaveQcResult(i)} disabled={qcSubmitting[i]} style={btnTealSmStyle}>
                        {qcSubmitting[i] ? '...' : 'Save'}
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--pmx-tx2)' }}>{t.saved ? '\u2713 Saved' : signerName}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ═══════ TAB 3: Environmental ═══════ */}
      {activeTab === 3 && (
        <>
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)', marginBottom: 12 }}>
            Environmental monitoring per production area &mdash; temperature, humidity, differential pressure. Out-of-spec readings must be documented as deviations (documenting does NOT penalise CQS &mdash; hiding does).
          </div>

          {envError && <div style={formErrorStyle}>{envError}</div>}
          {envSuccess && <div style={formSuccessStyle}>{envSuccess}</div>}

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Time (UTC)', 'Production area', 'Temp (\u00B0C)', 'Humidity (%)', 'Diff. pressure (Pa)', 'Within spec', 'Recorded by'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {envData.map((e, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{e.time}</td>
                  <td style={tdStyle}>{e.area}</td>
                  <td style={tdStyle}>{e.temp}</td>
                  <td style={tdStyle}>{e.humidity}</td>
                  <td style={tdStyle}>{e.pressure}</td>
                  <td style={tdStyle}><span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: e.withinSpec ? 'var(--pmx-green-light)' : 'var(--pmx-red-light)', color: e.withinSpec ? 'var(--pmx-green)' : 'var(--pmx-red)' }}>{e.withinSpec ? '\u2713 Yes' : '\u2717 No'}</span></td>
                  <td style={tdStyle}>{e.by}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {canEditEnv(batchStatus) && (
            <div style={{ marginTop: 10 }}>
              {!showEnvForm ? (
                <button onClick={() => setShowEnvForm(true)} style={btnSmStyle}>+ Add environmental reading</button>
              ) : (
                <div style={{ padding: 14, background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Add Environmental Reading</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px 80px auto', gap: 8, marginBottom: 10 }}>
                    <div>
                      <label style={miniLabelStyle}>Production Area *</label>
                      <input value={envForm.area} onChange={(e) => setEnvForm((f) => ({ ...f, area: e.target.value }))} style={miniInputStyle} placeholder="Area" />
                    </div>
                    <div>
                      <label style={miniLabelStyle}>Timestamp</label>
                      <input type="datetime-local" value={envForm.timestamp} onChange={(e) => setEnvForm((f) => ({ ...f, timestamp: e.target.value }))} style={miniInputStyle} />
                    </div>
                    <div>
                      <label style={miniLabelStyle}>Temp (&deg;C) *</label>
                      <input value={envForm.temp} onChange={(e) => setEnvForm((f) => ({ ...f, temp: e.target.value }))} style={miniInputStyle} placeholder="22.3" />
                    </div>
                    <div>
                      <label style={miniLabelStyle}>Humidity (%)</label>
                      <input value={envForm.humidity} onChange={(e) => setEnvForm((f) => ({ ...f, humidity: e.target.value }))} style={miniInputStyle} placeholder="44.1" />
                    </div>
                    <div>
                      <label style={miniLabelStyle}>Pressure (Pa)</label>
                      <input value={envForm.pressure} onChange={(e) => setEnvForm((f) => ({ ...f, pressure: e.target.value }))} style={miniInputStyle} placeholder="12.5" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--pmx-tx2)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={envForm.withinSpec} onChange={(e) => setEnvForm((f) => ({ ...f, withinSpec: e.target.checked }))} style={{ accentColor: 'var(--pmx-teal)' }} />
                        Within Spec
                      </label>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={miniLabelStyle}>Notes</label>
                    <input value={envForm.notes} onChange={(e) => setEnvForm((f) => ({ ...f, notes: e.target.value }))} style={miniInputStyle} placeholder="Optional notes" />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleAddEnvReading} disabled={envSubmitting} style={btnTealSmStyle}>
                      {envSubmitting ? 'Adding...' : '+ Add Reading'}
                    </button>
                    <button onClick={() => { setShowEnvForm(false); setEnvError(null); }} style={btnSmStyle}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════ TAB 4: Deviations ═══════ */}
      {activeTab === 4 && (
        <div>
          {devError && <div style={formErrorStyle}>{devError}</div>}
          {devSuccess && <div style={formSuccessStyle}>{devSuccess}</div>}

          {deviations.length === 0 ? (
            <>
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--pmx-tx2)', fontSize: 12 }}>
                No deviations recorded for this batch. Any departure from procedure must be documented immediately with classification (Critical / Major / Minor) and CAPA reference.
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {deviations.map((dev, i) => {
                const devId = dev.id || dev.deviation_id || `DEV-${i + 1}`;
                const statusColor = devStatusColor(dev.status);
                const next = nextDevStatus(dev.status);
                const isExpanded = dev.expanded;

                return (
                  <div key={devId} style={{ background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    {/* Header row */}
                    <div
                      onClick={() => setDeviations((prev) => prev.map((d, idx) => idx === i ? { ...d, expanded: !d.expanded } : d))}
                      style={{ display: 'grid', gridTemplateColumns: '80px 80px 1fr 100px 80px 60px', gap: 8, padding: '10px 14px', cursor: 'pointer', alignItems: 'center', fontSize: 12 }}
                    >
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--pmx-teal)' }}>{devId}</span>
                      <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: dev.severity === 'Critical' ? 'var(--pmx-red-light)' : dev.severity === 'Major' ? 'var(--pmx-amber-light)' : 'var(--pmx-blue-light)', color: dev.severity === 'Critical' ? 'var(--pmx-red)' : dev.severity === 'Major' ? 'var(--pmx-amber)' : 'var(--pmx-blue)' }}>
                        {dev.severity || dev.classification}
                      </span>
                      <span>{dev.description}</span>
                      <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500, background: statusColor.bg, color: statusColor.color }}>{dev.status}</span>
                      <span style={{ fontSize: 10, color: 'var(--pmx-tx3)' }}>{daysOpen(dev.created_at)}d open</span>
                      <span style={{ fontSize: 11, color: 'var(--pmx-tx3)' }}>{isExpanded ? '\u25B2' : '\u25BC'}</span>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div style={{ padding: '0 14px 14px', borderTop: '0.5px solid var(--border)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10, fontSize: 12 }}>
                          <div>
                            <div style={miniLabelStyle}>CAPA Reference</div>
                            <div style={{ color: 'var(--pmx-tx)' }}>{dev.capa_ref || '\u2014'}</div>
                          </div>
                          <div>
                            <div style={miniLabelStyle}>Created</div>
                            <div style={{ color: 'var(--pmx-tx)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{dev.created_at || '\u2014'}</div>
                          </div>
                        </div>
                        {dev.investigation_notes && (
                          <div style={{ marginTop: 8 }}>
                            <div style={miniLabelStyle}>Investigation Notes</div>
                            <div style={{ fontSize: 12, color: 'var(--pmx-tx)' }}>{dev.investigation_notes}</div>
                          </div>
                        )}
                        {dev.resolution_notes && (
                          <div style={{ marginTop: 8 }}>
                            <div style={miniLabelStyle}>Resolution Notes</div>
                            <div style={{ fontSize: 12, color: 'var(--pmx-tx)' }}>{dev.resolution_notes}</div>
                          </div>
                        )}

                        {/* Advance status */}
                        {canEditDeviations(batchStatus) && next && (
                          <div style={{ marginTop: 12, padding: 10, background: 'var(--pmx-bg2)', borderRadius: 8 }}>
                            <div style={miniLabelStyle}>Notes for advancing to {next}</div>
                            <textarea
                              value={devAdvanceNotes[devId] || ''}
                              onChange={(e) => setDevAdvanceNotes((prev) => ({ ...prev, [devId]: e.target.value }))}
                              rows={2}
                              style={{ ...miniInputStyle, resize: 'vertical', width: '100%', minHeight: 40 }}
                              placeholder={next === 'INVESTIGATING' ? 'Investigation notes...' : next === 'RESOLVED' ? 'Resolution notes...' : 'Closing notes...'}
                            />
                            <button onClick={() => handleAdvanceDeviation(devId)} style={{ ...btnTealSmStyle, marginTop: 8 }}>
                              Advance to {next}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Report deviation form */}
          {canEditDeviations(batchStatus) && (
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              {!showDevForm ? (
                <button onClick={() => setShowDevForm(true)} style={btnSmStyle}>+ Report deviation</button>
              ) : (
                <div style={{ textAlign: 'left', padding: 14, background: 'var(--pmx-bg)', border: '0.5px solid var(--border)', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pmx-tx2)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 10 }}>Report Deviation</div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={miniLabelStyle}>Description *</label>
                    <textarea
                      value={devForm.description}
                      onChange={(e) => setDevForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                      style={{ ...miniInputStyle, resize: 'vertical', width: '100%', minHeight: 60 }}
                      placeholder="Describe the deviation..."
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                    <div>
                      <label style={miniLabelStyle}>Severity *</label>
                      <select value={devForm.severity} onChange={(e) => setDevForm((f) => ({ ...f, severity: e.target.value }))} style={miniInputStyle}>
                        <option value="Minor">Minor</option>
                        <option value="Major">Major</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label style={miniLabelStyle}>CAPA Reference</label>
                      <input value={devForm.capa_ref} onChange={(e) => setDevForm((f) => ({ ...f, capa_ref: e.target.value }))} style={miniInputStyle} placeholder="CAPA ref" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleReportDeviation} disabled={devSubmitting} style={btnTealSmStyle}>
                      {devSubmitting ? 'Submitting...' : '+ Report Deviation'}
                    </button>
                    <button onClick={() => { setShowDevForm(false); setDevError(null); }} style={btnSmStyle}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════ TAB 5: E-Signatures ═══════ */}
      {activeTab === 5 && (
        <>
          <div style={{ fontSize: 12, color: 'var(--pmx-tx2)', marginBottom: 14 }}>
            21 CFR Part 11 &mdash; Electronic signature chain. Every signature records: full name of signer, date/time, meaning of signature, SHA-256 hash at moment of signing.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {signatures.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0, background: s.color }} />
                <div>
                  <strong>{s.title}</strong> &mdash; {s.signer}<br />
                  <span style={{ fontSize: 11, color: 'var(--pmx-tx3)' }}>
                    Meaning: &quot;{s.meaning}&quot; &middot; {s.date} &middot; {s.extra ? `${s.extra} \u00B7 ` : ''}
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Hash: {s.hash}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══════ Release Checklist Modal ═══════ */}
      {showReleaseChecklist && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(2px)',
        }}>
          <div style={{ background: 'var(--pmx-bg)', borderRadius: 14, boxShadow: '0 12px 40px rgba(0,0,0,.18)', width: 480, maxWidth: '95vw', border: '0.5px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '0.5px solid var(--border)', fontSize: 14, fontWeight: 700, color: 'var(--pmx-tx)' }}>
              Batch Release &mdash; Pre-Release Checklist
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: 12, color: 'var(--pmx-tx2)', marginBottom: 14 }}>
                All checks must pass before the batch can be released.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {releaseChecks.map((check, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, borderRadius: 6, fontSize: 13, fontWeight: 700,
                      background: check.pass ? 'var(--pmx-green-light)' : 'var(--pmx-red-light)',
                      color: check.pass ? 'var(--pmx-green)' : 'var(--pmx-red)',
                    }}>
                      {check.pass ? '\u2713' : '\u2717'}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--pmx-tx)' }}>{check.label}</div>
                      <div style={{ fontSize: 11, color: check.pass ? 'var(--pmx-green)' : 'var(--pmx-red)' }}>{check.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={() => setShowReleaseChecklist(false)} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '0.5px solid var(--border)', background: 'var(--pmx-bg)', color: 'var(--pmx-tx2)', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button
                  disabled={!allChecksPassed}
                  onClick={() => {
                    setShowReleaseChecklist(false);
                    setSigModal({
                      open: true,
                      action: `Release Batch ${batchId}`,
                      defaultMeaning: 'Approved for release as QA Manager',
                      mode: 'release',
                    });
                  }}
                  style={{
                    padding: '8px 22px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: allChecksPassed ? 'pointer' : 'not-allowed',
                    border: 'none', background: allChecksPassed ? 'var(--pmx-teal)' : 'var(--border)', color: allChecksPassed ? '#fff' : 'var(--pmx-tx3)', fontFamily: 'inherit',
                  }}
                >
                  Proceed to Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Signature Modal ═══════ */}
      <SignatureModal
        open={sigModal.open}
        onClose={() => setSigModal((prev) => ({ ...prev, open: false }))}
        onConfirm={handleSigConfirm}
        action={sigModal.action}
        batchRef={batchId}
        signerName={signerName}
        signerRole={signerRole}
        defaultMeaning={sigModal.defaultMeaning}
      />
    </div>
  );
}

/* ───────── Shared styles ───────── */

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--pmx-tx2)',
  padding: '0 8px 8px 0',
  borderBottom: '0.5px solid var(--border)',
  letterSpacing: '.03em',
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '9px 8px 9px 0',
  borderBottom: '0.5px solid var(--border)',
  verticalAlign: 'middle',
  fontSize: 12,
  color: 'var(--pmx-tx)',
};

const btnSmStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 9px',
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 500,
  cursor: 'pointer',
  border: '0.5px solid var(--input)',
  background: 'var(--pmx-bg)',
  color: 'var(--pmx-tx)',
  fontFamily: 'inherit',
};

const btnTealSmStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '5px 12px',
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  background: 'var(--pmx-teal)',
  color: '#fff',
  fontFamily: 'inherit',
};

const miniLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--pmx-tx3)',
  textTransform: 'uppercase',
  letterSpacing: '.04em',
  marginBottom: 2,
};

const miniInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  fontSize: 12,
  borderRadius: 6,
  border: '0.5px solid var(--border)',
  background: 'var(--pmx-bg)',
  color: 'var(--pmx-tx)',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

const formErrorStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: 'var(--pmx-red-light)',
  color: 'var(--pmx-red)',
  borderRadius: 6,
  fontSize: 11,
  marginBottom: 10,
};

const formSuccessStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: 'var(--pmx-green-light)',
  color: 'var(--pmx-green)',
  borderRadius: 6,
  fontSize: 11,
  marginBottom: 10,
};
