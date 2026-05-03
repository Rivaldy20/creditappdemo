export const initialState = {
  step: 'form',
  applicant: {
    fullName: '',
    phone: '',
    monthlyIncome: '',
    monthlyDebt: '',
    loanAmount: '',
    purpose: 'modal_kerja',
    paymentHistory: 'baik',
  },
  documents: [
    { id: 'ktp', name: 'KTP elektronik / identitas', verified: false },
    { id: 'slip', name: 'Slip gaji 3 bulan terakhir', verified: false },
    { id: 'npwp', name: 'NPWP', verified: false },
  ],
  scoreResult: null,
  scoringPhase: 'idle',
  scoringError: '',
};
