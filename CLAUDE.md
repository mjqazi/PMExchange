# PMX (Pharma Marketplace Exchange) - Project Instructions

---

## TODO — READ AND DISPLAY ON EVERY SESSION START

**On every new conversation in this project, read `TODO.md` and display the pending items to the user.**

```
cat TODO.md
```

Show the urgent items first, then a summary count of remaining items per section.

---

## MANDATORY: READ BEFORE WRITING ANY CODE

### NO DUPLICATE CODE - SEARCH BEFORE CREATING

**BEFORE writing ANY code (functions, components, hooks, utilities, types):**

1. **SEARCH FIRST**: `grep -rn "function\|const\|export" src/` for existing code
2. **USE EXISTING**: Import and reuse, NEVER recreate
3. **NEW SHARED CODE**: Add to appropriate location, export centrally

**VIOLATION = Creating duplicate logic anywhere in the codebase**

---

### Pre-Code Checklist (MANDATORY)

Before writing ANY logic, search for existing code:

| Creating... | Search Location | Command |
|-------------|-----------------|---------|
| Calculation/formatting | `src/lib/cqs-engine.ts` | `grep -n "function" src/lib/cqs-engine.ts` |
| Types/interfaces | `src/lib/types.ts` | `grep -n "interface\|type" src/lib/types.ts` |
| React components | `src/components/` | `ls -la src/components/` |
| Dialog/Modal | `src/components/ui/` | `ls -la src/components/ui/` |
| API utilities | `src/lib/` | `grep -rn "export" src/lib/` |
| Auth helpers | `src/lib/auth.ts` | `grep -n "function\|export" src/lib/auth.ts` |
| DB helpers | `src/lib/db.ts` | `grep -n "function\|export" src/lib/db.ts` |
| PDF generators | `src/lib/pdf-generator.ts` | `grep -n "function" src/lib/pdf-generator.ts` |
| Matching engine | `src/lib/matching-engine.ts` | `grep -n "function" src/lib/matching-engine.ts` |
| Notifications | `src/lib/notifications.ts` | `grep -n "function" src/lib/notifications.ts` |
| State store | `src/lib/store.ts` | `grep -n "function\|export" src/lib/store.ts` |

---

### Shared Code Locations - USE THESE, DON'T RECREATE

#### Core Libraries (`@/lib/`)

| Need This? | Use This | Import From |
|------------|----------|-------------|
| Database queries | `query()`, `queryOne<T>()` | `@/lib/db` |
| JWT auth, tokens | `createTokens()`, `verifyAccessToken()`, `getAuthUser()` | `@/lib/auth` |
| Password hashing | `hashPassword()`, `comparePassword()` | `@/lib/auth` |
| Session management | `createSession()`, `invalidateSession()` | `@/lib/auth` |
| Login failure handling | `handleLoginFailure()`, `isAccountLocked()` | `@/lib/auth` |
| Role checking | `requireRole()` | `@/lib/auth` |
| CQS calculation | `calculateCQS()` | `@/lib/cqs-engine` |
| Matching engine | `runMatchingEngine()` | `@/lib/matching-engine` |
| CoA PDF | `generateCoAPDF()` | `@/lib/pdf-generator` |
| Contract PDF | `generateContractPDF()` | `@/lib/pdf-generator` |
| DRAP document PDF | `generateDRAPDocument()` | `@/lib/pdf-generator` |
| Notifications | `createNotification()` | `@/lib/notifications` |
| Order timeouts | `checkOrderTimeouts()` | `@/lib/timeout-checker` |
| Zustand store | `usePMXStore` | `@/lib/store` |

#### Types (`@/lib/types`)

| Need This? | Use This Type | Import From |
|------------|---------------|-------------|
| User | `User`, `AuthUser` | `@/lib/types` |
| Manufacturer | `Manufacturer` | `@/lib/types` |
| Buyer | `Buyer` | `@/lib/types` |
| Product | `Product` | `@/lib/types` |
| Batch (eBMR) | `Batch`, `BatchMaterial`, `BatchStep`, `BatchQCTest` | `@/lib/types` |
| Environmental | `BatchEnvironmental` | `@/lib/types` |
| Deviations | `BatchDeviation` | `@/lib/types` |
| CoA | `CoA` | `@/lib/types` |
| RFQ | `RFQ`, `RFQResponse` | `@/lib/types` |
| Order | `Order` | `@/lib/types` |
| Message | `Message` | `@/lib/types` |
| Escrow | `EscrowAccount` | `@/lib/types` |
| Dispute | `Dispute` | `@/lib/types` |
| Rating | `Rating` | `@/lib/types` |
| Notification | `Notification` | `@/lib/types` |
| DRAP Documents | `DRAPDocument` | `@/lib/types` |
| Regulatory | `RegulatoryPathwayProgress`, `RegulatoryPathwayStep` | `@/lib/types` |
| API Response | `APIResponse<T>`, `PaginatedResponse<T>` | `@/lib/types` |
| Constants | `VALID_TRANSITIONS`, `GATE_1_DOCS`, `KYB_CHECKS`, `WHO_GMP_STEPS` | `@/lib/types` |

#### UI Components (`@/components/ui`)

| Need This? | Use This Component | Import From |
|------------|-------------------|-------------|
| Button | `Button` | `@/components/ui/button` |
| Input | `Input` | `@/components/ui/input` |
| Label | `Label` | `@/components/ui/label` |
| Select | `Select`, `SelectContent`, etc. | `@/components/ui/select` |
| Textarea | `Textarea` | `@/components/ui/textarea` |
| Badge | `Badge` | `@/components/ui/badge` |
| Card | `Card`, `CardHeader`, etc. | `@/components/ui/card` |
| Table | `Table`, `TableRow`, etc. | `@/components/ui/table` |
| Tabs | `Tabs`, `TabsList`, etc. | `@/components/ui/tabs` |
| Dialog/Modal | `Dialog`, `DialogContent`, etc. | `@/components/ui/dialog` |
| Alert | `Alert` | `@/components/ui/alert` |
| Separator | `Separator` | `@/components/ui/separator` |

**NEVER recreate these components** - always import from `@/components/ui`

---

### Where to Add NEW Shared Code

| Type of Code | Add To | Then Export From |
|--------------|--------|------------------|
| Business logic function | `src/lib/` (appropriate file) | Same file |
| Type/Interface | `src/lib/types.ts` | Same file |
| PDF generator | `src/lib/pdf-generator.ts` | Same file |
| Auth utility | `src/lib/auth.ts` | Same file |
| DB utility | `src/lib/db.ts` | Same file |
| UI primitive | `src/components/ui/*.tsx` | Direct import |
| Portal page | `src/app/{seller,buyer,admin}/` | N/A (page component) |
| API route | `src/app/api/` | N/A (route handler) |

---

### Post-Implementation Checklist (MANDATORY)

After completing ANY task, verify:
- [ ] **No duplicate functions** - searched and reused existing code
- [ ] **No duplicate types** - used existing interfaces from `@/lib/types`
- [ ] **No duplicate components** - reused existing UI components
- [ ] **No duplicate API logic** - used `getAuthUser()`, `query()`, etc.
- [ ] **Imports are correct** - using `@/lib/`, `@/components/...` aliases
- [ ] **API response format** - follows `{ success: true, data }` / `{ success: false, error: { code, message } }`
- [ ] **If new shared code added:**
  - [ ] Placed in correct location (see table above)
  - [ ] Exported properly
  - [ ] TypeScript types are correct

---

## Development Server

- Always run the dev server on **port 5555**
- Command: `npx next dev -p 5555`
- URL: http://localhost:5555
- **Port 3000 is used by QuoteCraft, port 4444 by MDI — do NOT use these**

## Test Credentials

| User | Email | Password | Role |
|---|---|---|---|
| Seller Admin | `admin@lahoregenerics.pk` | `PMX@prototype2026` | SELLER_ADMIN |
| Seller QA | `qa@lahoregenerics.pk` | `PMX@prototype2026` | SELLER_QA |
| Seller Operator | `ops@lahoregenerics.pk` | `PMX@prototype2026` | SELLER_OPERATOR |
| Buyer | `buyer@gulfmedical.sa` | `PMX@prototype2026` | BUYER_ADMIN |
| PMX Admin | `admin@pmx.com.pk` | `PMX@prototype2026` | PMX_ADMIN |

## Key URLs

- Login: http://localhost:5555
- Seller Dashboard: http://localhost:5555/seller/dashboard
- Buyer Dashboard: http://localhost:5555/buyer/dashboard
- Admin Dashboard: http://localhost:5555/admin/dashboard

## Tech Stack

- Next.js 14 with App Router, TypeScript
- PostgreSQL 18 (direct `pg` pool — no ORM)
- JWT auth via `jose` + `bcryptjs`
- Tailwind CSS with shadcn/ui components
- Zustand for client-side state
- React Hook Form + Zod for form validation
- pdf-lib + qrcode for PDF generation
- recharts for analytics charts

---

## Database

- Schema: `scripts/schema.sql`
- Seed data: `scripts/seed.sql` + `scripts/seed-demo.sql`
- Connection: `postgresql://postgres:password@localhost:5432/pmx_prototype`
- Reset: `sudo -u postgres psql -d pmx_prototype -f scripts/schema.sql && sudo -u postgres psql -d pmx_prototype -f scripts/seed.sql && sudo -u postgres psql -d pmx_prototype -f scripts/seed-demo.sql`

### CRITICAL DATABASE REQUIREMENTS

**THIS PROJECT USES POSTGRESQL ONLY:**
- Connection via `pg` pool in `src/lib/db.ts`
- No ORM — raw SQL queries with parameterized values
- All monetary values stored as INTEGER CENTS (never float)
- All timestamps in ISO 8601 UTC
- Audit log is IMMUTABLE — no UPDATE or DELETE permitted

**PostgreSQL password**: If the dev server shows DB auth errors, run:
```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"
```

---

## API Response Format Standards

### Standard Response Envelope

```typescript
// Success
return NextResponse.json({ success: true, data: result })

// Error
return NextResponse.json(
  { success: false, error: { code: 'ERROR_CODE', message: 'Human-readable message' } },
  { status: 404 }
)
```

### Pagination (cursor-based)

```typescript
{
  success: true,
  data: T[],
  next_cursor: string | null,
  has_more: boolean
}
```

### Auth Pattern for API Routes

```typescript
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }
  // ... route logic
}
```

---

## Business Logic Reference

### CQS Formula (6 dimensions)

```
CQS = (BatchCompleteness × 0.25) + (CoAAccuracy × 0.20) + (DeviationRateInv × 0.20)
    + (SupplierQualCurrency × 0.15) + (CertificationStatus × 0.12) + (DeliveryPerformance × 0.08)
```

- Auto-suspend below 40 + notify PMX_ADMIN
- Warning badge below 60

### Matching Engine (3 layers)

- **L1 Rules** (6 checks): Product INN+strength+form, Certification, Capacity 1.5x, Geography, PMX-certified, Buyer blacklist
- **L2 CQS** (50% of score): Seller's CQS score weighted
- **L3 AI** (50% of score): CQS + tier + past transaction relationship bonus

### Order Lifecycle (8 stages)

```
RFQ_POSTED → RESPONSES_RECEIVED → NEGOTIATING → CONTRACT_GENERATED
→ ESCROW_FUNDED → IN_PRODUCTION → DISPATCHED → DELIVERED → COMPLETED
```

Valid transitions enforced in `PUT /api/orders/[id]/status`.

### Timeout Rules

| Rule | Duration | Action |
|------|----------|--------|
| Stale negotiation | 14 days | Auto-archive |
| Unsigned contract | 5 days | Cancel |
| Unfunded escrow | 7 days | Cancel |
| Post-delivery escrow | 3 days | Auto-release (if no dispute) |
| Ratings window | 5 days | Close |

### 4-Gate Seller Onboarding

1. **Gate 1**: Document upload (DRAP licence, SECP, NTN, bank letter, products, optional WHO-GMP/QC lab)
2. **Gate 2**: KYB verification (DRAP/SECP/FBR/FATF API checks — all MOCK in prototype)
3. **Gate 3**: Compliance session (admin-initiated, records date + officer + notes)
4. **Gate 4**: Self-service checklist (products ≥ 1, QA user exists, bank confirmed, ToS accepted → auto-advance to APPROVED)

### 21 CFR Part 11 E-Signatures

Every batch step signature records: full name, date/time, meaning of signature, SHA-256 hash. Password re-entry required at time of signing.

---

## Directory Structure

```
src/
├── app/
│   ├── page.tsx                    # Login page
│   ├── layout.tsx                  # Root layout
│   ├── seller/                     # Seller portal (10 pages)
│   │   ├── layout.tsx              # Seller shell (topbar + sidebar)
│   │   ├── dashboard/page.tsx      # CQS gauge, KPIs, alerts
│   │   ├── onboarding/page.tsx     # 4-gate wizard
│   │   ├── batches/page.tsx        # eBMR list
│   │   ├── batches/[id]/page.tsx   # eBMR detail (6 tabs)
│   │   ├── coa/[batchId]/page.tsx  # CoA viewer
│   │   ├── drap/page.tsx           # DRAP doc generation
│   │   ├── rfqs/page.tsx           # Open RFQs + respond
│   │   ├── orders/page.tsx         # Order pipeline
│   │   ├── regulatory/page.tsx     # WHO-GMP/SFDA/USFDA/NMPA
│   │   └── academy/page.tsx        # Training modules
│   ├── buyer/                      # Buyer portal (6 pages)
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── rfqs/new/page.tsx       # Post RFQ form
│   │   ├── rfqs/[id]/page.tsx      # RFQ matches
│   │   ├── negotiate/[orderId]/page.tsx  # Negotiation thread
│   │   └── orders/page.tsx         # Orders + ratings
│   ├── admin/                      # Admin portal (8 pages)
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx      # Analytics + charts
│   │   ├── kyb/page.tsx            # KYB queue
│   │   ├── kyb/[sellerId]/page.tsx # Gate review
│   │   ├── sellers/page.tsx        # All sellers
│   │   ├── buyers/page.tsx         # All buyers
│   │   ├── disputes/page.tsx       # Dispute management
│   │   └── audit/page.tsx          # Audit log
│   └── api/                        # 46 API routes
│       ├── auth/                   # login, logout, refresh, me, mfa
│       ├── sellers/                # profiles, onboarding, gates
│       ├── batches/                # CRUD, release, steps, QC, env, CoA
│       ├── rfqs/                   # CRUD, matches, responses, negotiate
│       ├── orders/                 # CRUD, status, messages, offers, contract, ratings
│       ├── drap/                   # COPP, GMP cert, free sale, download
│       ├── disputes/               # raise dispute
│       ├── notifications/          # list, mark read
│       └── admin/                  # KYB, buyers, disputes, cron
├── lib/
│   ├── db.ts                       # PostgreSQL pool
│   ├── auth.ts                     # JWT + session management
│   ├── types.ts                    # All TypeScript types
│   ├── cqs-engine.ts               # CQS calculation
│   ├── matching-engine.ts          # 3-layer matching
│   ├── pdf-generator.ts            # CoA + Contract + DRAP PDFs
│   ├── notifications.ts            # Notification helper
│   ├── timeout-checker.ts          # Order lifecycle timeouts
│   ├── store.ts                    # Zustand store
│   └── utils.ts                    # shadcn utilities
├── components/ui/                  # shadcn/ui components
├── middleware.ts                   # Route protection
scripts/
├── schema.sql                      # Complete DB schema (30 tables)
├── seed.sql                        # Base seed data
├── seed-demo.sql                   # Extended demo data
└── hash-password.ts                # bcrypt hash generator
```

---

## Development Instructions

- Do not ask for user permission, rather just assume permission and keep executing
- Do not wait for confirmation while executing commands — proceed autonomously
- When restarting servers, never use aggressive node killing like `killall node` or `pkill node` — kill specific PIDs
- Always verify changes compile: `npx next build` after significant changes
- After implementing a feature, test the API with curl before moving on

---

## Design System

### CSS Variables (defined in globals.css)

| Token | Value | Usage |
|-------|-------|-------|
| `--pmx-teal` | `#1D9E75` | Primary brand, active states |
| `--pmx-teal-dark` | `#0F6E56` | Hover states |
| `--pmx-teal-light` | `#E1F5EE` | Active nav background |
| `--pmx-blue` | `#185FA5` | Info badges |
| `--pmx-green` | `#3B6D11` | Success, CQS green tier |
| `--pmx-amber` | `#BA7517` | Warning, CQS amber tier |
| `--pmx-red` | `#A32D2D` | Danger, CQS red tier |
| `--pmx-gray` | `#5F5E5A` | Neutral badges |
| `--pmx-tx` | `#1A1A18` | Primary text |
| `--pmx-tx2` | `#73726C` | Secondary text |
| `--pmx-tx3` | `#A0A09A` | Tertiary text |
| `--pmx-bg` | `#FFFFFF` | Card/panel background |
| `--pmx-bg2` | `#F8F7F4` | Main content background |
| `--pmx-bg3` | `#F0EFE9` | Page background |

### Typography

- Body: IBM Plex Sans (loaded via Google Fonts in globals.css)
- Monospace: IBM Plex Mono (batch numbers, hashes, timestamps)
- Font sizes: 10px (captions), 11px (meta), 12px (body), 13px (labels/titles), 17px (page headings)

### Badge Pattern

```tsx
// Use inline styles with CSS variables
<span style={{ background: 'var(--pmx-green-light)', color: 'var(--pmx-green)', padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
  Released
</span>
```

### CQS Score Badge

```tsx
// Green (80+), Amber (60-79), Red (<60)
const cqsClass = score >= 80 ? 'green' : score >= 60 ? 'amber' : 'red'
<span style={{ background: `var(--pmx-${cqsClass}-light)`, color: `var(--pmx-${cqsClass})`, border: `1px solid var(--pmx-${cqsClass})` }}>
  CQS {score}
</span>
```

---

## Reference Files

- **UI Reference**: `/home/junaid/Downloads/pmx-ui.html` — Open in browser to see all 20 views
- **Build Spec**: `/home/junaid/Downloads/PMX_COMPLETE_CLAUDE_CODE.md` — Complete technical specification
- **GitHub**: https://github.com/mjqazi/PMExchange
