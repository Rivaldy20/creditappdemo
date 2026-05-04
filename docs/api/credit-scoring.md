# API — Credit Scoring (integrasi backend Java)

Dokumen ini menjelaskan kontrak JSON antara **frontend KreditKu demo** (`src/services/creditScoring.js`, `src/services/scoringContract.js`) dan **backend UAT**.

Referensi perilaku API industri (JSON **snake_case**, DSR, eligibility, loan flow): [**Aegira Loan Service** README](https://github.com/khalidalhabibie/aegira-loan-service/blob/master/README.md).

## Endpoint

| Properti | Nilai default |
|----------|----------------|
| Method | `POST` |
| Path | `/api/v1/credit-scoring/simulate` |
| Base URL | `VITE_BACKEND_BASE_URL` (mis. `http://localhost:8080` untuk stack Aegira lokal) |
| Content-Type | `application/json` |

## Konfigurasi frontend (Vite)

| Env | Fungsi |
|-----|--------|
| `VITE_SCORING_MODE` | `mock` \| `uat` |
| `VITE_BACKEND_BASE_URL` | Host backend |
| `VITE_SCORING_PATH` | Path scoring (gateway / BFF Anda) |
| `VITE_SCORING_SCHEMA` | **`aegira`** (default) — request snake_case selaras README Aegira; **`kreditku`** — nested camelCase legacy |
| `VITE_SCORING_DEFAULT_TENURE` | Bulan (default `12`), dipakai untuk `requested_tenure` dan estimasi cicilan baru (projected DSR di mock) |

## Spesifikasi mesin-readable

- **OpenAPI 3 (JSON):** [`credit-scoring.openapi.json`](./credit-scoring.openapi.json) — `oneOf` request **Aegira** vs **Kreditku**, response dengan field opsional `calculation` / `eligibility`.

## Request — skema `aegira` (`VITE_SCORING_SCHEMA=aegira`)

Mapping ke konsep README Aegira: data nasabah mirip **customer** (`full_name`, `phone_number`, `monthly_income`, `existing_installment`, …) dan pinjaman mirip **loan application** (`requested_amount`, `requested_tenure`, `loan_purpose`).

| Bagian | Field (snake_case) | Tipe | Keterangan |
|--------|---------------------|------|------------|
| `applicant` | `full_name` | string | Nama lengkap |
| | `phone_number` | string | Telepon |
| `financial` | `monthly_income` | number | Penghasilan bulanan (IDR) |
| | `monthly_expense` | number | Opsional; default `0` |
| | `existing_installment` | number | Setara total cicilan/utang bulanan di form demo |
| | `requested_amount` | number | Plafon diajukan (IDR) |
| | `requested_tenure` | integer | Tenor (bulan); jika tidak diisi dari form, pakai `VITE_SCORING_DEFAULT_TENURE` |
| | `loan_purpose` | string | Teks tujuan (dipetakan dari dropdown demo, mis. `Home renovation`) |
| `credit_profile` | `payment_history` | string | `sangat_baik` \| `baik` \| `cukup` \| `buruk` |

### Contoh request `aegira`

```json
{
  "applicant": {
    "full_name": "Budi Santoso",
    "phone_number": "08123456789"
  },
  "financial": {
    "monthly_income": 8500000,
    "monthly_expense": 0,
    "existing_installment": 2200000,
    "requested_amount": 40000000,
    "requested_tenure": 12,
    "loan_purpose": "Home renovation"
  },
  "credit_profile": {
    "payment_history": "baik"
  }
}
```

## Request — skema `kreditku` (`VITE_SCORING_SCHEMA=kreditku`)

Nested **camelCase** (legacy / gateway custom). Lihat contoh `kreditku` di OpenAPI.

## Response sukses (200)

Frontend **menerima object ter-normalisasi (camelCase)** di memori UI, tetapi wire JSON boleh:

- `trace_id` atau `traceId`
- `evaluated_at` atau `evaluatedAt`
- `result` dengan sub-field **snake_case** atau **camelCase** (adapter membaca keduanya)

### Hasil scoring (`result`)

| Field | Tipe | Keterangan |
|-------|------|------------|
| `kolektibilitas` | int 1–5 | Simulasi kolektibilitas (edukasi) |
| `kolektibilitasLabel` | string | Label |
| `internalScore` | int 0–100 | Indeks risiko internal |
| `breakdown.*` | int / number? | Komponen 0–100 + `dtiRatio` (opsional) |
| `recommendation` | string | Rekomendasi |

### Opsional — selaras ringkasan Aegira (DSR & eligibility)

Jika backend mengirim blok berikut, UI menampilkan kartu **Referensi backend (DSR & risiko)**:

| Blok | Field (snake_case di wire) | Keterangan |
|------|----------------------------|------------|
| `calculation` | `current_dsr`, `projected_dsr` | Persen DSR existing vs setelah tambahan cicilan baru (seperti alur README Aegira) |
| | `monthly_installment` | Estimasi cicilan baru per bulan (jika ada) |
| `eligibility` | `risk_level` | Mis. `LOW`, `MEDIUM`, `HIGH` |
| | `eligible` | Boolean |

### Contoh response (wire snake_case + DSR)

```json
{
  "trace_id": "uat-1714275000000-ab12cd",
  "evaluated_at": "2026-04-28T02:00:00.000Z",
  "calculation": {
    "current_dsr": 25.88,
    "projected_dsr": 32.94,
    "monthly_installment": 3333333
  },
  "eligibility": {
    "risk_level": "MEDIUM",
    "eligible": true
  },
  "result": {
    "kolektibilitas": 2,
    "kolektibilitas_label": "Dalam Perhatian Khusus",
    "internal_score": 74,
    "breakdown": {
      "payment_history": 82,
      "income": 78,
      "debt_to_income": 68,
      "dti_ratio": 25.9
    },
    "recommendation": "Cukup baik: dapat diproses dengan monitoring dan verifikasi lanjutan."
  }
}
```

## Error

Status non-2xx; body teks atau JSON. Properti `message` / `error` dan opsional `trace_id` / `traceId`.

## Mode aplikasi

| `VITE_SCORING_MODE` | Perilaku |
|---------------------|----------|
| `mock` | Hitung di browser; tetap mengisi blok DSR mock untuk UI |
| `uat` | `POST` JSON sesuai `VITE_SCORING_SCHEMA` |

Lihat [`../../README.md`](../../README.md) dan [`../../.env.example`](../../.env.example).
