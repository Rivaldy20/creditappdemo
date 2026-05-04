# Dokumentasi proyek

## API

- **Markdown ringkas:** [`api/credit-scoring.md`](api/credit-scoring.md) — termasuk skema **`aegira`** (snake_case, DSR/eligibility) vs **`kreditku`** (legacy), selaras referensi [Aegira Loan Service](https://github.com/khalidalhabibie/aegira-loan-service/blob/master/README.md).
- **OpenAPI 3 (JSON):** [`api/credit-scoring.openapi.json`](api/credit-scoring.openapi.json)

## Visualisasi UI (screenshot per halaman)

Indeks lengkap dengan gambar: [`screenshots/README.md`](screenshots/README.md).

### Pratinjau alur (dari file di repo)

| Langkah | Preview |
|---------|---------|
| Form pengajuan | ![Form](screenshots/01-form-pengajuan/creditapp1.png) |
| Verifikasi dokumen | ![Verifikasi](screenshots/02-verifikasi-dokumen/creditapp2.png) |
| Loading scoring | ![Loading](screenshots/03-scoring-loading/creditapploading.png) |
| Hasil scoring | ![Hasil](screenshots/04-hasil-scoring/creditapp4.png) |

Folder tambahan: [`screenshots/05-error-scoring/`](screenshots/05-error-scoring/) — untuk screenshot error API (UAT), belum ada file gambar.

Cara menambah atau mengganti screenshot: jalankan `npm run dev`, tangkap layar per langkah, simpan ke subfolder yang sesuai di `docs/screenshots/`.
