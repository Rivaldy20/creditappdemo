# creditappdemo

Demo **pengajuan kredit** (mobile web): formulir → verifikasi dokumen → **scoring otomatis** (riwayat pembayaran, penghasilan, rasio utang). Stack: **Vanilla JS (ES modules)** + **Vite**.

```bash
npm install
npm run dev
```

Build: `npm run build`, preview: `npm run preview`.

## Dokumentasi API & screenshot UI

- Spesifikasi API (Markdown + OpenAPI JSON): folder [`docs/`](docs/README.md)
- **Screenshot alur (dengan gambar):** [`docs/screenshots/README.md`](docs/screenshots/README.md)

| Langkah | Cuplikan |
|---------|----------|
| Form | ![Form](docs/screenshots/01-form-pengajuan/creditapp1.png) |
| Verifikasi | ![Verifikasi](docs/screenshots/02-verifikasi-dokumen/creditapp2.png) |
| Loading | ![Loading](docs/screenshots/03-scoring-loading/creditapploading.png) |
| Hasil | ![Hasil](docs/screenshots/04-hasil-scoring/creditapp4.png) |

## Credit Scoring API Mode

Service scoring ada di `src/services/creditScoring.js` dan mendukung 2 mode:

- `mock` (default): hitung lokal untuk demo/dev
- `uat`: kirim JSON ke backend API Java

Konfigurasi env (Vite):

```bash
VITE_SCORING_MODE=mock
# atau
VITE_SCORING_MODE=uat
VITE_BACKEND_BASE_URL=http://localhost:8080
VITE_SCORING_PATH=/api/v1/credit-scoring/simulate
# Request JSON: aegira (snake_case, selaras Aegira Loan Service README) | kreditku (camelCase)
VITE_SCORING_SCHEMA=aegira
VITE_SCORING_DEFAULT_TENURE=12
```

Referensi konvensi API (snake_case, DSR, loan flow): [Aegira Loan Service README](https://github.com/khalidalhabibie/aegira-loan-service/blob/master/README.md). Detail kontrak: [`docs/api/credit-scoring.md`](docs/api/credit-scoring.md).

Contoh request JSON ke backend (mode `uat`, skema **`kreditku`** / camelCase — jika `VITE_SCORING_SCHEMA=aegira`, gunakan bentuk snake_case di [`docs/api/credit-scoring.md`](docs/api/credit-scoring.md)):

```json
{
  "applicant": {
    "fullName": "Budi Santoso",
    "phone": "08123456789"
  },
  "financial": {
    "monthlyIncome": 8500000,
    "monthlyDebt": 2200000,
    "requestedLoanAmount": 40000000,
    "purpose": "modal_kerja"
  },
  "creditProfile": {
    "paymentHistory": "baik"
  }
}
```

Contoh response JSON dari backend:

```json
{
  "traceId": "uat-1714275000000-ab12cd",
  "evaluatedAt": "2026-04-28T02:00:00.000Z",
  "result": {
    "kolektibilitas": 2,
    "kolektibilitasLabel": "Dalam Perhatian Khusus",
    "internalScore": 74,
    "breakdown": {
      "paymentHistory": 82,
      "income": 78,
      "debtToIncome": 68,
      "dtiRatio": 25.9
    },
    "recommendation": "Cukup baik: dapat diproses dengan monitoring dan verifikasi lanjutan."
  }
}
```
