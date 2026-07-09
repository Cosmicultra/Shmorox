# Creative Studio

**Enterprise legal marketing review platform.** Upload advertising and marketing materials — videos, ad cards, social campaigns, influencer content, email, packaging, and more — and get an AI-assisted compliance review explained in plain language.

Built for marketing managers, brand teams, and legal coordinators at Fortune 500-style organizations. No AI or legal expertise required to submit a review.

---

## What This App Does

Creative Studio helps marketing teams **catch common legal and compliance issues early** before materials go to final legal approval. Users upload creative assets, describe what the material claims, and receive a structured report with:

- An overall risk rating (`Looks Good`, `Review Needed`, or `Action Required`)
- Plain-language summary anyone can understand
- Detailed findings with regulatory context and recommendations
- Asset-type-specific compliance checklists
- Recommended next steps based on risk level

**This is a first-pass review tool.** It does not replace qualified legal counsel. All materials still require final sign-off from the legal department before publication.

---

## Target Users

| Role | How they use Creative Studio |
|------|----------------------|
| Marketing managers | Submit campaigns and ad creative for pre-review |
| Brand teams | Upload packaging, print, and cross-channel materials |
| Legal coordinators | Triage submissions and share reports with counsel |
| Influencer / social teams | Check disclosure and endorsement compliance |

The UI is intentionally non-technical: no prompts, no AI configuration, no legal jargon required at submission time.

---

## User Flows

### Primary flow: Submit a new review

1. **Home** (`/`) — Hero CTA or "New Review" navigates to the wizard
2. **4-step wizard** (`/review/new`):
   - **Step 1 — Type:** Select asset type (video, display ad, social, influencer, email, packaging, print, other)
   - **Step 2 — Upload:** Drag-and-drop or browse files (images, videos, PDFs, docs, presentations)
   - **Step 3 — Details:** Enter campaign name, brand, market, launch date, claims description, audience, and notes
   - **Step 4 — Review:** Confirm summary and submit
3. **Analysis** (`/review/[id]`) — Automatic review runs on page load; progress messages shown during ~4 second simulated analysis
4. **Report** — Plain-language summary, findings, checklist, next steps; option to print or submit a revised version

### Secondary flows

- **Browse past reviews** — Home page lists all submissions with status, asset type, risk badge, brand, market, and date
- **Help / FAQ** (`/help`) — Process guide and frequently asked questions
- **Re-submit** — "Submit Revised Version" starts a fresh review after addressing flagged items

---

## Pages & Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `src/app/page.tsx` | Dashboard: hero, 3-step explainer, supported asset types, review history |
| `/review/new` | `src/app/review/new/page.tsx` | 4-step submission wizard |
| `/review/[id]` | `src/app/review/[id]/page.tsx` | Analysis progress + full review report |
| `/help` | `src/app/help/page.tsx` | How-it-works guide and FAQ |

Global layout wraps all pages in `AppProvider` (state) and `Shell` (header nav + footer).

---

## Supported Asset Types

Each type triggers a tailored compliance checklist during review:

| ID | Label | Examples |
|----|-------|----------|
| `video` | Video & TV | Commercials, pre-roll, streaming ads, video scripts |
| `display-ad` | Display & Digital Ads | Banner ads, ad cards, paid social units, programmatic |
| `social-campaign` | Social Campaign | Organic posts, carousels, stories, brand social content |
| `influencer` | Influencer Content | Creator posts, UGC, sponsorships, endorsements |
| `email` | Email & CRM | Newsletters, promotional emails, lifecycle messaging |
| `packaging` | Packaging & Label | On-pack claims, inserts, shelf talkers |
| `print` | Print & OOH | Magazines, direct mail, billboards, retail signage |
| `other` | Other Material | Press releases, websites, sales sheets |

### Target markets

United States, Canada, European Union, United Kingdom, Australia, Global / Multi-market

---

## Review Engine

**Location:** `src/lib/review-engine.ts`

The current implementation is a **client-side demo engine** — it simulates AI analysis with timed progress steps and does **not** call external LLM or vision APIs. Uploaded file contents are **not** parsed; analysis runs on text fields from the submission form.

### What gets analyzed

Combined text from: `title`, `claimsDescription`, `notes`, `brand`, `targetAudience`

### Claim pattern detection

Regex rules scan for six compliance categories:

| Category | Example triggers | Default risk |
|----------|------------------|--------------|
| Product Efficacy | kill, disinfect, 99.9%, germ-free | Action Required |
| Comparative Advertising | #1, best, leading, superior | Caution |
| Environmental Claims | eco-friendly, sustainable, green, recyclable | Caution |
| Natural & Clean Claims | natural, organic, clean, non-toxic | Caution |
| Endorsements | #ad, #sponsored, paid partnership | Clear (positive signal) |
| Promotions | free, guarantee, sweepstakes, contest | Caution |

Each match produces a `Finding` with: category, title, summary, detail, risk level, relevant regulations (FTC, EPA, NAD, etc.), recommendation, and detected terms.

### Asset-type checklists

Pre-defined pass/fail checklist items per asset type (e.g., video checks on-screen supers, audio/visual match, end-frame disclosures). Failed checklist items can elevate overall risk to `caution` even when no claim patterns match.

### Risk scoring

- **Action Required** — Any finding with `action-required` risk
- **Review Needed (caution)** — Any finding with `caution` risk, or failed checklist items
- **Looks Good (clear)** — No flagged findings

### Output structure (`ReviewResult`)

```typescript
{
  submissionId: string;
  overallRisk: "clear" | "caution" | "action-required";
  confidence: number;           // 87–92% (simulated)
  summary: string;            // Formal summary
  plainLanguageSummary: string;
  findings: Finding[];
  checklist: { label, passed, note? }[];
  nextSteps: string[];        // Risk-dependent action items
}
```

---

## Data Model

**Location:** `src/lib/types.ts`

### Core types

- **`ReviewSubmission`** — User input: id, title, brand, market, assetType, files[], claimsDescription, targetAudience, launchDate, notes, status (`draft` | `analyzing` | `complete`), timestamps
- **`UploadedFile`** — id, name, size, type, optional image previewUrl (blob URL)
- **`ReviewResult`** — Analysis output linked by submissionId
- **`Finding`** — Individual compliance issue with risk, regulation, recommendation
- **`RiskLevel`** — `clear` | `caution` | `action-required`

---

## State & Persistence

**Location:** `src/context/AppContext.tsx`

- React Context provides: `reviews[]`, `results{}`, CRUD helpers (`addReview`, `updateReview`, `setResult`, `getReview`, `getResult`)
- Persisted to **browser localStorage** under key `shmorox-reviews`
- Hydration gate shows loading spinner until localStorage is read
- **No backend, database, or server-side storage** in the current demo

### Review lifecycle

1. Submit → status `analyzing`, saved to localStorage
2. Detail page `useEffect` triggers `runAIReview()`
3. On completion → status `complete`, result stored, `completedAt` set

---

## File Upload

**Location:** `src/components/FileUploader.tsx`

- Drag-and-drop or click-to-browse
- Multiple files supported
- Accepted: images, videos, PDF, Word, PowerPoint, text (`.mp4`, `.mov`, `.webm`, `.png`, `.jpg`, etc.)
- Image files get in-browser preview thumbnails via `URL.createObjectURL`
- File metadata (name, size, type) stored; **binary content is not sent anywhere**

---

## UI & Design System

McKinsey-inspired enterprise aesthetic: deep navy, high contrast, generous whitespace.

### Design tokens (`tailwind.config.ts`)

| Token | Value | Usage |
|-------|-------|-------|
| `mckinsey-navy` | `#051C2C` | Primary brand, headings, buttons |
| `mckinsey-blue` | `#2251FF` | Accents, active states |
| `mckinsey-mist` | `#F4F6F8` | Page background |
| `mckinsey-success` | `#0D7C4E` | Pass / clear states |
| `mckinsey-warning` | `#B45309` | Caution states |
| `mckinsey-danger` | `#B42318` | Action required |

### Typography

- **Headings:** Playfair Display (serif)
- **Body:** Inter (sans-serif)

### Shared components (`src/components/ui.tsx`)

`Card`, `Button`, `Badge`, `RiskBadge`, `StepIndicator`, `HelpTip`

### Shell (`src/components/Shell.tsx`)

Sticky header with logo, nav (Home, New Review, How It Works), mobile hamburger menu, footer disclaimer.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout, metadata, AppProvider + Shell
│   ├── page.tsx            # Home / dashboard
│   ├── globals.css         # Tailwind + fonts
│   ├── help/page.tsx       # FAQ and process guide
│   └── review/
│       ├── new/page.tsx    # 4-step submission wizard
│       └── [id]/page.tsx   # Analysis + report detail
├── components/
│   ├── Shell.tsx           # App chrome (header, nav, footer)
│   ├── FileUploader.tsx    # Drag-and-drop file input
│   └── ui.tsx              # Design system primitives
├── context/
│   └── AppContext.tsx      # Global state + localStorage sync
└── lib/
    ├── types.ts            # TypeScript types, asset types, markets
    └── review-engine.ts    # Analysis logic (pattern matching demo)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 3.4 |
| Icons | lucide-react |
| Utilities | clsx |
| Persistence | Browser localStorage (demo) |
| Linting | ESLint + eslint-config-next |

### Scripts

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Run production server
npm run lint     # ESLint
```

Requires **Node.js 18+**.

---

## Current Limitations (Demo)

These are intentional gaps in the MVP; see Roadmap for planned work:

- **No real AI/LLM integration** — Analysis is regex pattern matching on form text, not multimodal file analysis
- **Uploaded files are not read** — Videos, PDFs, and images are stored as metadata only
- **No authentication** — No users, roles, or SSO
- **No server persistence** — Data lives in localStorage and is lost if browser storage is cleared
- **Simulated confidence scores** — Fixed 87–92% range, not model-derived
- **US-centric regulations** — References FTC, EPA, NAD; market selector does not yet change rule sets
- **Static checklists** — Pre-seeded pass/fail values, not dynamically evaluated

---

## Roadmap

- Connect to OpenAI / Claude Vision for real multimodal file analysis
- Enterprise SSO, role-based access, audit trails
- Integration with legal workflow tools (Ironclad, Mitratech, etc.)
- Substantiation document linking
- Multi-market regulatory rule sets (market selector drives applicable rules)
- Backend API and secure file storage for production deployment

---

## Legal Disclaimer

Creative Studio provides an **AI-assisted first-pass review** to help teams work faster and catch common issues early. It is **not** a substitute for review by qualified legal counsel. All advertising and marketing materials must receive **final approval from your legal department** before publication.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To test the review engine, submit a new review and include claim language in the "What claims does this material make?" field — e.g., "kills 99.9% of germs" or "eco-friendly and sustainable" — to see findings generated.
