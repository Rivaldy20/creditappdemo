function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

export function renderVerifikasiDokumen(documents) {
  const items = documents
    .map((d) => {
      const verified = d.verified;
      return `
        <li class="doc-item ${verified ? 'verified' : ''}" data-doc-id="${esc(d.id)}">
          <div class="doc-icon" aria-hidden="true">${verified ? '✓' : '📄'}</div>
          <div class="doc-meta">
            <div class="doc-name">${esc(d.name)}</div>
            <div class="doc-status">
              ${verified ? '<span class="badge badge-ok">Terverifikasi</span>' : '<span class="badge badge-pending">Menunggu</span>'}
            </div>
          </div>
          ${verified
            ? ''
            : `<button type="button" class="btn btn-secondary" style="width:auto;padding:0.5rem 0.75rem;margin:0;font-size:0.85rem;" data-verify="${esc(d.id)}">Periksa</button>`
          }
        </li>
      `;
    })
    .join('');

  const allDone = documents.every((d) => d.verified);

  return `
    <div class="card" data-component="verifikasi-dokumen">
      <h2>Verifikasi dokumen</h2>
      <p class="hint" style="margin-bottom:1rem;">
        Demo: tombol &quot;Periksa&quot; mensimulasikan pemeriksaan OCR &amp; keaslian dokumen.
      </p>
      <ul class="doc-list">${items}</ul>
      ${
        allDone
          ? `<button type="button" class="btn btn-primary" id="btn-lanjut-scoring" style="margin-top:1rem;">Lanjut scoring otomatis</button>`
          : `<p class="hint" style="margin-top:1rem;">Verifikasi semua dokumen untuk melanjutkan.</p>`
      }
      <button type="button" class="btn btn-secondary" id="btn-kembali-form">Kembali ke formulir</button>
    </div>
  `;
}

export function attachVerifikasiDokumen(container, store) {
  container.querySelectorAll('[data-verify]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-verify');
      const state = store.getState();
      const documents = state.documents.map((d) =>
        d.id === id ? { ...d, verified: true } : d,
      );
      store.setState({ documents });
    });
  });

  const lanjut = container.querySelector('#btn-lanjut-scoring');
  if (lanjut) {
    lanjut.addEventListener('click', () => {
      store.setState({ step: 'scoring', scoringPhase: 'loading' });
    });
  }

  const kembali = container.querySelector('#btn-kembali-form');
  if (kembali) {
    kembali.addEventListener('click', () => {
      store.setState({ step: 'form' });
    });
  }
}
