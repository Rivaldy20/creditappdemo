# API — Credit Scoring (integrasi backend Java)

Dokumen ini menjelaskan kontrak JSON antara **frontend KreditKu demo** (`src/services/creditScoring.js`) dan **backend UAT**.

## Endpoint

| Properti | Nilai default |
|----------|----------------|
| Method | `POST` |
| Path | `/api/v1/credit-scoring/simulate` |
| Base URL | dari env `VITE_BACKEND_BASE_URL` (contoh: `http://localhost:8080`) |
| Content-Type | `application/json` |

Path dan host bisa diubah tanpa mengubah kode lewat:

- `VITE_BACKEND_BASE_URL`
- `VITE_SCORING_PATH`

## Spesifikasi mesin-readable

- **OpenAPI 3 (JSON):** [`credit-scoring.openapi.json`](./credit-scoring.openapi.json)  
  Impor ke Swagger UI, Postman, atau codegen Java (OpenAPI Generator).

## Request body

Struktur sama dengan yang dikirim mode `uat` dari frontend.

| Bagian | Field | Tipe | Keterangan |
|--------|--------|------|------------|
| `applicant` | `fullName` | string | Nama nasabah |
| | `phone` | string | Nomor telepon |
| `financial` | `monthlyIncome` | number | Penghasilan bulanan (IDR) |
| | `monthlyDebt` | number | Total cicilan/utang bulanan (IDR) |
| | `requestedLoanAmount` | number | Plafon yang diajukan (IDR) |
| | `purpose` | string | `modal_kerja` \| `pendidikan` \| `renovasi` \| `lainnya` |
| `creditProfile` | `paymentHistory` | string | `sangat_baik` \| `baik` \| `cukup` \| `buruk` |

### Contoh request

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

## Response sukses (200)

Envelope wajib berisi `traceId`, `evaluatedAt`, dan `result` agar adapter frontend bisa memetakan ke UI.

| Field | Tipe | Keterangan |
|-------|------|------------|
| `traceId` | string | ID jejak (audit) |
| `evaluatedAt` | string (ISO-8601) | Waktu evaluasi |
| `result.kolektibilitas` | integer (1–5) | Simulasi posisi kolektibilitas (edukasi) |
| `result.kolektibilitasLabel` | string | Label resmi ringkas (mis. Lancar, DPK, …) |
| `result.internalScore` | integer (0–100) | Indeks risiko internal |
| `result.breakdown.paymentHistory` | integer (0–100) | Komponen riwayat |
| `result.breakdown.income` | integer (0–100) | Komponen penghasilan |
| `result.breakdown.debtToIncome` | integer (0–100) | Komponen rasio utang |
| `result.breakdown.dtiRatio` | number \| null | Persen DTI; `null` jika penghasilan 0 |
| `result.recommendation` | string | Teks rekomendasi untuk nasabah/RM |

### Contoh response

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

## Error

Frontend mengharapkan status non-2xx dengan body teks atau JSON (akan ditampilkan pesan error di layar hasil).

Disarankan bentuk konsisten:

```json
{
  "error": "VALIDATION_ERROR",
  "message": "paymentHistory harus salah satu dari ...",
  "traceId": "err-..."
}
```

## Mode aplikasi

| `VITE_SCORING_MODE` | Perilaku |
|---------------------|----------|
| `mock` | Tidak memanggil backend; hitung di browser |
| `uat` | `POST` ke URL di atas |

Lihat juga [`../../README.md`](../../README.md) bagian Credit Scoring API Mode.
