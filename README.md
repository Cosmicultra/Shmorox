# Shmorox

Enterprise legal marketing review platform. Upload advertising and marketing materials — videos, ad cards, social campaigns, influencer content — and get an AI-assisted compliance review in plain language.

## Features

- **Guided 4-step wizard** — no AI experience required
- **Multi-format upload** — videos, images, PDFs, presentations
- **Asset-type checklists** — tailored review for TV, social, influencer, email, packaging, and more
- **Plain-language findings** — efficacy claims, green claims, disclosures, promotions
- **McKinsey-inspired enterprise UI** — deep navy, high contrast, generous whitespace

## Getting Started

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Important

This tool provides an AI-assisted **first-pass review**. It does not replace review by qualified legal counsel. All materials should receive final approval from your legal department before publication.

## Tech Stack

- Next.js 15 · React 19 · TypeScript
- Tailwind CSS
- Local browser storage for demo persistence

## Roadmap

- Connect to OpenAI / Claude Vision for real multimodal file analysis
- Enterprise SSO, role-based access, audit trails
- Integration with legal workflow tools (Ironclad, Mitratech, etc.)
- Substantiation document linking
- Multi-market regulatory rule sets
