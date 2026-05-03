const STEPS = [
  { id: 'form', label: 'Pengajuan' },
  { id: 'verify', label: 'Verifikasi' },
  { id: 'scoring', label: 'Scoring' },
  { id: 'result', label: 'Hasil' },
];

function stepIndex(step) {
  const i = STEPS.findIndex((s) => s.id === step);
  return i >= 0 ? i : 0;
}

export function renderStepIndicator(currentStep) {
  const idx = stepIndex(currentStep);
  const dots = STEPS.map((s, i) => {
    let cls = 'step-dot';
    if (i < idx) cls += ' done';
    else if (i === idx) cls += ' active';
    return `<div class="${cls}" role="presentation" title="${s.label}"></div>`;
  }).join('');
  return `
    <div class="step-indicator" aria-hidden="true">${dots}</div>
    <span class="sr-only">Langkah ${idx + 1} dari ${STEPS.length}</span>
  `;
}
