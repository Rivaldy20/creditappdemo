/**
 * Scoring service layer (JSON API).
 * - mode "mock": hitung lokal untuk demo/dev.
 * - mode "uat": kirim request ke backend Java.
 */

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
 * }} CreditScoringInput
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
 * }} CreditScoringResponse
 */

function makeTraceId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}`;
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
 * Contract JSON request untuk backend Java (UAT).
 * @param {CreditScoringInput} input
 */
function toBackendPayload(input) {
  return {
    applicant: {
      fullName: input.fullName,
      phone: input.phone,
    },
    financial: {
      monthlyIncome: Number(input.monthlyIncome) || 0,
      monthlyDebt: Number(input.monthlyDebt) || 0,
      requestedLoanAmount: Number(input.loanAmount) || 0,
      purpose: input.purpose,
    },
    creditProfile: {
      paymentHistory: input.paymentHistory,
    },
  };
}

/**
 * Adapter response backend Java -> shape frontend.
 * Diharapkan backend kirim JSON:
 * {
 *   "traceId": "....",
 *   "evaluatedAt": "2026-04-28T02:00:00.000Z",
 *   "result": {
 *     "kolektibilitas": 2,
 *     "kolektibilitasLabel": "Dalam Perhatian Khusus",
 *     "internalScore": 74,
 *     "breakdown": {...},
 *     "recommendation": "..."
 *   }
 * }
 */
function fromBackendResponse(data) {
  const result = data?.result || {};
  return {
    kolektibilitas: Number(result.kolektibilitas) || 5,
    kolektibilitasLabel: String(result.kolektibilitasLabel || 'Macet'),
    internalScore: Number(result.internalScore) || 0,
    breakdown: {
      paymentHistory: Number(result.breakdown?.paymentHistory) || 0,
      income: Number(result.breakdown?.income) || 0,
      debtToIncome: Number(result.breakdown?.debtToIncome) || 0,
      dtiRatio:
        result.breakdown?.dtiRatio == null
          ? null
          : Number(result.breakdown.dtiRatio),
    },
    recommendation: String(result.recommendation || 'Tidak ada rekomendasi dari backend.'),
    source: 'uat-backend',
    traceId: String(data?.traceId || makeTraceId('uat')),
    evaluatedAt: String(data?.evaluatedAt || new Date().toISOString()),
  };
}

/**
 * UAT integration ke backend Java.
 * Env:
 * - VITE_SCORING_MODE=uat
 * - VITE_BACKEND_BASE_URL=http://host:port
 * - VITE_SCORING_PATH=/api/v1/credit-scoring/simulate
 */
async function callUatBackend(input) {
  const payload = toBackendPayload(input);
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
  return fromBackendResponse(json);
}

/**
 * MOCK implementation (offline/dev).
 * Tetap mempertahankan formula simulasi SLIK OJK.
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
  let recommendation = 'Risiko tinggi: perlu perbaikan riwayat pembayaran dan rasio utang sebelum diproses.';

  if (internalScore >= 85) {
    kolektibilitas = 1;
    kolektibilitasLabel = 'Lancar';
    recommendation = 'Sangat baik: profil pembayaran lancar, layak diprioritaskan.';
  } else if (internalScore >= 72) {
    kolektibilitas = 2;
    kolektibilitasLabel = 'Dalam Perhatian Khusus';
    recommendation = 'Cukup baik: dapat diproses dengan monitoring dan verifikasi lanjutan.';
  } else if (internalScore >= 58) {
    kolektibilitas = 3;
    kolektibilitasLabel = 'Kurang Lancar';
    recommendation = 'Perlu mitigasi: pertimbangkan plafon lebih rendah atau tenor lebih pendek.';
  } else if (internalScore >= 45) {
    kolektibilitas = 4;
    kolektibilitasLabel = 'Diragukan';
    recommendation = 'Risiko tinggi: butuh dokumen tambahan dan analisis manual.';
  }

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
  };
}
