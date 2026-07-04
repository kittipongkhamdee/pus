# กองทุนรุ่น · Financial Management

A clean, Fintech-style (Wise/Revolut vibe) class-fund web app for collecting and
managing a student cohort's monthly dues. Built as a self-contained, no-build
React app (React 18 + Babel Standalone loaded from CDN) so it can be deployed as
static files.

## Features

- **Login** — choose role: นักศึกษา (student) or ผู้ดูแล (admin/treasurer).
  Students enter their student ID and the system looks up their name before
  granting access; admins use student ID + password.
- **Student view** — pay dues via PromptPay QR + copyable account number,
  "open bank app" deep-link mock, upload a slip for **AI verification**
  (amount / date / destination account / reference + confidence), and view
  their own month-by-month status.
- **Admin / treasurer view**
  - **สรุปยอด (Summary)** — total received / balance / withdrawn / available,
    switchable between the current account (SCB) and the old account (KBank),
    plus a monthly-collection chart and a paid-percentage ring.
  - **รายบุคคล (Per-person)** — table sorted by student ID ascending, with
    paid / unpaid / pending-review status per month, search + filter, and
    counts of who has paid vs. who is outstanding.
  - **ตรวจสลิป (Verify)** — AI-checked queue (match / amount mismatch /
    duplicate slip) with confirm / reject actions.
  - **ส่งออก (Export)** — monthly & academic-year reports with **real PNG and
    PDF download**, working Excel (.csv) export, and Google Sheet demo buttons.

## Files

| File | Purpose |
| --- | --- |
| `Financial Management.html` | App shell + full design-system CSS; imports the scripts below |
| `data.js` | Sample data (28 students) exposed on `window.FM` |
| `components.jsx` | Shared icons, hooks, and design-system components |
| `login.jsx` | Role-based login screen |
| `student.jsx` | Student-facing views (pay, QR, AI verify, status) |
| `admin.jsx` | Admin/treasurer views (summary, per-person, verify) |
| `export.jsx` | Export view (PNG/PDF/CSV) |
| `app.jsx` | App shell that wires auth + navigation together |
| `vercel.json`, `netlify.toml` | Static-hosting config (correct `.jsx` MIME type) |
| `supabase-schema.sql` | Optional database schema for going live with real data |
| `Deployment Guide.html`, `Vercel Settings Guide.html` | Step-by-step deploy guides |

## Run locally

Because the `.jsx` files are fetched over HTTP, open it through a static server
rather than `file://`:

```bash
cd financial-management
python3 -m http.server 8000
# then open http://localhost:8000/Financial%20Management.html
```

## Deploy

The included `vercel.json` / `netlify.toml` set the correct `Content-Type` for
`.jsx` files. Deploy the `financial-management/` directory as static files and
open `Financial Management.html`. The data is sample/demo data — wire up
`supabase-schema.sql` when you're ready to use real student records.

> Note: this is the design prototype recreated faithfully. It is a no-build,
> in-browser React app intended for visual fidelity and demoing the flows.
