/**
 * Kontrak request/response scoring — selaras pola Aegira Loan Service (snake_case JSON)
 * @see https://github.com/khalidalhabibie/aegira-loan-service/blob/master/README.md
 *
 * Mode:
 * - `kreditku` — nested camelCase (legacy / gateway custom)
 * - `aegira` — nested snake_case, field mirip customer + loan application + DSR
 */

const SCHEMA = (import.meta.env.VITE_SCORING_SCHEMA || 'aegira').toLowerCase();
const DEFAULT_TENURE = Math.max(1, Number(import.meta.env.VITE_SCORING_DEFAULT_TENURE) || 12);

const PURPOSE_TO_LOAN_PURPOSE = {
  modal_kerja: 'Business working capital',
  pendidikan: 'Education',
  renovasi: 'Home renovation',
  lainnya: 'Other',
};

/** @param {string} purpose */
export function mapPurposeToLoanPurpose(purpose) {
  return PURPOSE_TO_LOAN_PURPOSE[purpose] || PURPOSE_TO_LOAN_PURPOSE.lainnya;
}

export function getScoringSchema() {
  return SCHEMA === 'kreditku' ? 'kreditku' : 'aegira';
}

export function getDefaultRequestedTenure() {
  return DEFAULT_TENURE;
}

/** @param {Record<string, unknown>} input */
export function buildScoringRequestBody(input) {
  if (getScoringSchema() === 'kreditku') {
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

  return {
    applicant: {
      full_name: String(input.fullName || '').trim(),
      phone_number: String(input.phone || '').trim(),
    },
    financial: {
      monthly_income: Number(input.monthlyIncome) || 0,
      monthly_expense: Number(input.monthlyExpense ?? 0) || 0,
      existing_installment: Number(input.monthlyDebt) || 0,
      requested_amount: Number(input.loanAmount) || 0,
      requested_tenure: Number(input.requestedTenure) || DEFAULT_TENURE,
      loan_purpose: mapPurposeToLoanPurpose(String(input.purpose || 'lainnya')),
    },
    credit_profile: {
      payment_history: String(input.paymentHistory || 'baik'),
    },
  };
}

function read(obj, snake, camel, fallback = undefined) {
  if (obj == null) return fallback;
  const v = obj[snake] ?? obj[camel];
  return v === undefined || v === null ? fallback : v;
}

function readNum(obj, snake, camel, fallback = 0) {
  const v = read(obj, snake, camel, fallback);
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalisasi response backend (snake_case / camelCase / envelope `data`).
 * @param {unknown} raw
 */
export function normalizeScoringResponse(raw) {
  const root = raw && typeof raw === 'object' && 'data' in raw && raw.data != null ? raw.data : raw;
  if (!root || typeof root !== 'object') {
    throw new Error('Response scoring tidak valid (bukan object JSON).');
  }

  const result =
    root && typeof root === 'object' && root.result != null && typeof root.result === 'object'
      ? root.result
      : root;
  const breakdown = read(result, 'breakdown', 'breakdown', {}) || {};

  const calc =
    read(root, 'calculation', 'calculation', null) ||
    read(result, 'calculation', 'calculation', null) ||
    {};
  const elig =
    read(root, 'eligibility', 'eligibility', null) ||
    read(result, 'eligibility', 'eligibility', null) ||
    {};

  const currentDsr = readNum(calc, 'current_dsr', 'currentDsr', NaN);
  const projectedDsr = readNum(calc, 'projected_dsr', 'projectedDsr', NaN);
  const monthlyInstallment = readNum(
    calc,
    'monthly_installment',
    'monthlyInstallment',
    NaN,
  );

  const riskLevel = read(elig, 'risk_level', 'riskLevel', null);
  const eligibleRaw = read(elig, 'eligible', 'eligible', null);
  const eligible =
    typeof eligibleRaw === 'boolean'
      ? eligibleRaw
      : eligibleRaw == null
        ? null
        : String(eligibleRaw).toLowerCase() === 'true';

  const aegira =
    Number.isFinite(currentDsr) ||
    Number.isFinite(projectedDsr) ||
    riskLevel != null ||
    eligible != null ||
    Number.isFinite(monthlyInstallment)
      ? {
          currentDsr: Number.isFinite(currentDsr) ? Math.round(currentDsr * 100) / 100 : null,
          projectedDsr: Number.isFinite(projectedDsr) ? Math.round(projectedDsr * 100) / 100 : null,
          riskLevel: riskLevel != null ? String(riskLevel) : null,
          eligible,
          monthlyInstallment: Number.isFinite(monthlyInstallment) ? monthlyInstallment : null,
        }
      : null;

  const dtiRatioRaw = read(breakdown, 'dti_ratio', 'dtiRatio', null);

  const kolRaw = readNum(result, 'kolektibilitas', 'kolektibilitas', 5);
  return {
    kolektibilitas: Math.min(5, Math.max(1, Math.round(kolRaw))),
    kolektibilitasLabel: String(
      read(result, 'kolektibilitas_label', 'kolektibilitasLabel', 'Macet'),
    ),
    internalScore: Math.round(readNum(result, 'internal_score', 'internalScore', 0)),
    breakdown: {
      paymentHistory: Math.round(readNum(breakdown, 'payment_history', 'paymentHistory', 0)),
      income: Math.round(readNum(breakdown, 'income', 'income', 0)),
      debtToIncome: Math.round(readNum(breakdown, 'debt_to_income', 'debtToIncome', 0)),
      dtiRatio:
        dtiRatioRaw === null || dtiRatioRaw === undefined || dtiRatioRaw === ''
          ? null
          : Math.round(Number(dtiRatioRaw) * 1000) / 1000,
    },
    recommendation: String(read(result, 'recommendation', 'recommendation', '')),
    traceId: String(read(root, 'trace_id', 'traceId', '')),
    evaluatedAt: String(read(root, 'evaluated_at', 'evaluatedAt', new Date().toISOString())),
    aegira,
  };
}
