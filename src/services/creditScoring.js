/**
 * Scoring service layer (JSON API).
 * - mode "mock": hitung lokal untuk demo/dev.
 * - mode "uat": kirim request ke backend Java.
 *
 * Kontrak wire JSON mengikuti `VITE_SCORING_SCHEMA`:
 * - `aegira` — snake_case nested (selaras pola Aegira Loan Service README)
 * - `kreditku` — camelCase nested (legacy)
 *
 * @see https://github.com/khalidalhabibie/aegira-loan-service/blob/master/README.md
 */

import {
  buildScoringRequestBody,
  normalizeScoringResponse,
  getDefaultRequestedTenure,
} from './scoringContract.js';

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const SCORING_MODE = (import.meta.env.VITE_SCORING_MODE || 'mock').toLowerCase();
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080';
const BACKEND_SCORING_PATH = import.meta.env.VITE_SCORING_PATH || '/api/v1/credit-scoring/simulate';

/** @typedef {'sangat_baik' | 'baik' | 'cukup' | 'buruk'} RiwayatPembayaran */

/**
 * @typedef {{
 *  fullName: string;
 *  phone: string;
 *  monthlyIncome: number;
 *  monthlyDebt: number;
 *  loanAmount: number;
 *  purpose: string;
 *  paymentHistory: RiwayatPembayaran;
 *  monthlyExpense?: number;
 *  requestedTenure?: number;
 * }} CreditScoringInput
 */

/**
 * @typedef {{
 *  currentDsr: number | null;
 *  projectedDsr: number | null;
 *  riskLevel: string | null;
 *  eligible: boolean | null;
 *  monthlyInstallment: number | null;
 * }} AegiraScoringMeta
 */

/**
 * @typedef {{
 *  kolektibilitas: number;
 *  kolektibilitasLabel: string;
 *  internalScore: number;
 *  breakdown: {
 *    paymentHistory: number;
 *    income: number;
 *    debtToIncome: number;
 *    dtiRatio: number | null;
 *  };
 *  recommendation: string;
 *  source: 'mock' | 'uat-backend';
 *  traceId: string;
 *  evaluatedAt: string;
 *  aegira: AegiraScoringMeta | null;
 * }} CreditScoringResponse
 */

function makeTraceId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}`;
}

/**
 * @param {number} kol
 * @returns {string}
 */
function kolektibilitasToRiskLevel(kol) {
  if (kol <= 1) return 'LOW';
  if (kol === 2) return 'MEDIUM';
  if (kol === 3) return 'MEDIUM';
  if (kol === 4) return 'HIGH';
  return 'HIGH';
}

/**
 * @param {CreditScoringInput} input
 * @param {{
 *  kolektibilitas: number;
 *  income: number;
 *  debt: number;
 * }} ctx
 * @returns {AegiraScoringMeta}
 */
function buildMockAegiraMeta(input, ctx) {
  const income = ctx.income;
  const debt = ctx.debt;
  const tenure = Number(input.requestedTenure) || getDefaultRequestedTenure();
  const loanAmount = Number(input.loanAmount) || 0;
  const newInstallment = tenure > 0 && loanAmount > 0 ? loanAmount / tenure : 0;

  const currentDsr = income > 0 ? Math.round((debt / income) * 10000) / 100 : null;
  const projectedDsr =
    income > 0 ? Math.round(((debt + newInstallment) / income) * 10000) / 100 : null;

  const kol = ctx.kolektibilitas;
  const eligible = kol <= 2 ? true : kol === 3 ? false : false;

  return {
    currentDsr,
    projectedDsr,
    riskLevel: kolektibilitasToRiskLevel(kol),
    eligible,
    monthlyInstallment: newInstallment > 0 ? Math.round(newInstallment) : null,
  };
}

/**
 * Public API untuk dipakai komponen UI.
 * @param {CreditScoringInput} input
 * @returns {Promise<CreditScoringResponse>}
 */
export async function scoreCreditApplication(input) {
  if (SCORING_MODE === 'uat') {
    return callUatBackend(input);
  }
  return scoreWithMock(input);
}

/**
 * @param {CreditScoringInput} input
 */
async function callUatBackend(input) {
  const payload = buildScoringRequestBody(input);
  const url = `${BACKEND_BASE_URL}${BACKEND_SCORING_PATH}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend scoring gagal (${res.status}): ${text || res.statusText}`);
  }

  const json = await res.json();
  const normalized = normalizeScoringResponse(json);

  return {
    kolektibilitas: normalized.kolektibilitas,
    kolektibilitasLabel: normalized.kolektibilitasLabel,
    internalScore: normalized.internalScore,
    breakdown: normalized.breakdown,
    recommendation:
      normalized.recommendation || 'Tidak ada rekomendasi dari backend.',
    source: 'uat-backend',
    traceId: normalized.traceId || makeTraceId('uat'),
    evaluatedAt: normalized.evaluatedAt || new Date().toISOString(),
    aegira: normalized.aegira,
  };
}

/**
 * MOCK implementation (offline/dev).
 * @param {CreditScoringInput} input
 * @returns {Promise<CreditScoringResponse>}
 */
async function scoreWithMock(input) {
  const income = Math.max(0, Number(input.monthlyIncome) || 0);
  const debt = Math.max(0, Number(input.monthlyDebt) || 0);
  const dti = income > 0 ? debt / income : 1;

  const paymentWeights = {
    sangat_baik: 100,
    baik: 82,
    cukup: 62,
    buruk: 35,
  };
  const paymentScore = paymentWeights[input.paymentHistory] ?? 50;

  let incomeScore = 40;
  if (income >= 15_000_000) incomeScore = 100;
  else if (income >= 10_000_000) incomeScore = 88;
  else if (income >= 7_000_000) incomeScore = 78;
  else if (income >= 5_000_000) incomeScore = 68;
  else if (income >= 3_000_000) incomeScore = 55;
  else if (income > 0) incomeScore = 42;

  let dtiScore = 70;
  if (income <= 0) dtiScore = 25;
  else if (dti <= 0.2) dtiScore = 100;
  else if (dti <= 0.35) dtiScore = 85;
  else if (dti <= 0.45) dtiScore = 68;
  else if (dti <= 0.55) dtiScore = 48;
  else dtiScore = 28;

  const weighted = paymentScore * 0.4 + incomeScore * 0.3 + dtiScore * 0.3;
  const internalScore = clamp(Math.round(weighted), 0, 100);

  let kolektibilitas = 5;
  let kolektibilitasLabel = 'Macet';
  let recommendation =
    'Risiko tinggi: perlu perbaikan riwayat pembayaran dan rasio utang sebelum diproses.';

  if (internalScore >= 85) {
    kolektibilitas = 1;
    kolektibilitasLabel = 'Lancar';
    recommendation = 'Sangat baik: profil pembayaran lancar, layak diprioritaskan.';
  } else if (internalScore >= 72) {
    kolektibilitas = 2;
    kolektibilitasLabel = 'Dalam Perhatian Khusus';
    recommendation =
      'Cukup baik: dapat diproses dengan monitoring dan verifikasi lanjutan.';
  } else if (internalScore >= 58) {
    kolektibilitas = 3;
    kolektibilitasLabel = 'Kurang Lancar';
    recommendation =
      'Perlu mitigasi: pertimbangkan plafon lebih rendah atau tenor lebih pendek.';
  } else if (internalScore >= 45) {
    kolektibilitas = 4;
    kolektibilitasLabel = 'Diragukan';
    recommendation =
      'Risiko tinggi: butuh dokumen tambahan dan analisis manual.';
  }

  const aegira = buildMockAegiraMeta(input, {
    kolektibilitas,
    income,
    debt,
  });

  return {
    kolektibilitas,
    kolektibilitasLabel,
    internalScore,
    breakdown: {
      paymentHistory: Math.round(paymentScore),
      income: Math.round(incomeScore),
      debtToIncome: Math.round(dtiScore),
      dtiRatio: income > 0 ? Math.round(dti * 1000) / 10 : null,
    },
    recommendation,
    source: 'mock',
    traceId: makeTraceId('mock'),
    evaluatedAt: new Date().toISOString(),
    aegira,
  };
}
