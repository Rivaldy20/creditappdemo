import { renderStepIndicator } from './StepIndicator.js';
import { renderFormPengajuan, attachFormPengajuan } from './FormPengajuan.js';
import { renderVerifikasiDokumen, attachVerifikasiDokumen } from './VerifikasiDokumen.js';
import {
  renderScoringLoading,
  renderScoringError,
  renderHasilScoring,
  attachHasilScoring,
  runScoring,
} from './HasilScoring.js';

export function mountApp(root, store) {
  const shell = document.createElement('div');
  shell.className = 'app-shell';
  shell.innerHTML = `
    <header class="app-header">
      <p class="app-brand">Studi kasus industri keuangan</p>
      <h1 class="app-title">Pengajuan kredit digital</h1>
      <p class="app-sub">Formulir → verifikasi dokumen → scoring otomatis</p>
      <div id="step-indicator-mount"></div>
    </header>
    <main id="stage"></main>
  `;
  root.appendChild(shell);

  const indicatorEl = shell.querySelector('#step-indicator-mount');
  const stage = shell.querySelector('#stage');

  let previous = store.getState();
  let scoringTimer = null;

  function scheduleScoring() {
    if (scoringTimer) clearTimeout(scoringTimer);
    scoringTimer = setTimeout(() => {
      scoringTimer = null;
      runScoring(store);
    }, 1650);
  }

  function render() {
    const state = store.getState();

    if (
      state.step === 'scoring' &&
      state.scoringPhase === 'loading' &&
      !(
        previous.step === 'scoring' &&
        previous.scoringPhase === 'loading'
      )
    ) {
      scheduleScoring();
    }

    previous = state;

    indicatorEl.innerHTML = renderStepIndicator(state.step);

    let html = '';
    if (state.step === 'form') {
      html = renderFormPengajuan(state.applicant);
    } else if (state.step === 'verify') {
      html = renderVerifikasiDokumen(state.documents);
    } else if (state.step === 'scoring') {
      html = renderScoringLoading();
    } else if (state.step === 'result') {
      if (state.scoringPhase === 'error') {
        html = renderScoringError(state.scoringError);
      } else if (state.scoreResult) {
        html = renderHasilScoring(state.applicant, state.scoreResult);
      }
    }

    stage.innerHTML = html;

    if (state.step === 'form') {
      attachFormPengajuan(stage, store);
    } else if (state.step === 'verify') {
      attachVerifikasiDokumen(stage, store);
    } else if (state.step === 'result') {
      attachHasilScoring(stage, store);
    }
  }

  store.subscribe(render);
  render();

  return () => {
    if (scoringTimer) clearTimeout(scoringTimer);
    root.removeChild(shell);
  };
}
