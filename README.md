# creditappdemo

Demo **pengajuan kredit** (mobile web): formulir → verifikasi dokumen → **scoring otomatis** (riwayat pembayaran, penghasilan, rasio utang). Stack: **Vanilla JS (ES modules)** + **Vite**.

```bash
npm install
npm run dev
```

Build: `npm run build`, preview: `npm run preview`.

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
```

Contoh request JSON ke backend (mode `uat`):

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
