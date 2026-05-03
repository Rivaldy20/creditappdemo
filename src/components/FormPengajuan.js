export function renderFormPengajuan(applicant) {
  const safe = (v) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');

  return `
    <div class="card" data-component="form-pengajuan">
      <h2>Formulir pengajuan kredit</h2>
      <form id="form-pengajuan">
        <div class="field">
          <label for="fullName">Nama lengkap</label>
          <input id="fullName" name="fullName" type="text" autocomplete="name" required
            value="${safe(applicant.fullName)}" placeholder="Sesuai KTP" />
        </div>
        <div class="field">
          <label for="phone">Nomor telepon</label>
          <input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required
            value="${safe(applicant.phone)}" placeholder="08xxxxxxxxxx" />
        </div>
        <div class="field">
          <label for="monthlyIncome">Penghasilan bulanan (Rp)</label>
          <input id="monthlyIncome" name="monthlyIncome" type="number" min="0" step="100000" required
            value="${safe(applicant.monthlyIncome)}" placeholder="5000000" />
          <p class="hint">Digunakan untuk kapasitas bayar dan skor pendapatan.</p>
        </div>
        <div class="field">
          <label for="monthlyDebt">Total cicilan &amp; utang bulanan saat ini (Rp)</label>
          <input id="monthlyDebt" name="monthlyDebt" type="number" min="0" step="50000" required
            value="${safe(applicant.monthlyDebt)}" placeholder="1500000" />
          <p class="hint">Untuk menghitung rasio utang terhadap penghasilan.</p>
        </div>
        <div class="field">
          <label for="loanAmount">Plafon yang diajukan (Rp)</label>
          <input id="loanAmount" name="loanAmount" type="number" min="0" step="500000" required
            value="${safe(applicant.loanAmount)}" placeholder="50000000" />
        </div>
        <div class="field">
          <label for="purpose">Tujuan pinjaman</label>
          <select id="purpose" name="purpose">
            <option value="modal_kerja" ${applicant.purpose === 'modal_kerja' ? 'selected' : ''}>Modal kerja</option>
            <option value="pendidikan" ${applicant.purpose === 'pendidikan' ? 'selected' : ''}>Pendidikan</option>
            <option value="renovasi" ${applicant.purpose === 'renovasi' ? 'selected' : ''}>Renovasi</option>
            <option value="lainnya" ${applicant.purpose === 'lainnya' ? 'selected' : ''}>Lainnya</option>
          </select>
        </div>
        <div class="field">
          <label for="paymentHistory">Riwayat pembayaran (kartu/kredit lain)</label>
          <select id="paymentHistory" name="paymentHistory">
            <option value="sangat_baik" ${applicant.paymentHistory === 'sangat_baik' ? 'selected' : ''}>Sangat baik — jarang telat</option>
            <option value="baik" ${applicant.paymentHistory === 'baik' ? 'selected' : ''}>Baik — sesekali telat</option>
            <option value="cukup" ${applicant.paymentHistory === 'cukup' ? 'selected' : ''}>Cukup — beberapa kali telat</option>
            <option value="buruk" ${applicant.paymentHistory === 'buruk' ? 'selected' : ''}>Buruk — sering bermasalah</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Lanjut verifikasi dokumen</button>
      </form>
    </div>
  `;
}

export function attachFormPengajuan(container, store) {
  const form = container.querySelector('#form-pengajuan');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    store.setState({
      applicant: {
        fullName: String(fd.get('fullName') || '').trim(),
        phone: String(fd.get('phone') || '').trim(),
        monthlyIncome: fd.get('monthlyIncome'),
        monthlyDebt: fd.get('monthlyDebt'),
        loanAmount: fd.get('loanAmount'),
        purpose: String(fd.get('purpose') || 'modal_kerja'),
        paymentHistory: String(fd.get('paymentHistory') || 'baik'),
      },
      step: 'verify',
    });
  });
}
