# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server only (HMR, port 5173) — /api functions NOT served
npm run dev:netlify  # `netlify dev` — Vite + Netlify Functions together (use this for DB/images)
npm run build        # type-check then produce production bundle in dist/
npm run preview      # serve the production build locally
```

No test runner or linter is configured.

## Architecture

**savdo-oddiy** ("Simple Commerce" in Uzbek) is a React/TypeScript SPA with a thin serverless backend:

- **Data** — MongoDB Atlas, reached through a single Netlify Function (`netlify/functions/db.mts`, mounted at `/api/db`). Collections `products`, `categories`, `stores`, `settings`; each document is `{ _id, data }`. The `MONGODB_URI` secret stays server-side only.
- **Images** — stored in Cloudflare R2 (no practical size limit, served via Cloudflare CDN). The browser asks `/api/upload-url` (`netlify/functions/upload-url.mts`) for a presigned PUT URL, uploads the file straight to R2 (bypassing Netlify's 6MB function limit), and stores only the public URL in MongoDB. R2 secrets (`R2_*`) stay server-side.
- No authentication — the `/api/db` endpoint is open, so anyone who can reach the deploy can read/write data.

### Data flow

Centralized state lives in `App.tsx`. On mount, state is hydrated **asynchronously** from `storage.ts` (which calls `src/lib/db.ts` → `/api/db`). Every state change is written back via `useEffect`. Modal components receive state slices and communicate changes through callbacks passed as props.

### Key source files

| File | Role |
|------|------|
| `src/App.tsx` | Root state, page routing (simple `page` state switch), async DB sync |
| `src/types.ts` | Core interfaces: `Product`, `Category`, `Store`, `Settings` |
| `src/storage.ts` | Domain load/save helpers; settings are merged with defaults for backward compatibility |
| `src/lib/db.ts` | `fetch` client for `/api/db` (colAll/colSet/colDel/colClear/docGet/docSet) |
| `src/lib/image-upload.ts` | Asks `/api/upload-url`, PUTs the file to R2, returns the public URL |
| `netlify/functions/db.mts` | MongoDB CRUD; bundled by esbuild, NOT in `tsconfig.app.json` |
| `netlify/functions/upload-url.mts` | Presigns R2 PUT URLs (`aws4fetch`); browser uploads direct to R2 |
| `src/utils.ts` | Pricing math (markup %, profit, currency conversion), `uid()`, barcode generation (EAN-13) |
| `src/excel.ts` | xlsx import/export; header matching is normalized to support Uzbek/Russian/English column names |
| `src/i18n.ts` | Simple `t(lang, key)` dictionary; only `uz` and `ru` languages |
| `src/styles.css` | Single CSS file; dark theme via CSS variables |

### Data model highlights

- `Product.stocks[]` maps store IDs to quantities — a product can have stock across multiple stores.
- `Settings.displayMode` controls whether prices render in their original currency, all-UZS, or all-USD; conversion uses `Settings.usdRate`.
- Barcodes are auto-generated (EAN-13) when missing on import.

### Page routing

State-based: the `page` variable in `App.tsx` switches between `catalog`, `categories`, and `settings`. No router library is used.

### Excel import behavior

`excel.ts` performs fuzzy header matching so spreadsheets with Uzbek, Russian, or English column headers all parse correctly. Import auto-creates new categories and stores if they don't exist yet.
