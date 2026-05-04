import { scoreCreditApplication } from '../services/creditScoring.js';
import { initialState } from '../state/initialState.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

export function renderScoringLoading() {
  return `
    <div class="card" data-component="scoring-loading">
      <div class="loader">
        <div class="loader-dots" aria-hidden="true"><span></span><span></span><span></span></div>
        <p style="margin:0;font-weight:500;">Menghitung skor kredit…</p>
        <p class="hint" style="margin:0.5rem 0 0;">Memadukan riwayat pembayaran, penghasilan, dan rasio utang.</p>
      </div>
    </div>
  `;
}

export function renderScoringError(message) {
  return `
    <div class="card" data-component="scoring-error">
      <h2>Scoring gagal diproses</h2>
      <p class="err">${esc(message || 'Terjadi kendala pada proses scoring.')}</p>
      <p class="hint">Periksa koneksi API backend UAT atau gunakan mode mock.</p>
    </div>
  `;
}

export function renderHasilScoring(applicant, scoreResult) {
  const r = scoreResult;
  const br = r.breakdown;
  const dtiLabel =
    br.dtiRatio != null ? `${br.dtiRatio}% cicilan terhadap penghasilan` : 'Tidak ada penghasilan tercatat';
  const legendItems = [
    { kol: 1, label: 'Lancar', desc: 'Pembayaran tertib, risiko rendah, biasanya prioritas persetujuan.' },
    { kol: 2, label: 'Dalam Perhatian Khusus', desc: 'Ada sinyal kehati-hatian, umumnya perlu monitoring tambahan.' },
    { kol: 3, label: 'Kurang Lancar', desc: 'Risiko menengah-tinggi, perlu mitigasi seperti plafon/tenor konservatif.' },
    { kol: 4, label: 'Diragukan', desc: 'Risiko tinggi, umumnya perlu review manual mendalam.' },
    { kol: 5, label: 'Macet', desc: 'Risiko sangat tinggi, biasanya tidak direkomendasikan.' },
  ];
  const legendHtml = legendItems
    .map((item) => `
      <li class="legend-item ${item.kol === r.kolektibilitas ? 'current' : ''}">
        <div class="legend-top">
          <strong>Kol ${item.kol} — ${item.label}</strong>
          ${item.kol === r.kolektibilitas ? '<span class="legend-badge">Posisi Anda</span>' : ''}
        </div>
        <p class="legend-desc">${item.desc}</p>
      </li>
    `)
    .join('');

  const riskColor =
    r.kolektibilitas === 1
      ? 'var(--success)'
      : r.kolektibilitas === 2
        ? 'var(--accent-strong)'
        : r.kolektibilitas === 3
          ? 'var(--warning)'
          : 'var(--danger)';

  return `
    <div class="card" data-component="hasil-scoring">
      <h2>Hasil simulasi skor kredit</h2>
      <p class="hint" style="margin-top:0;">Nasabah: <strong style="color:var(--text);">${esc(applicant.fullName)}</strong></p>
      <div class="score-ring">
        <div class="score-value" style="color:${riskColor};">Kol ${r.kolektibilitas}</div>
        <div class="score-label">${esc(r.kolektibilitasLabel)}</div>
        <p class="hint" style="margin-top:0.35rem;">Indeks risiko internal: <strong style="color:var(--text);">${r.internalScore}</strong> / 100</p>
      </div>
      ${
        r.aegira &&
        (r.aegira.currentDsr != null ||
          r.aegira.projectedDsr != null ||
          r.aegira.riskLevel != null ||
          r.aegira.monthlyInstallment != null)
          ? `
      <div class="card" style="margin-top:0.75rem;background:var(--bg);padding:0.85rem;">
        <strong style="font-size:0.9rem;">Referensi backend (DSR &amp; risiko)</strong>
        <p class="hint" style="margin:0.25rem 0 0.5rem;">
          Pola data selaras ringkasan perhitungan / eligibility seperti
          <a href="https://github.com/khalidalhabibie/aegira-loan-service/blob/master/README.md" target="_blank" rel="noopener noreferrer">Aegira Loan Service</a>
          (snake_case di API; angka di bawah sudah dinormalisasi untuk UI).
        </p>
        <div class="score-detail" style="margin-top:0;">
          ${
            r.aegira.currentDsr != null
              ? `<div class="score-row"><span>Current DSR</span><span><strong>${esc(String(r.aegira.currentDsr))}</strong>%</span></div>`
              : ''
          }
          ${
            r.aegira.projectedDsr != null
              ? `<div class="score-row"><span>Projected DSR</span><span><strong>${esc(String(r.aegira.projectedDsr))}</strong>%</span></div>`
              : ''
          }
          ${
            r.aegira.monthlyInstallment != null
              ? `<div class="score-row"><span>Est. cicilan baru / bulan</span><span><strong>${esc(String(r.aegira.monthlyInstallment))}</strong> Rp</span></div>`
              : ''
          }
          ${
            r.aegira.riskLevel != null
              ? `<div class="score-row"><span>Risk level</span><span><strong>${esc(r.aegira.riskLevel)}</strong></span></div>`
              : ''
          }
          ${
            r.aegira.eligible != null
              ? `<div class="score-row"><span>Eligible (backend)</span><span><strong>${r.aegira.eligible ? 'Ya' : 'Tidak'}</strong></span></div>`
              : ''
          }
        </div>
      </div>
      `
          : ''
      }
      <div class="score-detail">
        <div>
          <div class="score-row">
            <span>Riwayat pembayaran</span>
            <span><strong>${br.paymentHistory}</strong> / 100</span>
          </div>
          <div class="bar"><div class="bar-fill" style="width:${br.paymentHistory}%;"></div></div>
        </div>
        <div>
          <div class="score-row">
            <span>Profil penghasilan</span>
            <span><strong>${br.income}</strong> / 100</span>
          </div>
          <div class="bar"><div class="bar-fill" style="width:${br.income}%;"></div></div>
        </div>
        <div>
          <div class="score-row">
            <span>Rasio utang (DTI)</span>
            <span><strong>${br.debtToIncome}</strong> / 100</span>
          </div>
          <div class="bar"><div class="bar-fill" style="width:${br.debtToIncome}%;"></div></div>
          <p class="hint">${esc(dtiLabel)}</p>
        </div>
      </div>
      <div class="card" style="margin-top:1rem;background:var(--bg);padding:0.85rem;">
        <strong style="font-size:0.9rem;">Rekomendasi sistem</strong>
        <p style="margin:0.35rem 0 0;font-size:0.9rem;">${esc(r.recommendation)}</p>
        <p class="hint" style="margin:0.45rem 0 0;">Catatan: ini simulasi edukasi dan bukan data resmi SLIK OJK.</p>
        <p class="hint" style="margin:0.25rem 0 0;">
          Sumber: <strong style="color:var(--text);">${esc(r.source || 'mock')}</strong> | Trace ID:
          <strong style="color:var(--text);">${esc(r.traceId || '-')}</strong>
        </p>
      </div>
      <div class="card" style="margin-top:0.75rem;background:var(--bg);padding:0.85rem;">
        <strong style="font-size:0.9rem;">Legend Posisi Skoring Nasabah</strong>
        <p class="hint" style="margin:0.35rem 0 0.55rem;">
          Posisi Anda saat ini: <strong style="color:var(--text);">Kol ${r.kolektibilitas} — ${esc(r.kolektibilitasLabel)}</strong>
        </p>
        <ul class="legend-list">${legendHtml}</ul>
      </div>
      <button type="button" class="btn btn-primary" id="btn-reset-demo" style="margin-top:1rem;">Ajukan baru (reset demo)</button>
    </div>
  `;
}

export async function runScoring(store) {
  const { applicant } = store.getState();
  const paymentMap = {
    sangat_baik: 'sangat_baik',
    baik: 'baik',
    cukup: 'cukup',
    buruk: 'buruk',
  };
  const paymentHistory = paymentMap[applicant.paymentHistory] || 'baik';

  try {
    const result = await scoreCreditApplication({
      fullName: applicant.fullName,
      phone: applicant.phone,
      monthlyIncome: Number(applicant.monthlyIncome) || 0,
      monthlyDebt: Number(applicant.monthlyDebt) || 0,
      loanAmount: Number(applicant.loanAmount) || 0,
      purpose: applicant.purpose,
      paymentHistory,
    });

    store.setState({
      scoreResult: result,
      scoringPhase: 'done',
      scoringError: '',
      step: 'result',
    });
  } catch (error) {
    store.setState({
      scoreResult: null,
      scoringPhase: 'error',
      scoringError: error instanceof Error ? error.message : 'Unknown scoring error',
      step: 'result',
    });
  }
}

export function attachHasilScoring(container, store) {
  const btn = container.querySelector('#btn-reset-demo');
  if (btn) {
    btn.addEventListener('click', () => {
      store.setState({
        step: initialState.step,
        applicant: structuredClone(initialState.applicant),
        documents: structuredClone(initialState.documents),
        scoreResult: initialState.scoreResult,
        scoringPhase: initialState.scoringPhase,
        scoringError: initialState.scoringError,
      });
    });
  }
}
