# Screenshot per halaman

Pratinjau visual alur aplikasi. File gambar saat ini di subfolder:

| Langkah | File |
|---------|------|
| Form pengajuan | `01-form-pengajuan/creditapp1.png` |
| Verifikasi dokumen | `02-verifikasi-dokumen/creditapp2.png` |
| Loading scoring | `03-scoring-loading/creditapploading.png` |
| Hasil scoring | `04-hasil-scoring/creditapp4.png` |
| Error API (UAT) | *(belum ada — lihat bagian bawah)* |

**Format disarankan:** PNG atau WebP, lebar referensi mobile ~390px.  
Setelah menambah gambar baru, **bisa hapus** `.gitkeep` di folder yang bersangkutan.

---

## Pratinjau (galeri)

### 1. Formulir pengajuan

![Formulir pengajuan kredit](./01-form-pengajuan/creditapp1.png)

*Folder:* `01-form-pengajuan/`

---

### 2. Verifikasi dokumen

![Verifikasi dokumen](./02-verifikasi-dokumen/creditapp2.png)

*Folder:* `02-verifikasi-dokumen/`

---

### 3. Scoring (loading)

![Memuat hasil scoring](./03-scoring-loading/creditapploading.png)

*Folder:* `03-scoring-loading/`

---

### 4. Hasil simulasi skor

![Hasil scoring, breakdown, dan legend](./04-hasil-scoring/creditapp4.png)

*Folder:* `04-hasil-scoring/`

---

### 5. Error scoring (opsional, mode UAT)

Belum ada file gambar di `05-error-scoring/`. Setelah menangkap layar error (backend tidak tersedia / `VITE_SCORING_MODE=uat`), simpan misalnya sebagai `01-error-message.png` lalu tambahkan di sini:

```markdown
![Error scoring API](./05-error-scoring/01-error-message.png)
```

---

## Ringkasan struktur

```
docs/screenshots/
├── README.md
├── 01-form-pengajuan/
│   └── creditapp1.png
├── 02-verifikasi-dokumen/
│   └── creditapp2.png
├── 03-scoring-loading/
│   └── creditapploading.png
├── 04-hasil-scoring/
│   └── creditapp4.png
└── 05-error-scoring/
    └── (kosong / tambahkan screenshot error)
```

## Referensi cepat (salin Markdown)

```markdown
![Form](./01-form-pengajuan/creditapp1.png)
![Verifikasi](./02-verifikasi-dokumen/creditapp2.png)
![Loading](./03-scoring-loading/creditapploading.png)
![Hasil](./04-hasil-scoring/creditapp4.png)
```
